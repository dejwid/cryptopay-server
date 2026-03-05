import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { prettyDate } from "@/libs/dates";
import { Box, Badge, Flex, Heading, Table, Text } from "@radix-ui/themes";
import { MailIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

export default async function EmailLogsPage() {
  await userEmailOrThrow();
  
  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  
  return (
    <Box className="p-4">
      <Flex gap="3" align="center" mb="4">
        <div>
          <Heading size="5">Email Logs</Heading>
          <Text size="2" color="gray">{logs.length} records</Text>
        </div>
      </Flex>
      
      {logs.length === 0 ? (
        <div className="py-12 text-center">
          <MailIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <Text color="gray">No email logs yet. Emails will be logged here when they are sent.</Text>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>To</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Subject</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Response</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {logs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>
                      {log.status === 'sent' ? (
                        <Flex gap="1" align="center">
                          <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                          <Badge color="green" variant="soft">Sent</Badge>
                        </Flex>
                      ) : (
                        <Flex gap="1" align="center">
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                          <Badge color="red" variant="soft">Failed</Badge>
                        </Flex>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-sm text-gray-500 whitespace-nowrap">
                      {prettyDate(log.createdAt)}
                    </Table.Cell>
                    <Table.Cell className="text-sm">
                      {log.to.join(', ')}
                    </Table.Cell>
                    <Table.Cell className="text-sm font-medium">
                      {log.subject}
                    </Table.Cell>
                    <Table.Cell className="text-sm font-mono text-xs">
                      {log.invoiceId ? (
                        <a
                          href={`/invoices/${log.invoiceId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {log.invoiceId.slice(-8)}...
                        </a>
                      ) : '-'}
                    </Table.Cell>
                    <Table.Cell>
                      {log.error ? (
                        <details className="text-xs">
                          <summary className="text-red-600 cursor-pointer">Error</summary>
                          <pre className="mt-1 bg-red-50 dark:bg-red-950 p-2 rounded text-xs text-red-700 dark:text-red-300 max-w-xs overflow-auto">
                            {log.error}
                          </pre>
                        </details>
                      ) : log.mailgunResponse ? (
                        <details className="text-xs">
                          <summary className="text-gray-500 cursor-pointer">Response</summary>
                          <pre className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs text-gray-700 dark:text-gray-300 max-w-xs overflow-auto">
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(log.mailgunResponse!), null, 2);
                              } catch {
                                return log.mailgunResponse;
                              }
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
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
                <Flex justify="between" align="start" mb="2">
                  <Text size="2" weight="medium" className="flex-1 mr-2">{log.subject}</Text>
                  {log.status === 'sent' ? (
                    <Badge color="green" variant="soft">Sent</Badge>
                  ) : (
                    <Badge color="red" variant="soft">Failed</Badge>
                  )}
                </Flex>
                <Text size="1" color="gray" className="block mb-1">
                  {prettyDate(log.createdAt)}
                </Text>
                <Text size="1" className="block mb-1">
                  To: {log.to.join(', ')}
                </Text>
                {log.invoiceId && (
                  <Text size="1" className="block">
                    Invoice: <a href={`/invoices/${log.invoiceId}`} className="text-blue-600">{log.invoiceId.slice(-8)}...</a>
                  </Text>
                )}
                {log.error && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Error details</summary>
                    <pre className="mt-1 bg-red-50 dark:bg-red-950 p-2 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">{log.error}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Box>
  );
}
