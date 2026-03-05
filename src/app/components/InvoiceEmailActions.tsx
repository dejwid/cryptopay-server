'use client';

import { useState } from "react";
import { Button, TextField, Card, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { resendProductAccessEmailAction, resendMerchantNotificationAction } from "@/app/actions/actions";
import { MailIcon, RefreshCwIcon, CheckCircle2Icon, XCircleIcon, EyeIcon } from "lucide-react";

interface InvoiceEmailActionsProps {
  invoiceId: string;
  payerEmail: string | null;
  payeeEmail: string;
  hasProduct: boolean;
  invoiceTitle: string;
  coinAmount10pow10: number | null;
  coinCode: string | null;
  usdAmountCents: number;
  manuallyApprovedAt: Date | null;
}

type SendResult = {
  success: boolean;
  sentTo: string;
  error?: string;
};

function EmailPreview({ subject, body }: { subject: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-2 text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 text-xs underline underline-offset-2"
      >
        <EyeIcon className="w-3 h-3" />
        {open ? 'hide preview' : 'preview'}
      </button>
      {open && (
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 w-full block">
          <div className="font-medium mb-1">Subject: {subject}</div>
          <pre className="whitespace-pre-wrap font-sans">{body}</pre>
        </div>
      )}
    </span>
  );
}

function EmailSendButton({
  label,
  defaultEmail,
  subject,
  body,
  onSend,
}: {
  label: string;
  defaultEmail: string;
  subject: string;
  body: string;
  onSend: (email: string) => Promise<SendResult>;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await onSend(email);
      setResult(res);
    } catch (err) {
      setResult({ success: false, sentTo: email, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <Text size="2" weight="medium">{label}</Text>
        <EmailPreview subject={subject} body={body} />
      </div>
      <Flex gap="2" align="center" wrap="wrap">
        <TextField.Root
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ minWidth: '220px' }}
          placeholder="email@example.com"
        />
        <Button
          onClick={handleSend}
          disabled={loading || !email}
          variant="soft"
          size="2"
        >
          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sending...' : 'Resend'}
        </Button>
      </Flex>
      {result && (
        <Flex gap="2" align="center" className={`text-sm p-2 rounded border ${result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {result.success ? (
            <><CheckCircle2Icon className="w-4 h-4 shrink-0" /> Sent to {result.sentTo}</>
          ) : (
            <><XCircleIcon className="w-4 h-4 shrink-0" /> Failed: {result.error}</>
          )}
        </Flex>
      )}
    </div>
  );
}

export default function InvoiceEmailActions({
  invoiceId,
  payerEmail,
  payeeEmail,
  hasProduct,
  invoiceTitle,
  coinAmount10pow10,
  coinCode,
  usdAmountCents,
  manuallyApprovedAt,
}: InvoiceEmailActionsProps) {
  const merchantSubject = manuallyApprovedAt ? 'Payment manually approved' : 'You just got paid';
  const merchantBody = `${invoiceTitle}: ${coinAmount10pow10 ? `${coinAmount10pow10 / 10 ** 10} ${coinCode}` : `$${usdAmountCents / 100}USD`}`;

  const productSubject = 'Product access';
  const productBody = `[access link will be generated at send time]`;

  return (
    <Card size="3">
      <Flex gap="2" align="center" mb="4">
        <MailIcon className="w-5 h-5 text-blue-500" />
        <Heading size="4">Email Actions</Heading>
      </Flex>

      <div className="space-y-5">
        {/* Merchant notification resend */}
        <EmailSendButton
          label="Merchant notification (you)"
          defaultEmail={payeeEmail}
          subject={merchantSubject}
          body={merchantBody}
          onSend={async (email) => {
            const result = await resendMerchantNotificationAction(invoiceId, email);
            return result;
          }}
        />

        {/* Customer product link resend - only for product invoices */}
        {hasProduct && (
          <div className="border-t pt-4">
            <EmailSendButton
              label={
                payerEmail
                  ? 'Customer product access link'
                  : 'Customer product access link (no email on record)'
              }
              defaultEmail={payerEmail || ''}
              subject={productSubject}
              body={productBody}
              onSend={async (email) => {
                const result = await resendProductAccessEmailAction(invoiceId, email);
                return result;
              }}
            />
            {!payerEmail && (
              <Flex gap="1" align="center" mt="2">
                <Badge color="orange" variant="soft" size="1">Note</Badge>
                <Text size="1" color="orange">
                  Invoice has no payer email. Enter an address above to send.
                </Text>
              </Flex>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
