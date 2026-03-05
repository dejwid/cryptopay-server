'use client';

import { Button, TextField, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { sendTestEmailAction } from "@/app/actions/actions";

interface TestEmailButtonProps {
  defaultEmail: string;
}

export default function TestEmailButton({ defaultEmail }: TestEmailButtonProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sentTo: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendTestEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await sendTestEmailAction(email);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="3">
      <Flex gap="2" align="center" wrap="wrap">
        <TextField.Root
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ minWidth: '250px' }}
        />
        <Button 
          onClick={handleSendTestEmail} 
          disabled={loading}
          variant="solid"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </Flex>
      
      {result && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
          ✓ Test email sent to {result.sentTo} at {new Date(result.timestamp).toLocaleString()}
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          ✗ {error}
        </div>
      )}
    </Flex>
  );
}
