import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetwork } from './NetworkContext';
import { getIcpWalletService } from '../services/ICPWalletService';
import { getSimpleIcpWalletService } from '../services/SimpleICPWalletService';
import { getRealIcpWalletService } from '../services/RealICPWalletService';
import { internetIdentityService, InternetIdentityProfile } from '../services/InternetIdentityService';

const ICP_TRANSACTION_FEE = 0.0001;

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
  email?: string;
  bio?: string;
  location?: string;
  joinDate?: string;
  lastLoginDate?: string;
  loginCount?: number;
  deviceId?: string;
  preferences?: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
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
  transferICP: (amount: number, toAddress: string, fee?: number) => Promise<{ success: boolean; error?: string; txId?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;
  getInternetIdentityProfile: () => Promise<InternetIdentityProfile | null>;
  updateInternetIdentityProfile: (updates: Partial<InternetIdentityProfile>) => Promise<boolean>;
}

const defaultUser: UserProfile = {
  principal: null,
  nickname: '',
  avatar: null,
  recoveryPhrase: null,
  deviceBound: false,
  loggedIn: false,
  balance: 0,
  balanceSource: 'simulated',
  lastBalanceUpdate: new Date().toISOString(),
  email: '',
  bio: '',
  location: '',
  joinDate: new Date().toISOString(),
  lastLoginDate: new Date().toISOString(),
  loginCount: 0,
  deviceId: '',
  preferences: {
    notifications: true,
    darkMode: false,
    language: 'en',
  },
};

const USER_STORAGE_KEY = 'ICPApp_UserProfile';
const SESSION_KEY = 'ICPApp_Session';
const PREFERENCES_KEY = 'ICPApp_Preferences';

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  login: async () => {},
  logout: async () => {},
  setProfile: () => {},
  setRecoveryPhrase: () => {},
  setDeviceBound: () => {},
  refreshBalance: async () => {},
  mockTransactions: [],
  mockSend: () => {},
  transferICP: async () => ({ success: false, error: 'Context not initialized' }),
  updateProfile: () => {},
  updatePreferences: () => {},
  clearSession: () => {},
  isSessionValid: () => false,
  getInternetIdentityProfile: async () => null,
  updateInternetIdentityProfile: async () => false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useNetwork();
  const icpWalletService = getIcpWalletService(network);
  const simpleIcpWalletService = getSimpleIcpWalletService(network);
  const realIcpWalletService = getRealIcpWalletService(network);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [mockTransactions, setMockTransactions] = useState<any[]>([
    {
      txId: 'demo-tx-1',
      type: 'receive',
      amount: 2.5,
      fee: 0.0001,
      symbol: 'ICP',
      from: 'bbbbb-mock-sender',
      to: 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      txId: 'demo-tx-2',
      type: 'send',
      amount: 1.23,
      fee: 0.0001,
      symbol: 'ICP',
      from: 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae',
      to: 'aaaaa-mock-receiver',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'success',
    },
  ]);
  const [mockBalance, setMockBalance] = useState<number>(100);
  const useMock = true;

  const addMockTransaction = useCallback((tx: any) => {
    setMockTransactions(prev => [tx, ...prev]);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!user.loggedIn || !user.principal) {
      console.log('Cannot refresh balance: user not logged in or no principal');
      return;
    }

    try {
      console.log('Refreshing real ICP balance for principal:', user.principal);
      const balanceDetails = await realIcpWalletService.getBalance(user.principal);
      
      console.log('Real balance refresh result:', balanceDetails);
      
      setUser(prev => ({
        ...prev,
        balance: Number(balanceDetails.balance) / 100000000, // Convert from e8s to ICP
        balanceSource: balanceDetails.source,
        lastBalanceUpdate: balanceDetails.timestamp,
        accountId: balanceDetails.accountId,
      }));
      
    } catch (error) {
      console.log('Failed to refresh real balance:', error);
      // Keep the existing balance if refresh fails
    }
  }, [user.loggedIn, user.principal, realIcpWalletService]);

  const mockSend = useCallback((amount: number, to: string) => {
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
  }, [user.principal, addMockTransaction]);

  const mockReceive = useCallback((amount: number, from: string) => {
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
  }, [user.principal, addMockTransaction]);

  // Real transfer method that updates balance and history
  const transferICP = useCallback(async (amount: number, toAddress: string, fee: number = ICP_TRANSACTION_FEE) => {
    if (!user.loggedIn || !user.principal) {
      console.log('Transfer failed: User not logged in or no principal');
      return { success: false, error: 'User not logged in' };
    }

    if (amount <= 0) {
      console.log('Transfer failed: Invalid amount');
      return { success: false, error: 'Invalid amount' };
    }

    const totalAmount = amount + fee;
    if (totalAmount > user.balance) {
      console.log('Transfer failed: Insufficient balance', { totalAmount, balance: user.balance });
      return { success: false, error: 'Insufficient balance' };
    }

    const originalBalance = user.balance;
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('=== TRANSFER DEBUG ===');
      console.log('User principal:', user.principal);
      console.log('Transfer details:', { amount, toAddress, fee, totalAmount, originalBalance });
      
      // Optimistic update
      const newBalance = originalBalance - totalAmount;
      console.log('Will update balance from', originalBalance, 'to', newBalance);
      
      setUser(prev => {
        console.log('Actually updating balance from', prev.balance, 'to', newBalance);
        return {
          ...prev,
          balance: newBalance,
        };
      });

      const newTransaction = {
        txId,
        type: 'send',
        amount,
        fee,
        symbol: 'ICP',
        from: user.principal,
        to: toAddress,
        date: new Date().toISOString(),
        status: 'pending',
        blockHeight: null,
      };

      console.log('Adding transaction to history:', newTransaction);
      setMockTransactions(prev => {
        console.log('Previous transactions count:', prev.length);
        const newList = [newTransaction, ...prev];
        console.log('New transactions count:', newList.length);
        return newList;
      });

      const result = await realIcpWalletService.transferICP(user.principal!, toAddress, amount);
      console.log('Transfer service result:', result);
      
      if (result.success) {
        console.log('Transfer successful, updating transaction status');
        
        setMockTransactions(prev => 
          prev.map(tx => 
            tx.txId === txId 
              ? { 
                  ...tx, 
                  status: 'success', 
                  blockHeight: result.blockHeight,
                  date: new Date().toISOString()
                }
              : tx
          )
        );

        setTimeout(() => {
          refreshBalance();
        }, 2000);

        return { 
          success: true, 
          txId: result.blockHeight?.toString() || txId 
        };
      } else {
        console.log('Transfer failed:', result.error);
        
        setUser(prev => {
          console.log('Reverting balance from', prev.balance, 'to', originalBalance);
          return {
            ...prev,
            balance: originalBalance,
          };
        });

        setMockTransactions(prev => 
          prev.filter(tx => tx.txId !== txId)
        );

        return { 
          success: false, 
          error: result.error || 'Transfer failed' 
        };
      }
      
    } catch (error) {
      console.log('Transfer exception:', error);
      
      setUser(prev => ({
        ...prev,
        balance: originalBalance,
      }));

      setMockTransactions(prev => 
        prev.filter(tx => tx.txId !== txId)
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [user.loggedIn, user.principal, user.balance, realIcpWalletService, refreshBalance]);

  // Enhanced profile update method
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      setUser(prev => ({ ...prev, ...updates }));
      
      // Also update Internet Identity profile if principal matches
      const iiProfile = await internetIdentityService.getCurrentProfile();
      if (iiProfile && iiProfile.principal === user.principal) {
        await internetIdentityService.updateProfile({
          nickname: updates.nickname || iiProfile.nickname,
          avatar: updates.avatar || iiProfile.avatar,
        });
      }
      
      await saveUser();
    } catch (error) {
      console.log('Failed to update profile:', error);
    }
  }, [user.principal]);

  // Internet Identity integration methods
  const getInternetIdentityProfile = useCallback(async (): Promise<InternetIdentityProfile | null> => {
    return await internetIdentityService.getCurrentProfile();
  }, []);

  const updateInternetIdentityProfile = useCallback(async (updates: Partial<InternetIdentityProfile>): Promise<boolean> => {
    return await internetIdentityService.updateProfile(updates);
  }, []);

  // Enhanced login method with Internet Identity integration
  const login = useCallback(async (principal: string) => {
    try {
      console.log('🔐 Logging in with principal:', principal);
      
      // Check if this is a real Internet Identity principal (11 segments or 4 segments for testing)
      const segments = principal.split('-');
      const isRealII = (segments.length === 11 && 
                       segments.slice(0, 10).every(segment => segment.length === 5) &&
                       segments[10].length >= 1 && segments[10].length <= 5) ||
                      (segments.length === 4 && segments.every(segment => segment.length === 5));
      
      if (isRealII) {
        console.log('✅ Real Internet Identity principal detected');
        
        // Get the Internet Identity profile
        const iiProfile = await internetIdentityService.getCurrentProfile();
        
        if (iiProfile && iiProfile.isAuthenticated) {
          console.log('✅ Found authenticated Internet Identity profile:', iiProfile);
          
          setUser({
            ...user,
            loggedIn: true,
            principal: iiProfile.principal,
            nickname: iiProfile.nickname,
            avatar: iiProfile.avatar,
            email: user.email,
            bio: user.bio,
            location: user.location,
            preferences: user.preferences,
            balance: user.balance,
          });
          
          console.log('✅ User logged in with real Internet Identity');
          return;
        } else {
          console.log('⚠️ No authenticated Internet Identity profile found, using principal directly');
          
          // Use the principal directly if no profile is found
          setUser({
            ...user,
            loggedIn: true,
            principal: principal,
            nickname: `User-${principal.substring(0, 8)}`,
            avatar: user.avatar,
            email: user.email,
            bio: user.bio,
            location: user.location,
            preferences: user.preferences,
            balance: user.balance,
          });
          
          console.log('✅ User logged in with principal directly');
          return;
        }
      }
      
      // Fallback to manual login
      console.log('🔑 Using manual login fallback');
      
      setUser({
        ...user,
        loggedIn: true,
        principal: principal,
        nickname: user.nickname || `User_${principal.substr(0, 8)}`,
        avatar: user.avatar,
        email: user.email,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        balance: user.balance,
      });
      
      console.log('✅ User logged in successfully');
      
    } catch (error) {
      console.log('❌ Login failed:', error);
      throw error;
    }
  }, [user]);

  // Enhanced logout method with Internet Identity integration
  const logout = useCallback(async () => {
    try {
      await internetIdentityService.logout();
      setUser(defaultUser);
      await saveUser();
      console.log('Logout successful with Internet Identity integration');
    } catch (error) {
      console.log('Logout failed:', error);
    }
  }, []);

  // Enhanced preferences update method
  const updatePreferences = useCallback((preferences: Partial<UserProfile['preferences']>) => {
    updateProfile({ 
      preferences: { 
        notifications: true,
        darkMode: false,
        language: 'en',
        ...user.preferences, 
        ...preferences 
      } 
    });
  }, [updateProfile, user.preferences]);

  // Clear session data
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(defaultUser);
    } catch (error) {
      console.log('Failed to clear session:', error);
    }
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback((): boolean => {
    return user.loggedIn && !!user.principal;
  }, [user.loggedIn, user.principal]);

  // Check for saved Internet Identity profiles and auto-login
  const checkForSavedProfile = useCallback(async () => {
    try {
      const iiProfile = await internetIdentityService.getCurrentProfile();
      if (iiProfile && iiProfile.isAuthenticated && !user.loggedIn) {
        console.log('🔄 Found saved authenticated profile, auto-logging in...');
        await login(iiProfile.principal);
      }
    } catch (error) {
      console.log('❌ Error checking for saved profile:', error);
    }
  }, [user.loggedIn, login]);

  // Check for saved profile when app starts
  useEffect(() => {
    checkForSavedProfile();
  }, [checkForSavedProfile]);

  // Set up authentication callback
  useEffect(() => {
    internetIdentityService.setAuthenticationCallback(async (profile: InternetIdentityProfile) => {
      console.log('🔄 Authentication completed, logging in with profile:', profile.principal);
      await login(profile.principal);
    });
  }, [login]);

  const saveUser = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(SESSION_KEY, 'valid');
    } catch (error) {
      console.log('Failed to save user:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, isSaving]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const loadedUser = JSON.parse(stored);
        setUser(loadedUser);
      }
    } catch (error) {
      console.log('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveUser();
    }
  }, [user, loading, saveUser]);

  const setProfile = useCallback((nickname: string, avatar: string | null) => {
    updateProfile({ nickname, avatar });
  }, [updateProfile]);

  const setRecoveryPhrase = useCallback((phrase: string[]) => {
    updateProfile({ recoveryPhrase: phrase });
  }, [updateProfile]);

  const setDeviceBound = useCallback((bound: boolean) => {
    updateProfile({ deviceBound: bound });
  }, [updateProfile]);

  // Don't render children until loading is complete
  if (loading) {
    return (
      <UserContext.Provider value={{
        user: defaultUser,
        login: async () => {},
        logout: async () => {},
        setProfile: () => {},
        setRecoveryPhrase: () => {},
        setDeviceBound: () => {},
        refreshBalance: async () => {},
        mockTransactions: [],
        mockSend: () => {},
        transferICP: async () => ({ success: false, error: 'Loading...' }),
        updateProfile: () => {},
        updatePreferences: () => {},
        clearSession: () => {},
        isSessionValid: () => false,
        getInternetIdentityProfile: async () => null,
        updateInternetIdentityProfile: async () => false,
      }}>
        {children}
      </UserContext.Provider>
    );
  }

  const contextValue: UserContextType = {
    user,
    login,
    logout,
    setProfile,
    setRecoveryPhrase,
    setDeviceBound,
    refreshBalance,
    mockTransactions,
    mockSend,
    transferICP,
    updateProfile,
    updatePreferences,
    clearSession,
    isSessionValid,
    getInternetIdentityProfile,
    updateInternetIdentityProfile,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  return context;
};
