import { HttpAgent } from '@dfinity/agent';
import { LedgerCanister } from '@dfinity/ledger-icp';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { Buffer } from 'buffer';
// @ts-ignore: If 'js-sha256' types are missing, ignore for now. For production, add types or use a compatible hash function.
import sha256 from 'js-sha256';
import { AccountIdentifier } from '@dfinity/ledger-icp';

// ICP Wallet Service with Cloudflare Worker integration
export interface Transaction {
  txId: string;
  type: 'send' | 'receive';
  amount: number;
  symbol: string;
  from?: string;
  to?: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
}

// Helper to convert ArrayBuffer to hex string
function toHexString(buffer: ArrayBuffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
}

/**
 * Convert a principal to a valid ICP account identifier (hex string)
 * @param principal Principal string
 * @param subAccount Optional subaccount (Uint8Array, 32 bytes)
 * @returns Account identifier as hex string
 */
export function principalToAccountId(principal: string, subAccount?: Uint8Array): string {
  const padding = Buffer.from('\x0Aaccount-id');
  const principalBuffer = Principal.fromText(principal).toUint8Array();
  const subAccountBuffer = subAccount ? subAccount : Buffer.alloc(32);
  const data = Buffer.concat([padding, Buffer.from(principalBuffer), Buffer.from(subAccountBuffer)]);
  // Hash with sha224, then append CRC32
  const hash = Buffer.from(sha256.sha224.arrayBuffer(data));
  // CRC32 (4 bytes, big-endian)
  const crc32 = Buffer.alloc(4);
  crc32.writeUInt32BE(crc32of(hash), 0);
  // Final account identifier: CRC32 + hash
  return Buffer.concat([crc32, hash]).toString('hex');
}

// CRC32 implementation for account identifier
function crc32of(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return ~crc >>> 0;
}
const table = (() => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
})();

export class ICPWalletService {
  private readonly MAINNET_URL = 'https://icp-balance-worker.icp-balance-api.workers.dev';
  private readonly TESTNET_URL = 'https://icp-balance-worker-staging.icp-balance-worker.workers.dev';
  private readonly network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
  }

  private getWorkerUrl() {
    return this.network === 'mainnet' ? this.MAINNET_URL : this.TESTNET_URL;
  }

  // Get real balance from Cloudflare Worker
  public async getBalance(principal: string): Promise<number> {
    try {
      
      // Try to get real balance from Cloudflare Worker
      const balance = await this.getRealBalanceFromWorker(principal);
      
      return balance;
    } catch (error) {
      console.error('Error fetching real balance, falling back to mock:', error);
      // Fallback to mock balance if worker fails
      return this.getMockBalance(principal);
    }
  }

  // Get real balance from Cloudflare Worker
  private async getRealBalanceFromWorker(principal: string): Promise<number> {
    try {
      const url = `${this.getWorkerUrl()}/api/balance?principal=${encodeURIComponent(principal)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Worker error: ${data.error}`);
      }

      // Validate the response
      if (typeof data.balance !== 'number') {
        throw new Error('Invalid balance format from worker');
      }

      return data.balance;

    } catch (error) {
      console.error('Error fetching from primary worker, trying fallback:', error);
      
      // Try fallback worker
      try {
        const fallbackUrl = `${this.TESTNET_URL}/api/balance?principal=${encodeURIComponent(principal)}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (typeof fallbackData.balance === 'number') {
            return fallbackData.balance;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback worker also failed:', fallbackError);
      }

      throw error;
    }
  }

  // Get mock balance for development (fallback)
  private getMockBalance(principal: string): number {
    // Generate a mock balance based on principal
    const hash = this.hashString(principal);
    const balance = (hash % 10000) / 100; // 0-100 ICP
    return balance;
  }

  // Simple hash function for mock balance
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Format balance for display
  public formatBalance(balance: number): string {
    return balance.toFixed(4);
  }

  // Get account identifier from principal (for future use)
  // This method is no longer needed as principalToAccountId is now a standalone function.
  // Keeping it for now to avoid breaking existing calls, but it will be removed in a future edit.
  private principalToAccountId(principal: string): Uint8Array {
    try {
      const principalObj = Principal.fromText(principal);
      // For now, return a simple byte array
      // In real implementation, this would be the proper account identifier
      return new Uint8Array(32);
    } catch (error) {
      console.error('Error converting principal to account ID:', error);
      return new Uint8Array(32);
    }
  }

  // Test worker connectivity
  public async testWorkerConnection(): Promise<boolean> {
    try {
      const testUrl = `${this.MAINNET_URL}/api/balance?principal=test-principal`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Worker connection test failed:', error);
      return false;
    }
  }

  // Get balance with detailed response (always use mock endpoint)
  public async getBalanceWithDetails(principal: string): Promise<{
    balance: number;
    source: string;
    timestamp: string;
    error?: string;
  }> {
    try {
      const url = `${this.MAINNET_URL}/api/balance?principal=${encodeURIComponent(principal)}&mock=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        balance: data.balance || 0,
        source: data.source || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        error: data.error,
      };
    } catch (error) {
      console.error('Error fetching balance with details:', error);
      // Return mock data with error info
      return {
        balance: this.getMockBalance(principal),
        source: 'mock-fallback',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Always use mock endpoint for transferICP in React Native
  public async transferICP({ fromPrincipal, toAddress, amount }: { fromPrincipal: string, toAddress: string, amount: number }) {
    try {
      // Use the mock endpoint
      const url = `${this.MAINNET_URL}/api/transfer?mock=true`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromPrincipal,
          to: toAddress,
          amount,
        }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        return { success: true, txId: data.txId };
      } else {
        return { success: false, error: data.error || 'Transfer failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  // Real ICP transfer (client-side signing)
  // In transferICPReal, ensure all principal parameters are of type Principal, not string
  public async transferICPReal({ fromIdentity, toPrincipal, amount }: { fromIdentity: Ed25519KeyIdentity, toPrincipal: Principal, amount: number }) {
    // toPrincipal is now a Principal type
    const toAccountId = AccountIdentifier.fromPrincipal({ principal: toPrincipal, subAccount: undefined });
    const agent = new HttpAgent({ identity: fromIdentity, host: 'https://ic0.app' });
    const ledger = LedgerCanister.create({ agent, canisterId: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai') });
    // Use Number instead of BigInt for compatibility if BigInt is not available
    const amountE8s = Math.floor(amount * 100_000_000);
    const feeE8s = 10_000;
    // Use Number instead of BigInt for compatibility if BigInt is not available
    const result = await ledger.transfer({
      to: toAccountId,
      amount: BigInt(amountE8s),
      fee: BigInt(feeE8s),
      memo: BigInt(0),
      fromSubAccount: [],
    });
    return result;
  }

  // Real transaction history (using ic.rocks)
  public async getTransactionsReal(principal: string) {
    const accountId = principalToAccountId(principal);
    const url = `https://ic.rocks/api/accounts/${accountId}/transactions`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  }

  // Fetch real-time ICP to USD price from CoinGecko
  public async getICPUSDPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
      if (!response.ok) throw new Error('Failed to fetch ICP price');
      const data = await response.json();
      return data['internet-computer']?.usd || 0;
    } catch (error) {
      console.error('Error fetching ICP/USD price:', error);
      return 0;
    }
  }

  // Fetch real ICP transaction fee (in ICP)
  public async getICPTransactionFee(): Promise<number> {
    try {
      // Try to fetch from worker (if supported)
      const response = await fetch(`${this.MAINNET_URL}/api/fee`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch fee');
      const data = await response.json();
      if (typeof data.fee === 'number') return data.fee;
      // If fee is in e8s (ledger default), convert to ICP
      if (typeof data.fee_e8s === 'number') return data.fee_e8s / 1e8;
      return 0.0001; // fallback
    } catch (error) {
      // Fallback to default ICP fee (0.0001)
      return 0.0001;
    }
  }

  /**
   * Fetch transaction history for a principal from the worker API (always use mock endpoint)
   * @param principal The principal to fetch transactions for.
   * @returns Promise<Transaction[]>
   */
  public async getTransactions(principal: string): Promise<Transaction[]> {
    try {
      const url = `${this.MAINNET_URL}/api/transactions?principal=${encodeURIComponent(principal)}&mock=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      if (!Array.isArray(data.transactions)) throw new Error('Invalid transactions format');
      // Validate and map transactions
      return data.transactions.map((tx: any) => ({
        txId: tx.txId || tx.id || '',
        type: tx.type === 'send' ? 'send' : 'receive',
        amount: typeof tx.amount === 'number' ? tx.amount : Number(tx.amount),
        symbol: tx.symbol || 'ICP',
        from: tx.from,
        to: tx.to,
        date: tx.date || new Date().toISOString(),
        status: tx.status === 'success' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }
}

export const getIcpWalletService = (network: 'mainnet' | 'testnet') => new ICPWalletService(network);
