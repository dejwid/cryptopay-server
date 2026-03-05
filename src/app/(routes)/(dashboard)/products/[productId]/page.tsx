import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Flex, Heading, Table, Text, Badge } from "@radix-ui/themes";
import { ArrowLeftIcon, ClockIcon, PackageIcon, MailIcon } from "lucide-react";
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
  
  // Get addresses used for this product's invoices
  const addresses = await prisma.address.findMany({
    where: { 
      invoiceId: { in: invoiceIds }
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
  
  // Create a map of invoice id to address for easy lookup
  const addressMap = new Map(addresses.map(a => [a.invoiceId, a]));
  
  return (
    <Box className="p-4">
      <Flex gap="3" align="center" mb="4">
        <Link href="/products">
          <Button variant="ghost" size="1">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <Flex gap="2" align="center">
            <Heading size="5">{product.name}</Heading>
            {product.archivedAt && (
              <Badge color="gray" variant="soft">Archived</Badge>
            )}
          </Flex>
          <Text size="2" color="gray">Product details</Text>
        </div>
      </Flex>
      
      {/* Product Info */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Price</Text>
            <div className="text-lg font-semibold">
              {product.usdCents ? `$${(product.usdCents / 100).toFixed(2)}` : 'Not set'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Files</Text>
            <div className="text-lg font-semibold">{product.uploads.length}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Revenue</Text>
            <div className="text-lg font-semibold text-green-600">${(totalRevenue / 100).toFixed(2)}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Sales</Text>
            <div className="text-lg font-semibold">{paidInvoices}/{totalInvoices}</div>
          </div>
        </div>
        
        {product.description && (
          <div className="mb-4">
            <Text size="2" color="gray">Description</Text>
            <div className="mt-1 whitespace-pre-wrap">{product.description}</div>
          </div>
        )}
        
        <Flex gap="2" wrap="wrap">
          <Link href={`/products/edit/${product.id}`}>
            <Button size="2" variant="outline">Edit</Button>
          </Link>
          <Link href={`/buy/${product.id}`} target="_blank">
            <Button size="2" variant="surface">Buy Page</Button>
          </Link>
          <Link href={`/product/${product.id}/0000`} target="_blank">
            <Button size="2" variant="surface">Preview</Button>
          </Link>
        </Flex>
      </div>

      {/* Purchases */}
      <div className="mb-6">
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Purchases</Heading>
          <Badge color="gray" variant="soft">{invoices.length}</Badge>
        </Flex>
        
        {invoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Payer</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {invoices.map((invoice) => (
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
                        <div className="font-medium">${((invoice.usdAmountCents || 0) / 100).toFixed(2)}</div>
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
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {invoices.map((invoice) => (
                <Link 
                  key={invoice.id} 
                  href={`/invoices/${invoice.id}`}
                  className="block p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
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
          <Text color="gray">No purchases yet.</Text>
        )}
      </div>

      {/* Access Codes */}
      <div>
        <Flex gap="2" align="center" mb="3">
          <Heading size="4">Access Codes</Heading>
          <Badge color="gray" variant="soft">{accessCodes.length}</Badge>
        </Flex>
        
        {accessCodes.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Emailed To</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Activated</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {accessCodes.map((code) => (
                    <Table.Row key={code.id}>
                      <Table.Cell className="font-mono text-sm">
                        <Link 
                          href={`/product/${product.id}/${code.accessCode}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {code.accessCode}
                        </Link>
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
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {accessCodes.map((code) => (
                <div key={code.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
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
          <Text color="gray">No access codes yet.</Text>
        )}
      </div>
    </Box>
  );
}
