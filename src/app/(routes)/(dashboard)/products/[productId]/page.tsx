import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Heading, Table, Text, Badge, Separator } from "@radix-ui/themes";
import { ArrowLeftIcon, ClockIcon, PackageIcon } from "lucide-react";
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
  
  // Get invoices for this product
  const invoices = await prisma.invoice.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
  });
  
  // Calculate stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.paidAt).length;
  const totalRevenue = invoices
    .filter(i => i.paidAt)
    .reduce((sum, i) => sum + (i.usdAmountCents || 0), 0);
  
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
                      {prettyDate(product.createdAt)}
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
                <span>{prettyDate(product.createdAt)}</span>
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
            <Flex gap="2">
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
            </Flex>
          </Box>
        </Card>
        
        {/* Stats Card */}
        <Card size="3">
          <Heading size="4" mb="3">Statistics</Heading>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalInvoices}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${(totalRevenue / 100).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Revenue</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoices */}
      <Card size="3" className="mt-4">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Invoices</Heading>
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
                    <Table.ColumnHeaderCell>Payer</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {invoices.map((invoice) => (
                    <Table.Row key={invoice.id}>
                      <Table.Cell>{invoice.title}</Table.Cell>
                      <Table.Cell className="text-gray-500">{invoice.payerEmail || '-'}</Table.Cell>
                      <Table.Cell>
                        <div>${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD</div>
                        {invoice.coinAmount10pow10 && (
                          <div className="text-gray-500 text-sm">
                            {(invoice.coinAmount10pow10 / 10**10).toFixed(8)} {invoice.coinCode?.toUpperCase()}
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <PaymentStatusBadge
                          paidAt={invoice.paidAt}
                          manuallyApprovedAt={invoice.manuallyApprovedAt}
                        />
                      </Table.Cell>
                      <Table.Cell className="text-gray-500 text-sm">
                        {prettyDate(invoice.createdAt)}
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
                    <PaymentStatusBadge
                      paidAt={invoice.paidAt}
                      manuallyApprovedAt={invoice.manuallyApprovedAt}
                    />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    ${((invoice.usdAmountCents || 0) / 100).toFixed(2)} USD
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{invoice.payerEmail || 'No payer'}</span>
                    <span>{prettyDate(invoice.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Text color="gray">No invoices for this product yet.</Text>
        )}
      </Card>
    </Box>
  );
}
