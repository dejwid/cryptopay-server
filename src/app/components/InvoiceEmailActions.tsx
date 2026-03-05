'use client';

import { useState } from "react";
import { Button, TextField, Card, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { resendProductAccessEmailAction, resendMerchantNotificationAction } from "@/app/actions/actions";
import { MailIcon, RefreshCwIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

interface InvoiceEmailActionsProps {
  invoiceId: string;
  payerEmail: string | null;
  payeeEmail: string;
  hasProduct: boolean;
}

type SendResult = {
  success: boolean;
  sentTo: string;
  error?: string;
};

function EmailSendButton({
  label,
  defaultEmail,
  onSend,
}: {
  label: string;
  defaultEmail: string;
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
      <Text size="2" weight="medium" className="block">{label}</Text>
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

export default function InvoiceEmailActions({ invoiceId, payerEmail, payeeEmail, hasProduct }: InvoiceEmailActionsProps) {
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
          onSend={async (email) => {
            const result = await resendMerchantNotificationAction(invoiceId, email);
            return result;
          }}
        />

        {/* Customer product link resend - only for product invoices */}
        {hasProduct && (
          <>
            <div className="border-t pt-4">
              <EmailSendButton
                label={
                  payerEmail
                    ? "Customer product access link"
                    : "Customer product access link (no email on record)"
                }
                defaultEmail={payerEmail || ''}
                onSend={async (email) => {
                  const result = await resendProductAccessEmailAction(invoiceId, email);
                  return result;
                }}
              />
              {!payerEmail && (
                <Flex gap="1" align="center" mt="1">
                  <Badge color="orange" variant="soft" size="1">Note</Badge>
                  <Text size="1" color="orange">Invoice has no payer email. Enter an email address to send.</Text>
                </Flex>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
