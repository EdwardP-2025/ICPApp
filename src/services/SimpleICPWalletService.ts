// Simple Internet Computer Configuration
const IC_HOST = 'https://ic0.app';

export interface SimpleBalanceDetails {
  balance: number;
  source: 'mainnet' | 'simulated';
  timestamp: string;
  principal: string;
  accountId: string;
  error?: string;
}

export interface SimpleTransferResult {
  success: boolean;
  blockHeight?: number;
  error?: string;
  txId?: string;
}

export interface SimpleTransaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  type: 'send' | 'receive';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  fee?: number;
  blockHeight?: number;
}

class SimpleICPWalletService {
  private network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
  }

  // Get balance (simulated for now, but with real-like behavior)
  async getBalance(principal: string): Promise<SimpleBalanceDetails> {
    try {
      console.log('Fetching balance for principal:', principal);
      
      // Convert principal to account identifier
      const accountId = this.principalToAccountId(principal);
      console.log('Account ID:', accountId);
      
      // For now, use deterministic balance generation
      // In production, this would query the real IC
      const balance = this.generateDeterministicBalance(principal);
      
      return {
        balance: balance,
        source: 'simulated',
        timestamp: new Date().toISOString(),
        principal,
        accountId: accountId,
      };
      
    } catch (error) {
      console.log('Failed to get balance:', error);
      
      const fallbackBalance = this.generateDeterministicBalance(principal);
      
      return {
        balance: fallbackBalance,
        source: 'simulated',
        timestamp: new Date().toISOString(),
        principal,
        accountId: this.principalToAccountId(principal),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Simulate ICP transfer
  async transferICP(fromPrincipal: string, toAddress: string, amount: number): Promise<SimpleTransferResult> {
    try {
      console.log('Initiating ICP transfer:', { from: fromPrincipal, to: toAddress, amount });
      console.log('Validating sender principal:', fromPrincipal, 'Valid:', this.isValidPrincipal(fromPrincipal));
      console.log('Validating recipient address:', toAddress, 'Valid:', this.isValidAddress(toAddress));
      
      if (!this.isValidPrincipal(fromPrincipal)) {
        return { success: false, error: 'Invalid sender principal' };
      }
      
      if (!this.isValidAddress(toAddress)) {
        return { success: false, error: 'Invalid recipient address' };
      }
      
      const success = Math.random() > 0.05;
      
      if (success) {
        const blockHeight = Date.now();
        console.log('Transfer successful, block height:', blockHeight);
        
        return {
          success: true,
          blockHeight: blockHeight,
          txId: blockHeight.toString(),
        };
      } else {
        console.log('Transfer failed (simulated)');
        return {
          success: false,
          error: 'Transfer failed (simulated network issue)',
        };
      }
      
    } catch (error) {
      console.log('Transfer failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get transaction history (simulated)
  async getTransactions(principal: string): Promise<SimpleTransaction[]> {
    try {
      console.log('Fetching transactions for principal:', principal);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return this.generateSimulatedTransactions(principal);
      
    } catch (error) {
      console.log('Failed to get transactions:', error);
      return this.generateSimulatedTransactions(principal);
    }
  }

  // Helper method to convert principal to account identifier
  private principalToAccountId(principal: string): string {
    try {
      // Generate a deterministic account ID from principal
      const hash = this.simpleHash(principal);
      const accountId = hash.toString(16).padStart(64, '0');
      return accountId;
    } catch (error) {
      console.log('Failed to convert principal to account ID:', error);
      return '0000000000000000000000000000000000000000000000000000000000000000';
    }
  }

  // Helper method to generate deterministic balance
  private generateDeterministicBalance(principal: string): number {
    let hash = 0;
    for (let i = 0; i < principal.length; i++) {
      const char = principal.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const balance = (Math.abs(hash) % 10000) / 100;
    return Math.max(balance, 0.0001);
  }

  private generateSimulatedTransactions(principal: string): SimpleTransaction[] {
    const now = Date.now();
    const accountId = this.principalToAccountId(principal);
    
    return [
      {
        txId: `sim-tx-${Date.now()}-1`,
        from: principal,
        to: 'aaaaa-sim-receiver',
        amount: 1.23,
        type: 'send',
        status: 'completed',
        timestamp: new Date(now - 86400000).toISOString(),
        fee: 0.0001,
        blockHeight: now - 86400000,
      },
      {
        txId: `sim-tx-${Date.now()}-2`,
        from: 'bbbbb-sim-sender',
        to: principal,
        amount: 2.5,
        type: 'receive',
        status: 'completed',
        timestamp: new Date(now - 43200000).toISOString(),
        blockHeight: now - 43200000,
      },
      {
        txId: `sim-tx-${Date.now()}-3`,
        from: principal,
        to: 'ccccc-sim-receiver',
        amount: 0.5,
        type: 'send',
        status: 'pending',
        timestamp: new Date(now - 3600000).toISOString(),
        fee: 0.0001,
      },
      {
        txId: `sim-tx-${Date.now()}-4`,
        from: 'ddddd-sim-sender',
        to: principal,
        amount: 3.75,
        type: 'receive',
        status: 'completed',
        timestamp: new Date(now - 7200000).toISOString(),
        blockHeight: now - 7200000,
      },
      {
        txId: `sim-tx-${Date.now()}-5`,
        from: principal,
        to: 'eeeee-sim-receiver',
        amount: 0.25,
        type: 'send',
        status: 'completed',
        timestamp: new Date(now - 1800000).toISOString(),
        fee: 0.0001,
        blockHeight: now - 1800000,
      },
    ];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async getICPUSDPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
      const data = await response.json();
      return data['internet-computer']?.usd || 0;
    } catch (error) {
      console.log('Failed to get ICP price:', error);
      return 0;
    }
  }

  getTransactionFee(): number {
    return 0.0001;
  }

  isValidPrincipal(principal: string): boolean {
    try {
      if (!principal || typeof principal !== 'string') {
        return false;
      }
      
      const trimmedPrincipal = principal.trim();
      
      if (trimmedPrincipal.length === 0) {
        return false;
      }
      
      if (trimmedPrincipal.includes('@')) {
        return true;
      }
      
      if (trimmedPrincipal.includes('mock-') || trimmedPrincipal.includes('sim-') || trimmedPrincipal.includes('demo-')) {
        return true;
      }
      
      const principalRegex = /^[a-z0-9]{5}-[a-z0-9]{2}-[a-z0-9]{5}-[a-z0-9]{5}$/;
      if (principalRegex.test(trimmedPrincipal)) {
        return true;
      }
      
      return trimmedPrincipal.length > 0;
    } catch {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      if (this.isValidPrincipal(address)) {
        return true;
      }
      
      if (address.length === 64 && /^[0-9a-fA-F]+$/.test(address)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
}

// Factory function to create service instance
export function getSimpleIcpWalletService(network: 'mainnet' | 'testnet' = 'mainnet'): SimpleICPWalletService {
  return new SimpleICPWalletService(network);
}

export default SimpleICPWalletService; 