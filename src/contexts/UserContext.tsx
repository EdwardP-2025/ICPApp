import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIcpWalletService } from '../services/ICPWalletService';
import { useNetwork } from './NetworkContext';

export interface UserProfile {
  principal: string | null;
  nickname: string;
  avatar: string | null;
  recoveryPhrase: string[] | null;
  deviceBound: boolean;
  loggedIn: boolean;
  balance: number;
  balanceSource?: string;
  lastBalanceUpdate?: string;
}

interface UserContextType {
  user: UserProfile;
  login: (principal: string, recoveryPhrase?: string[]) => void;
  logout: () => void;
  setProfile: (nickname: string, avatar: string | null) => void;
  setRecoveryPhrase: (phrase: string[]) => void;
  setDeviceBound: (bound: boolean) => void;
  refreshBalance: () => Promise<void>;
  mockTransactions: any[];
  mockSend: (amount: number, to: string) => void;
}

const defaultUser: UserProfile = {
  principal: null,
  nickname: '',
  avatar: null,
  recoveryPhrase: null,
  deviceBound: false,
  loggedIn: false,
  balance: 0,
};

const USER_STORAGE_KEY = 'ICPApp_UserProfile';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const ICP_TRANSACTION_FEE = 0.0001;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useNetwork();
  const icpWalletService = getIcpWalletService(network);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [loading, setLoading] = useState(true);

  const [mockTransactions, setMockTransactions] = useState<any[]>([]);
  const [mockBalance, setMockBalance] = useState<number>(100);
  const useMock = true;

  const addMockTransaction = (tx: any) => {
    setMockTransactions(prev => [tx, ...prev]);
  };

  const refreshBalance = async () => {
    if (user.principal && user.loggedIn) {
      try {
        if (useMock) {
          setUser(prev => ({
            ...prev,
            balance: mockBalance,
            balanceSource: 'mock-local',
            lastBalanceUpdate: new Date().toISOString(),
          }));
        } else {
          const balanceDetails = await icpWalletService.getBalanceWithDetails(user.principal);
          setUser(prev => ({
            ...prev,
            balance: balanceDetails.balance,
            balanceSource: balanceDetails.source,
            lastBalanceUpdate: balanceDetails.timestamp,
          }));
          if (balanceDetails.source === 'mock-fallback') {
            console.warn('Using mock balance fallback. Worker may be unavailable.');
          }
        }
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  const mockSend = (amount: number, to: string) => {
    setMockBalance(prev => Math.max(prev - amount - ICP_TRANSACTION_FEE, 0));
    addMockTransaction({
      txId: 'mock-tx-' + Date.now(),
      type: 'send',
      amount,
      fee: ICP_TRANSACTION_FEE,
      symbol: 'ICP',
      from: user.principal,
      to,
      date: new Date().toISOString(),
      status: 'success',
    });
  };

  const mockReceive = (amount: number, from: string) => {
    setMockBalance(prev => prev + amount);
    addMockTransaction({
      txId: 'mock-tx-' + Date.now(),
      type: 'receive',
      amount,
      symbol: 'ICP',
      from,
      to: user.principal,
      date: new Date().toISOString(),
      status: 'success',
    });
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = { ...defaultUser, ...JSON.parse(storedUser), loggedIn: true };
          setUser(parsedUser);
          
          if (parsedUser.principal) {
            await refreshBalance();
          }
        }
      } catch (e) {
        console.log('Failed to load user from storage', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const saveUser = async () => {
      if (user.loggedIn) {
        try {
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch (e) {
          console.log('Failed to save user to storage', e);
        }
      }
    };
    saveUser();
  }, [user]);

  const login = (principal: string, recoveryPhrase?: string[]) => {
    const newState = {
      ...user,
      principal,
      loggedIn: true,
      recoveryPhrase: recoveryPhrase || user.recoveryPhrase,
      balance: 0,
    };
    
    setUser(newState);
    
    if (useMock && newState.balance === 0) {
      setTimeout(() => {
        mockReceive(50, 'test-sender');
      }, 500);
    }

    setTimeout(async () => {
      await refreshBalance();
    }, 1000);
    
    setTimeout(() => {
      console.log('User state after login (delayed check):', user);
    }, 100);
  };

  const logout = async () => {
    setUser(defaultUser);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
    } catch (e) {
      console.log('Failed to clear user from storage', e);
    }
  };

  const setProfile = (nickname: string, avatar: string | null) => {
    setUser(prev => ({ ...prev, nickname, avatar }));
  };

  const setRecoveryPhrase = (phrase: string[]) => {
    setUser(prev => ({ ...prev, recoveryPhrase: phrase }));
  };

  const setDeviceBound = (bound: boolean) => {
    setUser(prev => ({ ...prev, deviceBound: bound }));
  };

  if (loading) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, login, logout, setProfile, setRecoveryPhrase, setDeviceBound, refreshBalance, mockTransactions, mockSend }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
