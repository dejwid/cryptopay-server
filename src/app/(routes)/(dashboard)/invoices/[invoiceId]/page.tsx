import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Heading, Table, Text, Badge, Separator } from "@radix-ui/themes";
import { BadgeCheck, AlertTriangleIcon, ClockIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import { prettyDate } from "@/libs/dates";
import ManuallyApproveInvoiceButton from "@/app/components/ManuallyApproveInvoiceButton";
import { maxPaymentShortfall } from "@/libs/config";

// Calculate thresholds: 90-110% is acceptable (using maxPaymentShortfall = 0.1)
const minAcceptablePercentage = (1 - maxPaymentShortfall) * 100; // 90%
const maxAcceptablePercentage = (1 + maxPaymentShortfall) * 100; // 110%

export default async function InvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const email = await userEmailOrThrow();
  const { invoiceId } = params;
  
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, payeeEmail: email },
  });
  
  if (!invoice) {
    notFound();
  }
  
  // Fetch product separately if productId exists
  const product = invoice.productId 
    ? await prisma.product.findFirst({ where: { id: invoice.productId } })
    : null;
  
  // Find the address assigned to this invoice
  const address = await prisma.address.findFirst({
    where: { invoiceId: invoice.id },
    orderBy: { busyFrom: 'desc' },
  });
  
  // Get balance changes for this address during the busy period
  let balanceChanges: Array<{
    id: string;
    balanceChange10pow10: number;
    createdAt: Date;
  }> = [];
  let totalReceived = 0;
  let paymentPercentage: number | null = null;
  
  if (address && address.busyFrom) {
    balanceChanges = await prisma.balanceChange.findMany({
      where: {
        addressId: address.id,
        createdAt: { gte: address.busyFrom },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        balanceChange10pow10: true,
        createdAt: true,
      },
    });
    
    totalReceived = balanceChanges.reduce((sum, bc) => sum + bc.balanceChange10pow10, 0);
    
    if (invoice.coinAmount10pow10 && totalReceived > 0) {
      paymentPercentage = (totalReceived / invoice.coinAmount10pow10) * 100;
    }
  }
  
  const getPaymentStatus = () => {
    if (invoice.paidAt) {
      return { label: "Paid", color: "green" as const, icon: BadgeCheck, textColor: "text-green-600" };
    }
    if (!paymentPercentage || totalReceived === 0) {
      return { label: "No payment detected", color: "red" as const, icon: AlertTriangleIcon, textColor: "text-red-600" };
    }
    if (paymentPercentage > maxAcceptablePercentage) {
      return { label: "Overpaid", color: "purple" as const, icon: BadgeCheck, textColor: "text-purple-600" };
    }
    if (paymentPercentage >= minAcceptablePercentage) {
      return { label: "Acceptable", color: "green" as const, icon: BadgeCheck, textColor: "text-green-600" };
    }
    return { label: "Underpaid", color: "red" as const, icon: AlertTriangleIcon, textColor: "text-red-600" };
  };
  
  const status = getPaymentStatus();
  const StatusIcon = status.icon;
  
  return (
    <Box>
      <Flex gap="3" align="center" mb="4">
        <Link href="/invoices">
          <Button variant="ghost" size="1">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Back to invoices</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </Flex>
      
      <Heading size="6" mb="4" className="break-words">Invoice: {invoice.title}</Heading>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Invoice Details Card */}
        <Card size="3">
          <Heading size="4" mb="3">Invoice Details</Heading>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table.Root>
              <Table.Body>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Status</Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" align="center">
                      <Text color={status.color}>
                        <StatusIcon className="w-4 h-4 inline mr-1" />
                        {status.label}
                      </Text>
                      {invoice.manuallyApprovedAt && (
                        <Badge color="orange">manual approval</Badge>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Payer Email</Table.Cell>
                  <Table.Cell className="break-all">{invoice.payerEmail || '-'}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Product</Table.Cell>
                  <Table.Cell>{product?.name || '-'}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">USD Amount</Table.Cell>
                  <Table.Cell>${(invoice.usdAmountCents / 100).toFixed(2)}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Crypto Amount</Table.Cell>
                  <Table.Cell>
                    {invoice.coinAmount10pow10 
                      ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                      : 'Not selected'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Created</Table.Cell>
                  <Table.Cell>
                    <Flex gap="1" align="center">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {prettyDate(invoice.createdAt)}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                {invoice.paidAt && (
                  <Table.Row>
                    <Table.Cell className="text-gray-500">Paid At</Table.Cell>
                    <Table.Cell>
                      <Text color="green">{prettyDate(invoice.paidAt)}</Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Status</span>
              <Flex gap="2" align="center">
                <Text color={status.color}>
                  <StatusIcon className="w-4 h-4 inline mr-1" />
                  {status.label}
                </Text>
                {invoice.manuallyApprovedAt && (
                  <Badge color="orange">manual</Badge>
                )}
              </Flex>
            </div>
            <div className="flex justify-between items-start py-2 border-b">
              <span className="text-gray-500">Payer Email</span>
              <span className="text-right break-all max-w-[60%]">{invoice.payerEmail || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Product</span>
              <span>{product?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">USD Amount</span>
              <span className="font-medium">${(invoice.usdAmountCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Crypto</span>
              <span className="text-right">
                {invoice.coinAmount10pow10 
                  ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                  : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Created</span>
              <Flex gap="1" align="center">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                {prettyDate(invoice.createdAt)}
              </Flex>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-500">Paid At</span>
                <Text color="green">{prettyDate(invoice.paidAt)}</Text>
              </div>
            )}
          </div>
          
          {!invoice.paidAt && (
            <Box mt="4">
              <ManuallyApproveInvoiceButton
                invoiceId={invoice.id}
                invoiceTitle={invoice.title}
              />
            </Box>
          )}
        </Card>
        
        {/* Payment Details Card */}
        <Card size="3">
          <Heading size="4" mb="3">Payment Details</Heading>
          
          {address ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table.Root>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Payment Address</Table.Cell>
                      <Table.Cell className="font-mono text-xs break-all">
                        {address.address}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Address Assigned</Table.Cell>
                      <Table.Cell>
                        {address.busyFrom ? prettyDate(address.busyFrom) : '-'}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Expected Amount</Table.Cell>
                      <Table.Cell>
                        {invoice.coinAmount10pow10 
                          ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                          : '-'}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Received Amount</Table.Cell>
                      <Table.Cell>
                        {totalReceived > 0 
                          ? `${(totalReceived / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                          : 'None'}
                      </Table.Cell>
                    </Table.Row>
                    {paymentPercentage !== null && (
                      <Table.Row>
                        <Table.Cell className="text-gray-500">Payment %</Table.Cell>
                        <Table.Cell>
                          <span className={
                            paymentPercentage > maxAcceptablePercentage 
                              ? 'text-purple-600 font-bold' 
                              : paymentPercentage < minAcceptablePercentage 
                                ? 'text-red-600 font-bold' 
                                : 'text-green-600'
                          }>
                            {paymentPercentage.toFixed(1)}%
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </div>

              {/* Mobile List View */}
              <div className="sm:hidden space-y-3">
                <div className="py-2 border-b">
                  <div className="text-gray-500 mb-1">Payment Address</div>
                  <div className="font-mono text-xs break-all">
                    {address.address}
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Address Assigned</span>
                  <span>{address.busyFrom ? prettyDate(address.busyFrom) : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Expected</span>
                  <span className="text-right">
                    {invoice.coinAmount10pow10 
                      ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Received</span>
                  <span className={totalReceived > 0 ? 'text-green-600' : ''}>
                    {totalReceived > 0 
                      ? `${(totalReceived / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                      : 'None'}
                  </span>
                </div>
                {paymentPercentage !== null && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-500">Payment %</span>
                    <span className={
                      paymentPercentage > maxAcceptablePercentage 
                        ? 'text-purple-600 font-bold' 
                        : paymentPercentage < minAcceptablePercentage 
                          ? 'text-red-600 font-bold' 
                          : 'text-green-600'
                    }>
                      {paymentPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Balance Changes */}
              {balanceChanges.length > 0 && (
                <>
                  <Separator size="4" my="4" />
                  <Heading size="3" mb="2">Balance Changes</Heading>
                  
                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {balanceChanges.map((bc) => (
                          <Table.Row key={bc.id}>
                            <Table.Cell className="text-gray-500 text-sm">
                              {prettyDate(bc.createdAt)}
                            </Table.Cell>
                            <Table.Cell className={
                              bc.balanceChange10pow10 > 0 ? 'text-green-600' : 'text-red-600'
                            }>
                              {bc.balanceChange10pow10 > 0 ? '+' : ''}
                              {(bc.balanceChange10pow10 / 10**10).toFixed(8)} {(invoice.coinCode || '').toUpperCase()}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2">
                    {balanceChanges.map((bc) => (
                      <div key={bc.id} className="bg-gray-50 rounded p-3 flex justify-between items-center">
                        <span className="text-gray-500 text-sm">{prettyDate(bc.createdAt)}</span>
                        <span className={
                          bc.balanceChange10pow10 > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                        }>
                          {bc.balanceChange10pow10 > 0 ? '+' : ''}
                          {(bc.balanceChange10pow10 / 10**10).toFixed(8)} {(invoice.coinCode || '').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <Text color="gray">No payment address assigned yet.</Text>
          )}
        </Card>
      </div>
    </Box>
  );
}
