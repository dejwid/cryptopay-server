'use client';

import { manuallyApproveInvoiceAction } from '@/app/actions/actions';
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';
import { CheckCircleIcon } from 'lucide-react';
import { useState, useTransition } from 'react';

interface Props {
  invoiceId: string;
  invoiceTitle: string;
}

export default function ManuallyApproveInvoiceButton({ invoiceId, invoiceTitle }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await manuallyApproveInvoiceAction(invoiceId);
        setIsApproved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to approve invoice');
      }
    });
  };

  if (isApproved) {
    return (
      <Button variant="soft" color="green" disabled>
        <CheckCircleIcon className="h-4" />
        Approved
      </Button>
    );
  }

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button variant="surface" color="orange">
          <CheckCircleIcon className="h-4" />
          Approve manually
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Manually Approve Payment</AlertDialog.Title>
        <AlertDialog.Description size="2">
          <Text as="p" mb="2">
            You are about to manually approve the invoice:
          </Text>
          <Text as="p" weight="bold" mb="2">
            {String.fromCharCode(8220)}{invoiceTitle}{String.fromCharCode(8221)}
          </Text>
          <Text as="p" mb="2">
            This will mark the invoice as paid and send the product access link to the customer.
          </Text>
          <Text as="p" color="red">
            This action cannot be undone.
          </Text>
          {error && (
            <Text as="p" color="red" mt="2">
              {error}
            </Text>
          )}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button 
              variant="solid" 
              color="orange" 
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? 'Approving...' : 'Yes, approve payment'}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
