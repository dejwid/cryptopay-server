import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Heading, Table, Text, Badge, Separator } from "@radix-ui/themes";
import { ClockIcon, ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import { prettyDate } from "@/libs/dates";
import ManuallyApproveInvoiceButton from "@/app/components/ManuallyApproveInvoiceButton";
import InvoiceEmailActions from "@/app/components/InvoiceEmailActions";
import { PaymentStatusBadge } from "@/app/components/PaymentStatusBadge";
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

  // Get email logs for this invoice
  const emailLogs = await prisma.emailLog.findMany({
    where: { invoiceId: invoice.id },
    orderBy: { createdAt: 'desc' },
  });
  
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
                     <PaymentStatusBadge
                       paidAt={invoice.paidAt}
                       manuallyApprovedAt={invoice.manuallyApprovedAt}
                       receivedAmount10pow10={totalReceived > 0 ? totalReceived : null}
                       paymentPercentage={paymentPercentage}
                       coinCode={invoice.coinCode}
                     />
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
               <PaymentStatusBadge
                 paidAt={invoice.paidAt}
                 manuallyApprovedAt={invoice.manuallyApprovedAt}
                 receivedAmount10pow10={totalReceived > 0 ? totalReceived : null}
                 paymentPercentage={paymentPercentage}
                 coinCode={invoice.coinCode}
               />
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

      {/* Email Actions - only show for paid invoices */}
      {invoice.paidAt && (
        <div className="mt-4">
          <InvoiceEmailActions
            invoiceId={invoice.id}
            payerEmail={invoice.payerEmail}
            payeeEmail={invoice.payeeEmail}
            hasProduct={!!invoice.productId}
            invoiceTitle={invoice.title}
            coinAmount10pow10={invoice.coinAmount10pow10}
            coinCode={invoice.coinCode}
            usdAmountCents={invoice.usdAmountCents}
            manuallyApprovedAt={invoice.manuallyApprovedAt}
          />
        </div>
      )}

      {/* Email Logs for this invoice */}
      {emailLogs.length > 0 && (
        <Card size="3" className="mt-4">
          <Flex gap="2" align="center" mb="3">
            <Heading size="4">Email Log</Heading>
            <Badge color="gray" variant="soft">{emailLogs.length}</Badge>
          </Flex>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>To</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Subject</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {emailLogs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>
                      {log.status === 'sent' ? (
                        <Flex gap="1" align="center">
                          <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                          <Badge color="green" variant="soft" size="1">Sent</Badge>
                        </Flex>
                      ) : (
                        <Flex gap="1" align="center">
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                          <Badge color="red" variant="soft" size="1">Failed</Badge>
                        </Flex>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-500 whitespace-nowrap">
                      {prettyDate(log.createdAt)}
                    </Table.Cell>
                    <Table.Cell className="text-sm">{log.to.join(', ')}</Table.Cell>
                    <Table.Cell className="text-sm">{log.subject}</Table.Cell>
                    <Table.Cell>
                      {log.error ? (
                        <details>
                          <summary className="text-xs text-red-600 cursor-pointer">Error</summary>
                          <pre className="mt-1 bg-red-50 p-2 rounded text-xs text-red-700 max-w-xs overflow-auto">{log.error}</pre>
                        </details>
                      ) : log.mailgunResponse ? (
                        <details>
                          <summary className="text-xs text-gray-500 cursor-pointer">Response</summary>
                          <pre className="mt-1 bg-gray-50 p-2 rounded text-xs text-gray-700 max-w-xs overflow-auto">
                            {(() => {
                              try { return JSON.stringify(JSON.parse(log.mailgunResponse!), null, 2); }
                              catch { return log.mailgunResponse; }
                            })()}
                          </pre>
                        </details>
                      ) : '-'}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {emailLogs.map((log) => (
              <div key={log.id} className="bg-gray-50 rounded p-3">
                <Flex justify="between" align="start" mb="1">
                  <Text size="2" weight="medium">{log.subject}</Text>
                  {log.status === 'sent' ? (
                    <Badge color="green" variant="soft" size="1">Sent</Badge>
                  ) : (
                    <Badge color="red" variant="soft" size="1">Failed</Badge>
                  )}
                </Flex>
                <Text size="1" color="gray" className="block">{prettyDate(log.createdAt)}</Text>
                <Text size="1" className="block">To: {log.to.join(', ')}</Text>
                {log.error && (
                  <details className="mt-1">
                    <summary className="text-xs text-red-600 cursor-pointer">Error</summary>
                    <pre className="mt-1 bg-red-50 p-1 rounded text-xs text-red-700 overflow-auto">{log.error}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </Box>
  );
}
