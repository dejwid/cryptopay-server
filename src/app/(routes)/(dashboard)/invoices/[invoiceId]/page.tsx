import { userEmailOrThrow } from "@/app/actions/actions";
import { prisma } from "@/libs/db";
import { notFound } from "next/navigation";
import { Box, Flex, Heading, Table, Text, Badge } from "@radix-ui/themes";
import { ClockIcon, ArrowLeftIcon, CheckCircle2Icon, XCircleIcon, PenIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import { prettyDate } from "@/libs/dates";
import ManuallyApproveInvoiceButton from "@/app/components/ManuallyApproveInvoiceButton";
import InvoiceEmailActions from "@/app/components/InvoiceEmailActions";
import { PaymentStatusBadge } from "@/app/components/PaymentStatusBadge";
import { maxPaymentShortfall } from "@/libs/config";

const minAcceptablePercentage = (1 - maxPaymentShortfall) * 100;
const maxAcceptablePercentage = (1 + maxPaymentShortfall) * 100;

export default async function InvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const email = await userEmailOrThrow();
  const { invoiceId } = params;
  
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, payeeEmail: email },
  });
  
  if (!invoice) {
    notFound();
  }
  
  const product = invoice.productId 
    ? await prisma.product.findFirst({ where: { id: invoice.productId } })
    : null;
  
  const address = await prisma.address.findFirst({
    where: { invoiceId: invoice.id },
    orderBy: { busyFrom: 'desc' },
  });
  
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

  const emailLogs = await prisma.emailLog.findMany({
    where: { invoiceId: invoice.id },
    orderBy: { createdAt: 'desc' },
  });
  
  return (
    <Box className="p-4">
      <Flex gap="3" align="center" mb="4">
        <Link href="/invoices">
          <Button variant="ghost" size="1">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <Heading size="5" className="break-words">{invoice.title}</Heading>
          <Text size="2" color="gray">Invoice details</Text>
        </div>
      </Flex>
      
      {/* Invoice Info */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Status</Text>
            <div className="mt-1">
              <PaymentStatusBadge
                paidAt={invoice.paidAt}
                manuallyApprovedAt={invoice.manuallyApprovedAt}
                receivedAmount10pow10={totalReceived > 0 ? totalReceived : null}
                paymentPercentage={paymentPercentage}
                coinCode={invoice.coinCode}
              />
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">USD Amount</Text>
            <div className="text-lg font-semibold">${(invoice.usdAmountCents / 100).toFixed(2)}</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Crypto</Text>
            <div className="text-sm font-medium">
              {invoice.coinAmount10pow10 
                ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                : 'Not selected'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Payer</Text>
            <div className="text-sm font-medium truncate">{invoice.payerEmail || '-'}</div>
          </div>
        </div>
        
        {product && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text size="2" color="gray">Product</Text>
            <Link href={`/products/${product.id}`} className="text-blue-600 hover:underline block mt-1">
              {product.name}
            </Link>
          </div>
        )}
        
        <Flex gap="2" wrap="wrap">
          {!invoice.paidAt && (
            <>
              <ManuallyApproveInvoiceButton
                invoiceId={invoice.id}
                invoiceTitle={invoice.title}
              />
              <Link href={'/invoices/edit/'+invoice.id}>
                <Button variant="outline" size="2">
                  <PenIcon className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </>
          )}
          <Link href={'/invoice/'+invoice.id} target="_blank">
            <Button variant="surface" size="2">
              <ExternalLinkIcon className="w-4 h-4" />
              Pay Page
            </Button>
          </Link>
        </Flex>
      </div>
      
      {/* Payment Details */}
      {address && (
        <div className="mb-6">
          <Heading size="4" mb="3">Payment</Heading>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
            <Text size="2" color="gray">Address</Text>
            <Link 
              href={`/addresses/${address.id}`}
              className="font-mono text-xs break-all text-blue-600 hover:underline block mt-1"
            >
              {address.address}
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Text size="2" color="gray">Expected</Text>
              <div className="text-sm font-medium">
                {invoice.coinAmount10pow10 
                  ? `${(invoice.coinAmount10pow10 / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                  : '-'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Text size="2" color="gray">Received</Text>
              <div className={`text-sm font-medium ${totalReceived > 0 ? 'text-green-600' : ''}`}>
                {totalReceived > 0 
                  ? `${(totalReceived / 10**10).toFixed(8)} ${(invoice.coinCode || '').toUpperCase()}`
                  : 'None'}
              </div>
            </div>
          </div>
          
          {paymentPercentage !== null && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
              <Text size="2" color="gray">Payment %</Text>
              <span className={`text-lg font-bold ${
                paymentPercentage > maxAcceptablePercentage 
                  ? 'text-purple-600' 
                  : paymentPercentage < minAcceptablePercentage 
                    ? 'text-red-600' 
                    : 'text-green-600'
              }`}>
                {paymentPercentage.toFixed(1)}%
              </span>
            </div>
          )}
          
          {balanceChanges.length > 0 && (
            <div>
              <Text size="2" color="gray" mb="2">Balance Changes</Text>
              <div className="space-y-2">
                {balanceChanges.map((bc) => (
                  <div key={bc.id} className="p-2 border border-gray-200 dark:border-gray-800 rounded flex justify-between items-center">
                    <span className="text-gray-500 text-sm">{prettyDate(bc.createdAt)}</span>
                    <span className={`font-medium ${bc.balanceChange10pow10 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bc.balanceChange10pow10 > 0 ? '+' : ''}
                      {(bc.balanceChange10pow10 / 10**10).toFixed(8)} {(invoice.coinCode || '').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Actions */}
      {invoice.paidAt && (
        <div className="mb-6">
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

      {/* Email Logs */}
      {emailLogs.length > 0 && (
        <div>
          <Flex gap="2" align="center" mb="3">
            <Heading size="4">Email Log</Heading>
            <Badge color="gray" variant="soft">{emailLogs.length}</Badge>
          </Flex>

          <div className="space-y-2">
            {emailLogs.map((log) => (
              <div key={log.id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
                <Flex justify="between" align="start" mb="1">
                  <Text size="2" weight="medium">{log.subject}</Text>
                  {log.status === 'sent' ? (
                    <Badge color="green" variant="soft" size="1">Sent</Badge>
                  ) : (
                    <Badge color="red" variant="soft" size="1">Failed</Badge>
                  )}
                </Flex>
                <Text size="1" color="gray">{prettyDate(log.createdAt)} • To: {log.to.join(', ')}</Text>
                {log.error && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Error</summary>
                    <pre className="mt-1 bg-red-50 dark:bg-red-950 p-2 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">{log.error}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Box>
  );
}
