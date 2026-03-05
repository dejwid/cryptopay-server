import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { Box, Card, Flex, Heading, Table, Text, Badge } from "@radix-ui/themes";
import { ClockIcon, PackageIcon, MailIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { prettyDate } from "@/libs/dates";

export default async function AccessCodesPage() {
  const email = await userEmailOrThrow();
  
  // Get all access codes with product info
  const accessCodes = await prisma.productAccessCode.findMany({
    where: {
      product: {
        userEmail: email
      }
    },
    include: {
      product: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Get all products for filtering
  const products = await prisma.product.findMany({
    where: { userEmail: email, archivedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });
  
  // Group by product
  const byProduct = accessCodes.reduce((acc, code) => {
    const productId = code.productId;
    if (!acc[productId]) {
      acc[productId] = {
        product: code.product,
        codes: []
      };
    }
    acc[productId].codes.push(code);
    return acc;
  }, {} as Record<string, { product: typeof accessCodes[0]['product']; codes: typeof accessCodes }>);
  
  return (
    <Box>
      <Flex gap="3" align="center" mb="4">
        <Heading>Access Codes</Heading>
        <Badge color="gray" variant="soft">{accessCodes.length} total</Badge>
      </Flex>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card size="2">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Total Codes</Text>
            <Text size="6" weight="bold">{accessCodes.length}</Text>
          </Flex>
        </Card>
        <Card size="2">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Activated</Text>
            <Text size="6" weight="bold" className="text-green-600">
              {accessCodes.filter(c => c.activatedAt).length}
            </Text>
          </Flex>
        </Card>
        <Card size="2">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Pending</Text>
            <Text size="6" weight="bold" className="text-orange-600">
              {accessCodes.filter(c => !c.activatedAt).length}
            </Text>
          </Flex>
        </Card>
        <Card size="2">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Emailed</Text>
            <Text size="6" weight="bold" className="text-blue-600">
              {accessCodes.filter(c => c.emailedTo).length}
            </Text>
          </Flex>
        </Card>
      </div>
      
      {/* Desktop Table */}
      <Card size="3" className="hidden md:block">
        <Heading size="4" mb="3">All Access Codes</Heading>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Product</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Access Code</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Emailed To</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Activated</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {accessCodes.map((code) => (
              <Table.Row key={code.id}>
                <Table.Cell>
                  <Link 
                    href={`/products/${code.productId}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <PackageIcon className="w-4 h-4" />
                    {code.product?.name || 'Unknown'}
                  </Link>
                </Table.Cell>
                <Table.Cell className="font-mono text-sm">
                  <Link 
                    href={`/product/${code.productId}/${code.accessCode}`}
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
        {accessCodes.length === 0 && (
          <Text color="gray" className="block text-center py-8">
            No access codes yet. Access codes are generated when invoices are paid.
          </Text>
        )}
      </Card>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {accessCodes.map((code) => (
          <Card key={code.id} size="2">
            <Flex justify="between" align="start" mb="2">
              <div>
                <Link 
                  href={`/products/${code.productId}`}
                  className="font-medium hover:underline"
                >
                  {code.product?.name || 'Unknown'}
                </Link>
                <div className="font-mono text-sm text-gray-500 mt-1">
                  Code: {code.accessCode}
                </div>
              </div>
              {code.activatedAt ? (
                <Badge color="green" variant="soft" size="1">Activated</Badge>
              ) : (
                <Badge color="orange" variant="soft" size="1">Pending</Badge>
              )}
            </Flex>
            
            {code.emailedTo && (
              <Flex gap="1" align="center" className="text-sm text-gray-600 mb-2">
                <MailIcon className="w-3 h-3" />
                {code.emailedTo}
              </Flex>
            )}
            
            <Flex gap="3" className="text-xs text-gray-500">
              <span>Created: {prettyDate(code.createdAt)}</span>
              {code.activatedAt && (
                <span>Activated: {prettyDate(code.activatedAt)}</span>
              )}
            </Flex>
            
            <div className="mt-2 pt-2 border-t">
              <Link 
                href={`/product/${code.productId}/${code.accessCode}`}
                target="_blank"
                className="text-blue-600 text-sm flex items-center gap-1"
              >
                <EyeIcon className="w-3 h-3" />
                Preview
              </Link>
            </div>
          </Card>
        ))}
        {accessCodes.length === 0 && (
          <Text color="gray" className="block text-center py-8">
            No access codes yet.
          </Text>
        )}
      </div>
      
      {/* Grouped by Product */}
      <div className="mt-6">
        <Heading size="4" mb="3">By Product</Heading>
        <div className="space-y-4">
          {Object.values(byProduct).map(({ product, codes }) => (
            <Card key={product.id} size="2">
              <Flex justify="between" align="center" mb="2">
                <Link 
                  href={`/products/${product.id}`}
                  className="font-medium flex items-center gap-2 hover:underline"
                >
                  <PackageIcon className="w-4 h-4" />
                  {product.name}
                </Link>
                <Badge color="gray" variant="soft">{codes.length} codes</Badge>
              </Flex>
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="text-green-600">
                  {codes.filter(c => c.activatedAt).length} activated
                </span>
                <span className="text-orange-600">
                  {codes.filter(c => !c.activatedAt).length} pending
                </span>
                <span className="text-blue-600">
                  {codes.filter(c => c.emailedTo).length} emailed
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Box>
  );
}
