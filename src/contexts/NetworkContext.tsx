import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Network = 'mainnet' | 'testnet';

interface NetworkContextType {
  network: Network;
  toggleNetwork: () => void;
  setNetwork: (n: Network) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);
const NETWORK_KEY = 'ICPApp_Network';

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [network, setNetworkState] = useState<Network>('mainnet');

  useEffect(() => {
    AsyncStorage.getItem(NETWORK_KEY).then(stored => {
      if (stored === 'testnet' || stored === 'mainnet') setNetworkState(stored);
    });
  }, []);

  const setNetwork = (n: Network) => {
    setNetworkState(n);
    AsyncStorage.setItem(NETWORK_KEY, n);
  };

  const toggleNetwork = () => {
    const next = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetworkState(next);
    AsyncStorage.setItem(NETWORK_KEY, next);
  };

  return (
    <NetworkContext.Provider value={{ network, toggleNetwork, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
};
