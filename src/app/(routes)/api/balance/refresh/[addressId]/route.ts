import { prisma } from "@/libs/db";
import { balanceSources } from "@/libs/cryptoBalances";
import { SupportedCoin } from "@/libs/config";
import axios from "axios";
import { NextRequest } from "next/server";

type DebugStep = {
  step: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  timestamp: string;
  message?: string;
  data?: unknown;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
};

async function* refreshBalanceWithDebug(addressId: string): AsyncGenerator<DebugStep> {
  const startTime = Date.now();
  
  // Step 1: Initialization
  yield {
    step: 'Initialization',
    status: 'in_progress',
    timestamp: new Date().toISOString(),
    message: 'Starting balance refresh process...',
    data: { 
      addressId,
      processId: process.pid,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  };

  // Step 2: Database Connection
  yield {
    step: 'Database Connection',
    status: 'in_progress',
    timestamp: new Date().toISOString(),
    message: 'Establishing database connection...',
    metadata: { 
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
      provider: 'MongoDB via Prisma'
    }
  };

  let address;
  const dbLookupStart = Date.now();
  try {
    address = await prisma.address.findFirstOrThrow({ where: { id: addressId } });
    const dbLookupDuration = Date.now() - dbLookupStart;
    
    yield {
      step: 'Database Lookup',
      status: 'success',
      timestamp: new Date().toISOString(),
      message: `Found address in database (${dbLookupDuration}ms)`,
      duration: dbLookupDuration,
      data: {
        found: true,
        address: {
          id: address.id,
          address: address.address,
          code: address.code,
          currentBalance: address.lastBalance10pow10 ? (address.lastBalance10pow10 / 10**10) : 0,
          currentBalanceRaw: address.lastBalance10pow10,
          currentBalanceFormatted: `${address.lastBalance10pow10 ? (address.lastBalance10pow10 / 10**10) : 0} ${address.code.toUpperCase()}`,
          lastUpdated: address.balanceUpdatedAt,
          lastUpdatedFormatted: address.balanceUpdatedAt ? new Date(address.balanceUpdatedAt).toLocaleString() : 'Never',
          busyFrom: address.busyFrom,
          busyTo: address.busyTo,
          isBusy: address.busyTo && new Date(address.busyTo) > new Date(),
          invoiceId: address.invoiceId,
          createdAt: address.createdAt,
          userEmail: address.userEmail?.replace(/@.+/, '@***')
        }
      }
    };
  } catch (error) {
    const dbLookupDuration = Date.now() - dbLookupStart;
    yield {
      step: 'Database Lookup',
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Failed to find address in database',
      duration: dbLookupDuration,
      error: error instanceof Error ? error.message : String(error),
      data: { searchedId: addressId }
    };
    return;
  }

  const coin = address.code as SupportedCoin;
  
  // Step 3: Analyze Available Sources
  yield {
    step: 'Analyzing API Sources',
    status: 'in_progress',
    timestamp: new Date().toISOString(),
    message: 'Scanning available balance sources...',
    metadata: {
      requestedCoin: coin,
      totalSourcesAvailable: balanceSources.length,
      sourceDetails: balanceSources.map((s, i) => ({
        index: i,
        supportedCoins: s.supportedCoins,
        supportsRequestedCoin: s.supportedCoins.includes(coin)
      }))
    }
  };

  const applicableSources = balanceSources.filter(s => s.supportedCoins.includes(coin));
  
  yield {
    step: 'Analyzing API Sources',
    status: 'success',
    timestamp: new Date().toISOString(),
    message: `Found ${applicableSources.length} applicable source(s) for ${coin.toUpperCase()}`,
    data: { 
      requestedCoin: coin,
      totalSourcesInSystem: balanceSources.length,
      applicableSourcesCount: applicableSources.length,
      sources: applicableSources.map((s, i) => ({
        index: i,
        name: getSourceName(s, coin),
        supportedCoins: s.supportedCoins,
        priority: i + 1
      })),
      sourceOrder: applicableSources.map((s, i) => `${i + 1}. ${getSourceName(s, coin)}`).join(' → ')
    }
  };

  // Step 4: Try Each Source
  let finalBalance: number | null = null;
  let successSource: string | null = null;
  let successSourceIndex: number | null = null;

  for (let i = 0; i < applicableSources.length; i++) {
    const source = applicableSources[i];
    const sourceName = getSourceName(source, coin);
    const attemptStartTime = Date.now();
    
    yield {
      step: `API Source ${i + 1}/${applicableSources.length}: ${sourceName}`,
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      message: `Attempting to fetch balance from ${sourceName}...`,
      data: {
        sourceIndex: i,
        sourceName,
        supportedCoins: source.supportedCoins,
        attemptNumber: i + 1,
        totalAttempts: applicableSources.length,
        isLastAttempt: i === applicableSources.length - 1
      }
    };

    try {
      // Get detailed balance info
      const balanceDebug = await getBalanceWithDebug(source, coin, address.address);
      const attemptDuration = Date.now() - attemptStartTime;
      
      yield {
        step: `API Source ${i + 1}/${applicableSources.length}: ${sourceName}`,
        status: 'success',
        timestamp: new Date().toISOString(),
        message: `Successfully retrieved balance from ${sourceName} (${attemptDuration}ms)`,
        duration: attemptDuration,
        data: {
          sourceIndex: i,
          sourceName,
          request: {
            url: balanceDebug.request.url,
            method: balanceDebug.request.method,
            headers: balanceDebug.request.headers,
            timestamp: balanceDebug.requestTimestamp
          },
          response: {
            status: balanceDebug.response.status,
            statusText: balanceDebug.response.statusText,
            contentType: balanceDebug.response.contentType,
            dataSize: balanceDebug.response.dataSize,
            responseTime: balanceDebug.response.responseTime,
            rawData: balanceDebug.response.data
          },
          parsing: {
            rawBalance: balanceDebug.rawBalance,
            rawBalanceType: typeof balanceDebug.rawBalance,
            parsedBalance: balanceDebug.parsedBalance,
            parsingMethod: balanceDebug.parsingMethod,
            divisor: balanceDebug.divisor,
            validationRegex: balanceDebug.validationRegex,
            isValid: true
          },
          result: {
            balanceInSatoshis: balanceDebug.rawBalance,
            balanceInCoin: balanceDebug.parsedBalance,
            balanceFormatted: `${balanceDebug.parsedBalance} ${coin.toUpperCase()}`
          }
        }
      };

      finalBalance = balanceDebug.parsedBalance;
      successSource = sourceName;
      successSourceIndex = i;
      
      // Don't try other sources if this one succeeded
      break;
    } catch (error) {
      const attemptDuration = Date.now() - attemptStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      yield {
        step: `API Source ${i + 1}/${applicableSources.length}: ${sourceName}`,
        status: 'error',
        timestamp: new Date().toISOString(),
        message: `Failed to fetch from ${sourceName}: ${errorMessage}`,
        duration: attemptDuration,
        error: errorMessage,
        data: {
          sourceIndex: i,
          sourceName,
          error: {
            message: errorMessage,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: errorStack?.split('\n').slice(0, 5).join('\n'),
            isAxiosError: axios.isAxiosError(error),
            axiosError: axios.isAxiosError(error) ? {
              code: error.code,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
              }
            } : undefined
          },
          willRetry: i < applicableSources.length - 1
        }
      };
    }
  }

  // Step 5: Compare with existing balance
  if (finalBalance !== null) {
    const oldBalance = (address.lastBalance10pow10 || 0) / 10**10;
    const balanceChange = finalBalance - oldBalance;
    const hasBalanceChanged = Math.abs(balanceChange) > 0.00000001;
    
    yield {
      step: 'Balance Comparison',
      status: 'success',
      timestamp: new Date().toISOString(),
      message: hasBalanceChanged 
        ? `Balance changed by ${balanceChange > 0 ? '+' : ''}${balanceChange} ${coin.toUpperCase()}`
        : 'Balance unchanged',
      data: {
        previousBalance: {
          raw: address.lastBalance10pow10,
          formatted: oldBalance,
          display: `${oldBalance} ${coin.toUpperCase()}`
        },
        newBalance: {
          raw: finalBalance * 10**10,
          formatted: finalBalance,
          display: `${finalBalance} ${coin.toUpperCase()}`
        },
        change: {
          raw: balanceChange * 10**10,
          formatted: balanceChange,
          display: `${balanceChange > 0 ? '+' : ''}${balanceChange} ${coin.toUpperCase()}`,
          isIncrease: balanceChange > 0,
          isDecrease: balanceChange < 0,
          hasChanged: hasBalanceChanged
        }
      }
    };
  }

  // Step 6: Update Database
  if (finalBalance !== null) {
    const dbUpdateStart = Date.now();
    yield {
      step: 'Database Update',
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      message: 'Updating address record in database...',
      data: {
        operations: [
          { type: 'balanceChange', willExecute: (address.lastBalance10pow10 || 0) !== finalBalance * 10**10 },
          { type: 'addressUpdate', willExecute: true }
        ]
      }
    };

    try {
      const oldBalance10pow10 = address.lastBalance10pow10 || 0;
      const newBalance10pow10 = finalBalance * 10**10;
      const hasBalanceChanged = oldBalance10pow10 !== newBalance10pow10;

      // Record balance change if different
      if (hasBalanceChanged) {
        const balanceChangeRecord = await prisma.balanceChange.create({
          data: {
            addressId: address.id,
            address: address.address,
            oldBalance10pow10,
            newBalance10pow10,
            balanceChange10pow10: newBalance10pow10 - oldBalance10pow10,
          }
        });
        
        yield {
          step: 'Database Update - Balance Change Record',
          status: 'success',
          timestamp: new Date().toISOString(),
          message: 'Created balance change record',
          data: {
            record: {
              id: balanceChangeRecord.id,
              addressId: balanceChangeRecord.addressId,
              oldBalance: oldBalance10pow10 / 10**10,
              newBalance: newBalance10pow10 / 10**10,
              change: (newBalance10pow10 - oldBalance10pow10) / 10**10,
              createdAt: balanceChangeRecord.createdAt
            }
          }
        };
      }

      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: { 
          lastBalance10pow10: newBalance10pow10,
          balanceUpdatedAt: new Date 
        },
      });
      
      const dbUpdateDuration = Date.now() - dbUpdateStart;
      
      yield {
        step: 'Database Update',
        status: 'success',
        timestamp: new Date().toISOString(),
        message: `Database updated successfully (${dbUpdateDuration}ms)`,
        duration: dbUpdateDuration,
        data: {
          previousBalance: oldBalance10pow10 / 10**10,
          newBalance: finalBalance,
          change: (newBalance10pow10 - oldBalance10pow10) / 10**10,
          balanceChangeRecorded: hasBalanceChanged,
          updatedFields: ['lastBalance10pow10', 'balanceUpdatedAt'],
          updatedRecord: {
            id: updatedAddress.id,
            lastBalance10pow10: updatedAddress.lastBalance10pow10,
            balanceUpdatedAt: updatedAddress.balanceUpdatedAt
          }
        }
      };
    } catch (error) {
      const dbUpdateDuration = Date.now() - dbUpdateStart;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      yield {
        step: 'Database Update',
        status: 'error',
        timestamp: new Date().toISOString(),
        message: `Failed to update database: ${errorMessage}`,
        duration: dbUpdateDuration,
        error: errorMessage,
        data: {
          attemptedUpdate: {
            lastBalance10pow10: finalBalance * 10**10,
            balanceUpdatedAt: new Date().toISOString()
          }
        }
      };
    }
  }

  // Final Summary
  const totalDuration = Date.now() - startTime;
  
  yield {
    step: 'Process Complete',
    status: finalBalance !== null ? 'success' : 'error',
    timestamp: new Date().toISOString(),
    message: finalBalance !== null 
      ? `Successfully refreshed balance: ${finalBalance} ${coin.toUpperCase()} via ${successSource}`
      : 'Failed to retrieve balance from all sources',
    duration: totalDuration,
    data: {
      summary: {
        success: finalBalance !== null,
        finalBalance,
        finalBalanceFormatted: finalBalance !== null ? `${finalBalance} ${coin.toUpperCase()}` : null,
        successfulSource: successSource,
        successfulSourceIndex: successSourceIndex,
        totalSourcesAttempted: successSourceIndex !== null ? successSourceIndex + 1 : applicableSources.length,
        totalSourcesAvailable: applicableSources.length,
        totalDuration: `${totalDuration}ms`,
        addressId,
        coin: coin.toUpperCase()
      },
      timing: {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        totalDurationMs: totalDuration
      }
    }
  };
}

function getSourceName(source: typeof balanceSources[0], coin: SupportedCoin): string {
  // Identify source by its characteristics
  if (source.supportedCoins.length === 1 && source.supportedCoins[0] === 'btc') {
    return 'Blockchain.info';
  }
  if (source.supportedCoins.length === 1 && source.supportedCoins[0] === 'ltc') {
    return 'LitecoinSpace.org';
  }
  if (source.supportedCoins.includes('eth')) {
    return 'CryptoAPIs.io';
  }
  return `Unknown Source (supports: ${source.supportedCoins.join(', ')})`;
}

async function getBalanceWithDebug(
  source: typeof balanceSources[0], 
  coin: SupportedCoin, 
  address: string
): Promise<{
  request: { url: string; method: string; headers?: Record<string, string>; timestamp: string };
  response: { status: number; statusText: string; contentType?: string; dataSize?: number; responseTime?: number; data: unknown };
  rawBalance: string | number;
  parsedBalance: number;
  parsingMethod: string;
  divisor?: number;
  validationRegex?: string;
  requestTimestamp: string;
}> {
  const requestTimestamp = new Date().toISOString();
  
  // Blockchain.info for BTC
  if (source.supportedCoins.length === 1 && source.supportedCoins[0] === 'btc') {
    const url = `https://blockchain.info/q/addressbalance/${address}?confirmations=1`;
    const requestStart = Date.now();
    const response = await axios.get(url);
    const responseTime = Date.now() - requestStart;
    const amount = response.data as string;
    const validationRegex = '^[0-9]+$';
    
    if (!new RegExp(validationRegex).test(amount)) {
      throw new Error(`Balance validation error: ${amount} (expected regex: ${validationRegex})`);
    }
    
    return {
      request: { url, method: 'GET', timestamp: requestTimestamp },
      response: { 
        status: response.status, 
        statusText: response.statusText,
        contentType: response.headers?.['content-type'],
        dataSize: JSON.stringify(response.data).length,
        responseTime,
        data: response.data
      },
      rawBalance: amount,
      parsedBalance: parseFloat(amount) / 100000000,
      parsingMethod: 'satoshis to BTC (divide by 100,000,000)',
      divisor: 100000000,
      validationRegex,
      requestTimestamp
    };
  }
  
  // LitecoinSpace.org for LTC
  if (source.supportedCoins.length === 1 && source.supportedCoins[0] === 'ltc') {
    const url = `https://litecoinspace.org/api/address/${address}/utxo`;
    const requestStart = Date.now();
    const response = await axios.get(url);
    const responseTime = Date.now() - requestStart;
    const utxos = response.data as { value: number; status: { confirmed: boolean } }[];
    let amount = 0;
    const utxoDetails: { value: number; confirmed: boolean }[] = [];
    
    for (const utxo of utxos) {
      utxoDetails.push({ value: utxo.value, confirmed: utxo.status.confirmed });
      if (utxo.status.confirmed) {
        amount += utxo.value;
      }
    }
    
    return {
      request: { url, method: 'GET', timestamp: requestTimestamp },
      response: { 
        status: response.status, 
        statusText: response.statusText,
        contentType: response.headers?.['content-type'],
        dataSize: JSON.stringify(response.data).length,
        responseTime,
        data: { 
          totalUtxos: utxos.length,
          confirmedUtxos: utxos.filter(u => u.status.confirmed).length,
          utxos: utxoDetails
        }
      },
      rawBalance: amount,
      parsedBalance: amount / 100000000,
      parsingMethod: 'sum confirmed UTXOs, then convert litoshis to LTC (divide by 100,000,000)',
      divisor: 100000000,
      requestTimestamp
    };
  }
  
  // CryptoAPIs for all coins
  const blockchain = { btc: 'bitcoin', bch: 'bitcoin-cash', ltc: 'litecoin', eth: 'ethereum' }[coin];
  const url = `https://rest.cryptoapis.io/blockchain-data/${blockchain}/mainnet/addresses/${address}/balance`;
  const headers = { 'x-api-key': process.env.CRYPTOAPIS_APIE_KEY || '(not set)' };
  const requestStart = Date.now();
  const response = await axios.get(url, { headers: { 'x-api-key': process.env.CRYPTOAPIS_APIE_KEY } });
  const responseTime = Date.now() - requestStart;
  const amount = response.data?.data?.item?.confirmedBalance?.amount as string;
  const validationRegex = '^[0-9]+\\.?[0-9]*$';
  
  if (!new RegExp(validationRegex).test(amount)) {
    throw new Error(`Balance validation error: ${amount} (expected regex: ${validationRegex})`);
  }
  
  return {
    request: { url, method: 'GET', headers: { 'x-api-key': '***hidden***' }, timestamp: requestTimestamp },
    response: { 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers?.['content-type'],
      dataSize: JSON.stringify(response.data).length,
      responseTime,
      data: response.data
    },
    rawBalance: amount,
    parsedBalance: parseFloat(amount),
    parsingMethod: 'direct parse (API returns amount in coin units)',
    validationRegex,
    requestTimestamp
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const { addressId } = await params;
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const step of refreshBalanceWithDebug(addressId)) {
          const data = JSON.stringify(step) + '\n';
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        controller.enqueue(encoder.encode(JSON.stringify({
          step: 'Fatal Error',
          status: 'error',
          timestamp: new Date().toISOString(),
          message: 'An unexpected error occurred',
          error: errorMessage,
          data: {
            error: {
              message: errorMessage,
              stack: errorStack
            }
          }
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
