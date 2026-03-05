import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { Box, Flex, Heading, Table, Text, Badge } from "@radix-ui/themes";
import { ClockIcon, PackageIcon, MailIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { prettyDate } from "@/libs/dates";

export default async function AccessCodesPage() {
  const email = await userEmailOrThrow();
  
  // Get all products for this user
  const products = await prisma.product.findMany({
    where: { userEmail: email },
    orderBy: { name: 'asc' },
  });
  const productIds = products.map(p => p.id);
  
  // Get all access codes for these products
  const accessCodes = await prisma.productAccessCode.findMany({
    where: {
      productId: { in: productIds }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Create a product map for quick lookup
  const productMap = new Map(products.map(p => [p.id, p]));
  
  return (
    <Box className="p-4">
      <Flex gap="3" align="center" mb="4">
        <div>
          <Heading size="5">Access Codes</Heading>
          <Text size="2" color="gray">{accessCodes.length} total codes</Text>
        </div>
      </Flex>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Product</Table.ColumnHeaderCell>
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
                <Table.Cell>
                  <Link 
                    href={`/products/${code.productId}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <PackageIcon className="w-4 h-4" />
                    {productMap.get(code.productId)?.name || 'Unknown'}
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
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {accessCodes.map((code) => (
          <div key={code.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Flex justify="between" align="start" mb="2">
              <div>
                <Link 
                  href={`/products/${code.productId}`}
                  className="font-medium hover:underline"
                >
                  {productMap.get(code.productId)?.name || 'Unknown'}
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
            
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Link 
                href={`/product/${code.productId}/${code.accessCode}`}
                target="_blank"
                className="text-blue-600 text-sm flex items-center gap-1"
              >
                <EyeIcon className="w-3 h-3" />
                Preview
              </Link>
            </div>
          </div>
        ))}
        {accessCodes.length === 0 && (
          <Text color="gray" className="block text-center py-8">
            No access codes yet.
          </Text>
        )}
      </div>
    </Box>
  );
}
