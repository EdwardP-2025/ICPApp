import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import HomeScreen from './src/screens/HomeScreen';
import MarketScreen from './src/screens/MarketScreen';
import WalletScreen from './src/screens/WalletScreen';
import MineScreen from './src/screens/MineScreen';
import TransferScreen from './src/screens/TransferScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import AppStoreScreen from './src/screens/AppStoreScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import InternetIdentityLoginScreen from './src/screens/InternetIdentityLoginScreen';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const TABS = [
  { id: 'Home', title: 'Home', icon: '🏠' },
  { id: 'Market', title: 'App Store', icon: '🛒' },
  { id: 'Wallet', title: 'Wallet', icon: '💰' },
  { id: 'Mine', title: 'Mine', icon: '👤' },
];

function TabNavigator() {
  const [activeTab, setActiveTab] = useState('Home');
  const { user } = useUser();
  const [currentScreen, setCurrentScreen] = useState<'main' | 'transfer' | 'history' | 'appstore' | 'editprofile'>('main');

  const handleTabPress = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setCurrentScreen('main');
  }, []);

  const handleNavigateToTransfer = useCallback(() => {
    setCurrentScreen('transfer');
  }, []);

  const handleNavigateToHistory = useCallback(() => {
    setCurrentScreen('history');
  }, []);

  const handleNavigateToAppStore = useCallback(() => {
    setCurrentScreen('appstore');
  }, []);

  const handleNavigateToEditProfile = useCallback(() => {
    setCurrentScreen('editprofile');
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentScreen('main');
  }, []);

  const renderTabContent = useCallback(() => {
    if (currentScreen === 'transfer') {
      return <TransferScreen />;
    }
    if (currentScreen === 'history') {
      return <TransactionHistoryScreen />;
    }
    if (currentScreen === 'appstore') {
      return <AppStoreScreen />;
    }
    if (currentScreen === 'editprofile') {
      return <EditProfileScreen navigation={{ goBack: handleBackToMain }} />;
    }

    switch (activeTab) {
      case 'Home':
        return <HomeScreen onNavigateToTransfer={handleNavigateToTransfer} onNavigateToHistory={handleNavigateToHistory} onNavigateToAppStore={handleNavigateToAppStore} />;
      case 'Market':
        return <AppStoreScreen />;
      case 'Wallet':
        return <WalletScreen onNavigateToTransfer={handleNavigateToTransfer} onNavigateToHistory={handleNavigateToHistory} />;
      case 'Mine':
        return <MineScreen navigation={{ navigate: handleNavigateToEditProfile }} />;
      default:
        return <HomeScreen onNavigateToTransfer={handleNavigateToTransfer} onNavigateToHistory={handleNavigateToHistory} onNavigateToAppStore={handleNavigateToAppStore} />;
    }
  }, [activeTab, currentScreen, handleNavigateToTransfer, handleNavigateToHistory, handleNavigateToAppStore, handleNavigateToEditProfile, handleBackToMain]);

  const renderContent = useCallback(() => {
    if (currentScreen === 'main') {
      return (
        <>
          <View style={styles.content}>
            {renderTabContent()}
          </View>
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => handleTabPress(tab.id)}
              >
                <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabLabel]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToMain}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>
              {currentScreen === 'transfer' ? 'Transfer ICP' :
               currentScreen === 'history' ? 'Transaction History' :
               currentScreen === 'appstore' ? 'App Store' :
               currentScreen === 'editprofile' ? 'Edit Profile' : 
               activeTab === 'Market' ? 'App Store' : ''}
            </Text>
            {currentScreen === 'editprofile' && (
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.content}>
            {renderTabContent()}
          </View>
        </>
      );
    }
  }, [user.loggedIn, activeTab, currentScreen, handleBackToMain, handleTabPress, renderTabContent]);

  return renderContent();
}

function AppContent() {
  const { user } = useUser();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.includes('auth')) {
        console.log('Deep link received:', event.url);
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => {
    };
  }, []);

  // Show login screen if user is not logged in
  if (!user.loggedIn) {
    return <InternetIdentityLoginScreen />;
  }

  return <TabNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b71c1c',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b71c1c',
  },
  saveButtonText: {
    color: '#b71c1c',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
