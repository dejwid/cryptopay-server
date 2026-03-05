'use client';

import { Dialog, Button, Flex, Text, Box, Badge, Spinner, Code, Separator, Card } from '@radix-ui/themes';
import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronRight, Info, Database, Globe, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

type DebugStep = {
  step: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  timestamp: string;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
};

type StepProps = {
  step: DebugStep;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
};

function getStatusIcon(status: DebugStep['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusColor(status: DebugStep['status']): 'gray' | 'yellow' | 'green' | 'red' {
  switch (status) {
    case 'pending':
      return 'gray';
    case 'in_progress':
      return 'yellow';
    case 'success':
      return 'green';
    case 'error':
      return 'red';
  }
}

function getStepIcon(stepName: string) {
  if (stepName.toLowerCase().includes('database')) return <Database className="h-3.5 w-3.5" />;
  if (stepName.toLowerCase().includes('api') || stepName.toLowerCase().includes('source')) return <Globe className="h-3.5 w-3.5" />;
  if (stepName.toLowerCase().includes('complete') || stepName.toLowerCase().includes('success')) return <Zap className="h-3.5 w-3.5" />;
  if (stepName.toLowerCase().includes('error')) return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
}

function DataDisplay({ data, title }: { data: Record<string, unknown>; title?: string }) {
  if (!data) return null;
  
  return (
    <Box className="bg-gray-900 text-gray-100 rounded-md p-3 mt-2 overflow-auto max-h-80 font-mono text-xs">
      {title && (
        <Text size="1" className="text-gray-400 mb-2 block">{title}</Text>
      )}
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Box>
  );
}

function StepItem({ step, isExpanded, onToggle, index }: StepProps) {
  const hasDetails = step.data || step.error || step.metadata;
  const statusColor = getStatusColor(step.status);

  return (
    <Box className="border rounded-lg overflow-hidden mb-2">
      {/* Header */}
      <Box 
        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${hasDetails ? '' : 'cursor-default'}`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <Flex justify="between" align="center" gap="3">
          <Flex align="center" gap="2" className="flex-1 min-w-0">
            {hasDetails && (
              <Box className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </Box>
            )}
            {!hasDetails && <div className="w-6" />}
            
            <Box className="flex-shrink-0">
              {getStatusIcon(step.status)}
            </Box>
            
            <Flex align="center" gap="2" className="flex-1 min-w-0">
              <Box className="flex-shrink-0 text-gray-400">
                {getStepIcon(step.step)}
              </Box>
              <Text weight="medium" className="truncate">
                {step.step}
              </Text>
            </Flex>
          </Flex>
          
          <Flex align="center" gap="2" className="flex-shrink-0">
            {step.duration !== undefined && (
              <Badge color="gray" variant="soft">
                {step.duration}ms
              </Badge>
            )}
            <Badge color={statusColor}>
              {step.status.replace('_', ' ')}
            </Badge>
            <Text size="1" color="gray">
              {new Date(step.timestamp).toLocaleTimeString()}
            </Text>
          </Flex>
        </Flex>
        
        {/* Message */}
        {step.message && (
          <Box ml="10" mt="1">
            <Text size="2" color="gray">
              {step.message}
            </Text>
          </Box>
        )}
        
        {/* Error message */}
        {step.error && !isExpanded && (
          <Box ml="10" mt="1">
            <Text size="2" color="red">
              {step.error}
            </Text>
          </Box>
        )}
      </Box>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <Box className="border-t bg-gray-50 p-3">
          {/* Metadata */}
          {step.metadata && (
            <Box mb="2">
              <Text size="1" weight="bold" className="text-gray-500 uppercase mb-1 block">
                Metadata
              </Text>
              <DataDisplay data={step.metadata} />
            </Box>
          )}
          
          {/* Error details */}
          {step.error && (
            <Box mb="2">
              <Text size="1" weight="bold" className="text-red-500 uppercase mb-1 block">
                Error Details
              </Text>
              <Box className="bg-red-50 border border-red-200 rounded-md p-3">
                <Text size="2" color="red" className="font-mono">
                  {step.error}
                </Text>
              </Box>
            </Box>
          )}
          
          {/* Data */}
          {step.data && (
            <Box>
              <Text size="1" weight="bold" className="text-gray-500 uppercase mb-1 block">
                Details
              </Text>
              <DataDisplay data={step.data} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

type BalanceRefreshModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressId: string;
  addressInfo?: {
    address: string;
    code: string;
  };
  onComplete?: () => void;
};

export default function BalanceRefreshModal({
  open,
  onOpenChange,
  addressId,
  addressInfo,
  onComplete,
}: BalanceRefreshModalProps) {
  const [steps, setSteps] = useState<DebugStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [autoExpand, setAutoExpand] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const toggleStep = (stepKey: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepKey)) {
        next.delete(stepKey);
      } else {
        next.add(stepKey);
      }
      return next;
    });
  };

  const startRefresh = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    setSteps([]);
    setIsLoading(true);
    setExpandedSteps(new Set());

    try {
      const response = await fetch(`/api/balance/refresh/${addressId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const step: DebugStep = JSON.parse(line);
              setSteps(prev => {
                // Auto-expand in_progress and error steps
                if (autoExpand && (step.status === 'in_progress' || step.status === 'error')) {
                  const stepKey = `${step.step}-${prev.length}`;
                  setExpandedSteps(expanded => {
                    const next = new Set(expanded);
                    next.add(stepKey);
                    return next;
                  });
                }
                return [...prev, step];
              });
            } catch (e) {
              console.error('Failed to parse step:', line);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const step: DebugStep = JSON.parse(buffer);
          setSteps(prev => [...prev, step]);
        } catch (e) {
          console.error('Failed to parse final step:', buffer);
        }
      }
    } catch (error) {
      setSteps(prev => [...prev, {
        step: 'Fatal Error',
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : String(error),
      }]);
    } finally {
      setIsLoading(false);
      hasStartedRef.current = false;
      // Call onComplete after a short delay to allow UI to settle
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 100);
    }
  }, [addressId, autoExpand]);

  // Start refresh when modal opens
  useEffect(() => {
    if (open && addressId && !hasStartedRef.current) {
      startRefresh();
    }
    
    // Reset when modal closes
    if (!open) {
      hasStartedRef.current = false;
    }
  }, [open, addressId, startRefresh]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const expandAll = () => {
    const allKeys = Array.from(steps.keys()).map(i => `${steps[i].step}-${i}`);
    setExpandedSteps(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const successSteps = steps.filter(s => s.status === 'success').length;
  const errorSteps = steps.filter(s => s.status === 'error').length;
  const isComplete = steps.length > 0 && steps[steps.length - 1]?.step.toLowerCase().includes('complete');

  // Extract summary info safely
  const lastStepData = steps[steps.length - 1]?.data as Record<string, unknown> | undefined;
  const summaryData = lastStepData?.summary as Record<string, unknown> | undefined;
  const finalBalance = summaryData?.finalBalanceFormatted as string | undefined;
  const totalDuration = summaryData?.totalDuration as string | undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="700px" maxHeight="90vh">
        <Flex justify="between" align="center" mb="2">
          <Box>
            <Dialog.Title>Balance Refresh Debug</Dialog.Title>
            <Dialog.Description size="2">
              {addressInfo ? (
                <Flex align="center" gap="2">
                  <Badge color="blue">{addressInfo.code.toUpperCase()}</Badge>
                  <Code variant="ghost" className="text-xs">
                    {addressInfo.address.slice(0, 8)}...{addressInfo.address.slice(-6)}
                  </Code>
                </Flex>
              ) : (
                'Refreshing balance...'
              )}
            </Dialog.Description>
          </Box>
          
          {/* Status Summary */}
          {steps.length > 0 && (
            <Flex gap="2" align="center">
              <Badge color="gray">{steps.length} steps</Badge>
              {successSteps > 0 && <Badge color="green">{successSteps} ✓</Badge>}
              {errorSteps > 0 && <Badge color="red">{errorSteps} ✗</Badge>}
            </Flex>
          )}
        </Flex>

        <Separator size="4" my="3" />

        {/* Controls */}
        <Flex gap="2" mb="3" justify="between" align="center">
          <Flex gap="2">
            <Button 
              size="1" 
              variant="soft" 
              onClick={expandAll}
              disabled={steps.length === 0}
            >
              Expand All
            </Button>
            <Button 
              size="1" 
              variant="soft" 
              onClick={collapseAll}
              disabled={steps.length === 0}
            >
              Collapse All
            </Button>
          </Flex>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={autoExpand}
              onChange={(e) => setAutoExpand(e.target.checked)}
              className="rounded"
            />
            Auto-expand
          </label>
        </Flex>

        {/* Steps Container */}
        <Box 
          ref={scrollRef}
          className="overflow-y-auto border rounded-lg p-2 bg-gray-50"
          style={{ maxHeight: '50vh' }}
        >
          {steps.length === 0 && isLoading && (
            <Flex align="center" justify="center" py="8" gap="3">
              <Spinner size="2" />
              <Text color="gray">Initializing balance refresh...</Text>
            </Flex>
          )}
          
          {steps.map((step, index) => {
            const stepKey = `${step.step}-${index}`;
            return (
              <StepItem
                key={stepKey}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(stepKey)}
                onToggle={() => toggleStep(stepKey)}
              />
            );
          })}
        </Box>

        {/* Final Summary Card */}
        {isComplete && !isLoading && (
          <Card size="1" mt="3" className={errorSteps > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
            <Flex align="center" gap="2">
              {errorSteps > 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <Box>
                <Text weight="bold" size="2">
                  {errorSteps > 0 ? 'Completed with errors' : 'Completed successfully'}
                </Text>
                {summaryData && (
                  <Text size="2" color="gray" className="block">
                    {finalBalance && `Final balance: ${finalBalance}`}
                    {totalDuration && ` (${totalDuration})`}
                  </Text>
                )}
              </Box>
            </Flex>
          </Card>
        )}

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" onClick={handleClose}>
            Close
          </Button>
          {!isLoading && (
            <Button onClick={startRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Again
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
