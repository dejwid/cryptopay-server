import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Heading, Table, Text, Badge, Separator } from "@radix-ui/themes";
import { ArrowLeftIcon, ClockIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import { prettyDate } from "@/libs/dates";
import { getCryptoPrices, CoinCode } from "@/libs/cryptoPrices";
import BalanceRefresh from "@/app/components/BalanceRefresh";
import { PaymentStatusBadge } from "@/app/components/PaymentStatusBadge";

export default async function AddressDetailPage({ params }: { params: { addressId: string } }) {
  const email = await userEmailOrThrow();
  const { addressId } = params;
  
  const address = await prisma.address.findFirst({
    where: { id: addressId, userEmail: email },
  });
  
  if (!address) {
    notFound();
  }
  
  // Get balance changes for this address
  const balanceChanges = await prisma.balanceChange.findMany({
    where: { addressId: address.id },
    orderBy: { createdAt: 'desc' },
  });
  
  // Get invoices that used this address
  const invoices = await prisma.invoice.findMany({
    where: { paidToAddressId: address.id },
    orderBy: { createdAt: 'desc' },
  });
  
  // Get current invoice assigned to this address (if busy)
  const currentInvoice = address.invoiceId
    ? await prisma.invoice.findFirst({
        where: { id: address.invoiceId }
      })
    : null;
  
  // Get product for the current invoice if it exists
  const currentProduct = currentInvoice?.productId
    ? await prisma.product.findFirst({
        where: { id: currentInvoice.productId }
      })
    : null;
  
  // Get crypto prices for USD conversion
  const cryptoPrices = await getCryptoPrices();
  const cryptoAmount = (address.lastBalance10pow10 || 0) / 10**10;
  const usdAmount = cryptoAmount === 0 ? 0 : cryptoAmount * cryptoPrices?.[address.code as CoinCode];
  
  // Calculate total received from balance changes
  const totalReceived = balanceChanges.reduce((sum, bc) => sum + bc.balanceChange10pow10, 0);
  
  return (
    <Box>
      <Flex gap="3" align="center" mb="4">
        <Link href="/addresses">
          <Button variant="ghost" size="1">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Back to wallets</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </Flex>
      
      <Flex gap="3" align="center" mb="4">
        <Heading size="6">Wallet Details</Heading>
        <Badge size="2" color="blue">{address.code.toUpperCase()}</Badge>
        {address.busyTo && new Date(address.busyTo) > new Date() && (
          <Badge size="2" color="orange">Busy</Badge>
        )}
      </Flex>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Address Info Card */}
        <Card size="3">
          <Heading size="4" mb="3">Address Information</Heading>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table.Root>
              <Table.Body>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Address</Table.Cell>
                  <Table.Cell className="font-mono text-xs break-all">
                    <Flex gap="2" align="center">
                      {address.address}
                      <Link 
                        href={`https://www.blockchain.com/${address.code}/address/${address.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </Link>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Balance</Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" align="center">
                      <div>
                        {cryptoAmount} {address.code.toUpperCase()}<br />
                        {usdAmount === 0 ? 0 : '~' + usdAmount.toFixed(4)} USD
                      </div>
                      <BalanceRefresh
                        addressId={address.id}
                        address={address.address}
                        code={address.code}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Balance Updated</Table.Cell>
                  <Table.Cell>
                    {address.balanceUpdatedAt ? prettyDate(address.balanceUpdatedAt) : 'Never'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Status</Table.Cell>
                  <Table.Cell>
                    {address.busyTo && new Date(address.busyTo) > new Date() ? (
                      <Text color="orange">Busy until {prettyDate(address.busyTo)}</Text>
                    ) : (
                      <Text color="green">Available</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Added</Table.Cell>
                  <Table.Cell>
                    <Flex gap="1" align="center">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {prettyDate(address.createdAt)}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-3">
            <div className="py-2 border-b">
              <div className="text-gray-500 mb-1">Address</div>
              <Flex gap="2" align="center">
                <div className="font-mono text-xs break-all flex-1">{address.address}</div>
                <Link 
                  href={`https://www.blockchain.com/${address.code}/address/${address.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="w-4 h-4 text-gray-400" />
                </Link>
              </Flex>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Balance</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium">{cryptoAmount} {address.code.toUpperCase()}</div>
                  <div className="text-gray-500 text-sm">{usdAmount === 0 ? 0 : '~' + usdAmount.toFixed(4)} USD</div>
                </div>
                <BalanceRefresh
                  addressId={address.id}
                  address={address.address}
                  code={address.code}
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Status</span>
              {address.busyTo && new Date(address.busyTo) > new Date() ? (
                <Text color="orange" size="2">Busy</Text>
              ) : (
                <Text color="green" size="2">Available</Text>
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Added</span>
              <Flex gap="1" align="center">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{prettyDate(address.createdAt)}</span>
              </Flex>
            </div>
          </div>
        </Card>
        
        {/* Current Invoice Card */}
        <Card size="3">
          <Heading size="4" mb="3">Current Assignment</Heading>
          
          {currentInvoice ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table.Root>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Invoice</Table.Cell>
                      <Table.Cell>
                        <Link href={`/invoices/${currentInvoice.id}`} className="text-blue-600 hover:underline">
                          {currentInvoice.title}
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                    {currentProduct && (
                      <Table.Row>
                        <Table.Cell className="text-gray-500">Product</Table.Cell>
                        <Table.Cell>{currentProduct.name}</Table.Cell>
                      </Table.Row>
                    )}
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Amount</Table.Cell>
                      <Table.Cell>
                        ${((currentInvoice.usdAmountCents || 0) / 100).toFixed(2)} USD
                        {currentInvoice.coinAmount10pow10 && (
                          <span className="text-gray-500 ml-2">
                            ({(currentInvoice.coinAmount10pow10 / 10**10).toFixed(8)} {currentInvoice.coinCode?.toUpperCase()})
                          </span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Status</Table.Cell>
                      <Table.Cell>
                        <PaymentStatusBadge
                          paidAt={currentInvoice.paidAt}
                          manuallyApprovedAt={currentInvoice.manuallyApprovedAt}
                        />
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Busy From</Table.Cell>
                      <Table.Cell>{address.busyFrom ? prettyDate(address.busyFrom) : '-'}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell className="text-gray-500">Busy Until</Table.Cell>
                      <Table.Cell>{address.busyTo ? prettyDate(address.busyTo) : '-'}</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </div>

              {/* Mobile List View */}
              <div className="sm:hidden space-y-3">
                <div className="flex justify-between items-start py-2 border-b">
                  <span className="text-gray-500">Invoice</span>
                  <Link href={`/invoices/${currentInvoice.id}`} className="text-blue-600 text-right">
                    {currentInvoice.title}
                  </Link>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-right">
                    <div>${((currentInvoice.usdAmountCents || 0) / 100).toFixed(2)} USD</div>
                    {currentInvoice.coinAmount10pow10 && (
                      <div className="text-gray-500 text-sm">
                        {(currentInvoice.coinAmount10pow10 / 10**10).toFixed(8)} {currentInvoice.coinCode?.toUpperCase()}
                      </div>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Status</span>
                  <PaymentStatusBadge
                    paidAt={currentInvoice.paidAt}
                    manuallyApprovedAt={currentInvoice.manuallyApprovedAt}
                  />
                </div>
              </div>
              
              <Box mt="4">
                <Link href={`/invoices/${currentInvoice.id}`}>
                  <Button variant="outline" size="1">
                    View Invoice
                  </Button>
                </Link>
              </Box>
            </>
          ) : (
            <Text color="gray">No invoice currently assigned to this address.</Text>
          )}
        </Card>
      </div>

      {/* Balance Changes */}
      <Card size="3" className="mt-4">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Balance Changes</Heading>
          <Badge color="gray" variant="soft">{balanceChanges.length}</Badge>
        </Flex>
        
        {balanceChanges.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Previous Balance</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>New Balance</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Change</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {balanceChanges.map((bc) => (
                    <Table.Row key={bc.id}>
                      <Table.Cell className="text-gray-500 text-sm">
                        {prettyDate(bc.createdAt)}
                      </Table.Cell>
                      <Table.Cell className="font-mono text-sm">
                        {(bc.oldBalance10pow10 / 10**10).toFixed(8)} {address.code.toUpperCase()}
                      </Table.Cell>
                      <Table.Cell className="font-mono text-sm">
                        {(bc.newBalance10pow10 / 10**10).toFixed(8)} {address.code.toUpperCase()}
                      </Table.Cell>
                      <Table.Cell className={
                        bc.balanceChange10pow10 > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                      }>
                        {bc.balanceChange10pow10 > 0 ? '+' : ''}
                        {(bc.balanceChange10pow10 / 10**10).toFixed(8)} {address.code.toUpperCase()}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {balanceChanges.map((bc) => (
                <div key={bc.id} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">{prettyDate(bc.createdAt)}</span>
                    <span className={
                      bc.balanceChange10pow10 > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                    }>
                      {bc.balanceChange10pow10 > 0 ? '+' : ''}
                      {(bc.balanceChange10pow10 / 10**10).toFixed(8)} {address.code.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>From: {(bc.oldBalance10pow10 / 10**10).toFixed(8)}</div>
                    <div>To: {(bc.newBalance10pow10 / 10**10).toFixed(8)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Text color="gray">No balance changes recorded for this address.</Text>
        )}
      </Card>

      {/* Paid Invoices */}
      <Card size="3" className="mt-4">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Paid Invoices</Heading>
          <Badge color="gray" variant="soft">{invoices.length}</Badge>
        </Flex>
        
        {invoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Paid At</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {invoices.map((invoice) => (
                    <Table.Row key={invoice.id}>
                      <Table.Cell>{invoice.title}</Table.Cell>
                      <Table.Cell>
                        ${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD
                        {invoice.coinAmount10pow10 && (
                          <span className="text-gray-500 ml-2 text-sm">
                            ({(invoice.coinAmount10pow10 / 10**10).toFixed(8)} {invoice.coinCode?.toUpperCase()})
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {invoice.paidAt ? (
                          <Text color="green">{prettyDate(invoice.paidAt)}</Text>
                        ) : (
                          <Text color="gray">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="1">
                            View
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {invoices.map((invoice) => (
                <Link 
                  key={invoice.id} 
                  href={`/invoices/${invoice.id}`}
                  className="block bg-gray-50 rounded p-3 hover:bg-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{invoice.title}</span>
                    {invoice.paidAt && (
                      <Badge color="green" size="1">Paid</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    ${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD
                  </div>
                  {invoice.paidAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Paid: {prettyDate(invoice.paidAt)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Text color="gray">No paid invoices associated with this address.</Text>
        )}
      </Card>
    </Box>
  );
}
