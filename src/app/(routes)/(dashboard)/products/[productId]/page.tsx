import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Heading, Table, Text, Badge, Separator } from "@radix-ui/themes";
import { ArrowLeftIcon, ClockIcon, PackageIcon, MailIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import { prettyDate } from "@/libs/dates";
import { PaymentStatusBadge } from "@/app/components/PaymentStatusBadge";

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const email = await userEmailOrThrow();
  const { productId } = params;
  
  const product = await prisma.product.findFirst({
    where: { id: productId, userEmail: email },
  });
  
  if (!product) {
    notFound();
  }
  
  // Get invoices for this product with address info
  const invoices = await prisma.invoice.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
  });
  
  // Get access codes for this product
  const accessCodes = await prisma.productAccessCode.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
  });
  
  // Get all invoice IDs for fetching email logs
  const invoiceIds = invoices.map(i => i.id);
  
  // Get email logs for all invoices of this product
  const emailLogs = await prisma.emailLog.findMany({
    where: { 
      invoiceId: { in: invoiceIds }
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to recent 50
  });
  
  // Get addresses used for this product's invoices
  const invoiceIdList = invoices.map(i => i.id);
  const addresses = await prisma.address.findMany({
    where: { 
      invoiceId: { in: invoiceIdList }
    },
    orderBy: { busyFrom: 'desc' },
  });
  
  // Calculate stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.paidAt).length;
  const totalRevenue = invoices
    .filter(i => i.paidAt)
    .reduce((sum, i) => sum + (i.usdAmountCents || 0), 0);
  
  // Access code stats
  const totalAccessCodes = accessCodes.length;
  const activatedCodes = accessCodes.filter(c => c.activatedAt).length;
  const emailedCodes = accessCodes.filter(c => c.emailedTo).length;
  
  // Create a map of invoice id to address for easy lookup
  const addressMap = new Map(addresses.map(a => [a.invoiceId, a]));
  
  return (
    <Box>
      <Flex gap="3" align="center" mb="4">
        <Link href="/products">
          <Button variant="ghost" size="1">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Back to products</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </Flex>
      
      <Flex gap="3" align="center" mb="4">
        <Heading size="6">{product.name}</Heading>
        {product.archivedAt && (
          <Badge color="gray" variant="soft">Archived</Badge>
        )}
      </Flex>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Product Info Card */}
        <Card size="3">
          <Heading size="4" mb="3">Product Details</Heading>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table.Root>
              <Table.Body>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Name</Table.Cell>
                  <Table.Cell>{product.name}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Description</Table.Cell>
                  <Table.Cell className="whitespace-pre-wrap">{product.description || '-'}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Price</Table.Cell>
                  <Table.Cell>
                    {product.usdCents ? `$${(product.usdCents / 100).toFixed(2)} USD` : 'Not set'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Uploads</Table.Cell>
                  <Table.Cell>{product.uploads.length} file(s)</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="text-gray-500">Created</Table.Cell>
                  <Table.Cell>
                    <Flex gap="1" align="center">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {product.createdAt ? prettyDate(product.createdAt) : '-'}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                {product.archivedAt && (
                  <Table.Row>
                    <Table.Cell className="text-gray-500">Archived</Table.Cell>
                    <Table.Cell>
                      <Text color="gray">{prettyDate(product.archivedAt)}</Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-3">
            <div className="flex justify-between items-start py-2 border-b">
              <span className="text-gray-500">Name</span>
              <span className="text-right font-medium">{product.name}</span>
            </div>
            <div className="py-2 border-b">
              <div className="text-gray-500 mb-1">Description</div>
              <div className="whitespace-pre-wrap">{product.description || '-'}</div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Price</span>
              <span className="font-medium">
                {product.usdCents ? `$${(product.usdCents / 100).toFixed(2)} USD` : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Uploads</span>
              <span>{product.uploads.length} file(s)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Created</span>
              <Flex gap="1" align="center">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{product.createdAt ? prettyDate(product.createdAt) : '-'}</span>
              </Flex>
            </div>
            {product.archivedAt && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-500">Archived</span>
                <Text color="gray">{prettyDate(product.archivedAt)}</Text>
              </div>
            )}
          </div>
          
          <Box mt="4">
            <Flex gap="2" wrap="wrap">
              <Link href={`/products/edit/${product.id}`}>
                <Button variant="outline" size="1">
                  Edit Product
                </Button>
              </Link>
              <Link href={`/buy/${product.id}`} target="_blank">
                <Button variant="surface" size="1">
                  View Buy Page
                </Button>
              </Link>
              <Link href={`/product/${product.id}/0000`} target="_blank">
                <Button variant="surface" size="1">
                  Preview Product
                </Button>
              </Link>
            </Flex>
          </Box>
        </Card>
        
        {/* Stats Card */}
        <Card size="3">
          <Heading size="4" mb="3">Statistics</Heading>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalInvoices}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${(totalRevenue / 100).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Revenue</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{totalAccessCodes}</div>
              <div className="text-sm text-gray-500">Access Codes</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{activatedCodes}</div>
              <div className="text-sm text-gray-500">Activated</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{emailedCodes}</div>
              <div className="text-sm text-gray-500">Emailed</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Who Bought This Product - Invoices/Purchases */}
      <Card size="3" className="mt-4">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Purchases</Heading>
          <Badge color="gray" variant="soft">{invoices.length} invoices</Badge>
        </Flex>
        
        {invoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Payer</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Crypto</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Wallet</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Paid At</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {invoices.map((invoice) => {
                    const address = addressMap.get(invoice.id);
                    return (
                      <Table.Row key={invoice.id}>
                        <Table.Cell>
                          <Link 
                            href={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {invoice.title}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          {invoice.payerEmail ? (
                            <Flex gap="1" align="center">
                              <MailIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{invoice.payerEmail}</span>
                            </Flex>
                          ) : (
                            <Text color="gray">-</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="font-medium">${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD</div>
                        </Table.Cell>
                        <Table.Cell>
                          {invoice.coinAmount10pow10 ? (
                            <div className="text-sm">
                              {(invoice.coinAmount10pow10 / 10**10).toFixed(8)} {invoice.coinCode?.toUpperCase()}
                            </div>
                          ) : (
                            <Text color="gray">-</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <PaymentStatusBadge
                            paidAt={invoice.paidAt}
                            manuallyApprovedAt={invoice.manuallyApprovedAt}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          {address ? (
                            <Link 
                              href={`/addresses/${address.id}`}
                              className="font-mono text-xs text-blue-600 hover:underline"
                            >
                              {address.address.slice(0, 8)}...{address.address.slice(-6)}
                            </Link>
                          ) : (
                            <Text color="gray">-</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell className="text-gray-500 text-sm whitespace-nowrap">
                          {prettyDate(invoice.createdAt)}
                        </Table.Cell>
                        <Table.Cell className="text-sm whitespace-nowrap">
                          {invoice.paidAt ? (
                            <Text color="green">{prettyDate(invoice.paidAt)}</Text>
                          ) : (
                            <Text color="gray">-</Text>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {invoices.map((invoice) => (
                <Link 
                  key={invoice.id} 
                  href={`/invoices/${invoice.id}`}
                  className="block bg-gray-50 dark:bg-gray-800 rounded p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{invoice.title}</span>
                    <PaymentStatusBadge
                      paidAt={invoice.paidAt}
                      manuallyApprovedAt={invoice.manuallyApprovedAt}
                    />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    ${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD
                  </div>
                  {invoice.coinAmount10pow10 && (
                    <div className="text-xs text-gray-500 mb-1">
                      {(invoice.coinAmount10pow10 / 10**10).toFixed(8)} {invoice.coinCode?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{invoice.payerEmail || 'No payer'}</span>
                    <span>{prettyDate(invoice.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Text color="gray">No purchases yet.</Text>
        )}
      </Card>

      {/* Who Has Access - Access Codes */}
      <Card size="3" className="mt-4">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Access Codes</Heading>
          <Badge color="gray" variant="soft">{accessCodes.length} codes</Badge>
        </Flex>
        
        {accessCodes.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Access Code</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Emailed To</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Activated</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {accessCodes.map((code) => (
                    <Table.Row key={code.id}>
                      <Table.Cell className="font-mono text-sm">
                        {code.accessCode}
                      </Table.Cell>
                      <Table.Cell>
                        {code.emailedTo ? (
                          <Flex gap="1" align="center">
                            <MailIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{code.emailedTo}</span>
                          </Flex>
                        ) : (
                          <Text color="gray">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {code.activatedAt ? (
                          <Badge color="green" variant="soft">Activated</Badge>
                        ) : (
                          <Badge color="orange" variant="soft">Pending</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-gray-500 text-sm">
                        <Flex gap="1" align="center">
                          <ClockIcon className="w-3 h-3" />
                          {prettyDate(code.createdAt)}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell className="text-sm">
                        {code.activatedAt ? (
                          <Text color="green">{prettyDate(code.activatedAt)}</Text>
                        ) : (
                          <Text color="gray">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Link 
                          href={`/product/${product.id}/${code.accessCode}`}
                          target="_blank"
                        >
                          <Button variant="ghost" size="1">
                            Preview
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
              {accessCodes.map((code) => (
                <div key={code.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm">{code.accessCode}</span>
                    {code.activatedAt ? (
                      <Badge color="green" variant="soft" size="1">Activated</Badge>
                    ) : (
                      <Badge color="orange" variant="soft" size="1">Pending</Badge>
                    )}
                  </div>
                  {code.emailedTo && (
                    <Flex gap="1" align="center" className="text-sm text-gray-600 mb-2">
                      <MailIcon className="w-3 h-3" />
                      {code.emailedTo}
                    </Flex>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created: {prettyDate(code.createdAt)}</span>
                    <Link 
                      href={`/product/${product.id}/${code.accessCode}`}
                      target="_blank"
                      className="text-blue-600"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Text color="gray">No access codes yet. Access codes are generated when invoices are paid.</Text>
        )}
      </Card>

      {/* Email Activity Log */}
      {emailLogs.length > 0 && (
        <Card size="3" className="mt-4">
          <Flex gap="2" align="center" mb="3">
            <Heading size="4">Email Activity</Heading>
            <Badge color="gray" variant="soft">{emailLogs.length} emails</Badge>
          </Flex>
          
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>To</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Subject</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {emailLogs.map((log) => {
                  const relatedInvoice = invoices.find(i => i.id === log.invoiceId);
                  return (
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
                        {relatedInvoice ? (
                          <Link 
                            href={`/invoices/${relatedInvoice.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {relatedInvoice.title}
                          </Link>
                        ) : (
                          <Text color="gray">-</Text>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {emailLogs.map((log) => {
              const relatedInvoice = invoices.find(i => i.id === log.invoiceId);
              return (
                <div key={log.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <Flex justify="between" align="start" mb="1">
                    <Text size="2" weight="medium" className="break-words pr-2">{log.subject}</Text>
                    {log.status === 'sent' ? (
                      <Badge color="green" variant="soft" size="1">Sent</Badge>
                    ) : (
                      <Badge color="red" variant="soft" size="1">Failed</Badge>
                    )}
                  </Flex>
                  <Text size="1" color="gray" className="block">{prettyDate(log.createdAt)}</Text>
                  <Text size="1" className="block">To: {log.to.join(', ')}</Text>
                  {relatedInvoice && (
                    <Link 
                      href={`/invoices/${relatedInvoice.id}`}
                      className="text-blue-600 text-xs mt-1 block"
                    >
                      Invoice: {relatedInvoice.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Related Wallets Used */}
      {addresses.length > 0 && (
        <Card size="3" className="mt-4">
          <Flex gap="2" align="center" mb="3">
            <Heading size="4">Wallets Used</Heading>
            <Badge color="gray" variant="soft">{addresses.length} addresses</Badge>
          </Flex>
          
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Coin</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Address</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Assigned At</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {addresses.map((address) => {
                  const relatedInvoice = invoices.find(i => i.id === address.invoiceId);
                  const isCurrentlyBusy = address.busyTo && new Date(address.busyTo) > new Date();
                  return (
                    <Table.Row key={address.id}>
                      <Table.Cell>
                        <Badge variant="outline">{address.code.toUpperCase()}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Link 
                          href={`/addresses/${address.id}`}
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {address.address}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        {relatedInvoice ? (
                          <Link 
                            href={`/invoices/${relatedInvoice.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {relatedInvoice.title}
                          </Link>
                        ) : (
                          <Text color="gray">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-gray-500 text-sm">
                        {address.busyFrom ? prettyDate(address.busyFrom) : '-'}
                      </Table.Cell>
                      <Table.Cell>
                        {relatedInvoice?.paidAt ? (
                          <Badge color="green" variant="soft">Payment Received</Badge>
                        ) : isCurrentlyBusy ? (
                          <Badge color="orange" variant="soft">Awaiting Payment</Badge>
                        ) : (
                          <Badge color="gray" variant="soft">Idle</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {addresses.map((address) => {
              const relatedInvoice = invoices.find(i => i.id === address.invoiceId);
              const isCurrentlyBusy = address.busyTo && new Date(address.busyTo) > new Date();
              return (
                <div key={address.id} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{address.code.toUpperCase()}</Badge>
                    {relatedInvoice?.paidAt ? (
                      <Badge color="green" variant="soft" size="1">Paid</Badge>
                    ) : isCurrentlyBusy ? (
                      <Badge color="orange" variant="soft" size="1">Awaiting</Badge>
                    ) : (
                      <Badge color="gray" variant="soft" size="1">Idle</Badge>
                    )}
                  </div>
                  <Link 
                    href={`/addresses/${address.id}`}
                    className="font-mono text-xs text-blue-600 break-all"
                  >
                    {address.address}
                  </Link>
                  {relatedInvoice && (
                    <Link 
                      href={`/invoices/${relatedInvoice.id}`}
                      className="text-blue-600 text-sm mt-1 block"
                    >
                      Invoice: {relatedInvoice.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </Box>
  );
}
