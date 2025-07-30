import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';

interface WalletScreenProps {
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ 
  onNavigateToTransfer, 
  onNavigateToHistory 
}) => {
  const { user, refreshBalance } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshBalance = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshBalance]);

  const formatBalance = (balance: number) => {
    return balance.toFixed(8);
  };

  const formatUSDValue = (balance: number, price: number) => {
    return (balance * price).toFixed(2);
  };

  const getBalanceSourceColor = (source: string) => {
    switch (source) {
      case 'mainnet':
        return '#4caf50';
      case 'mock':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getBalanceSourceText = (source: string) => {
    switch (source) {
      case 'mainnet':
        return 'Mainnet';
      case 'mock':
        return 'Mock Data';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ICP Wallet</Text>
        <Text style={styles.headerSubtitle}>Manage your ICP tokens</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <MaterialCommunityIcons name="wallet" size={24} color="#b71c1c" />
          <Text style={styles.balanceTitle}>Total Balance</Text>
        </View>
        
        <Text style={styles.balanceAmount}>
          {formatBalance(user.balance)} ICP
        </Text>
        
        {user.balance > 0 && (
          <Text style={styles.balanceUSD}>
            ≈ ${formatUSDValue(user.balance, 12.50)} USD
          </Text>
        )}

        <View style={styles.balanceSource}>
          <View style={[
            styles.sourceIndicator,
            { backgroundColor: getBalanceSourceColor(user.balanceSource || 'unknown') }
          ]} />
          <Text style={styles.sourceText}>
            {getBalanceSourceText(user.balanceSource || 'unknown')}
          </Text>
        </View>

        {user.lastBalanceUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {new Date(user.lastBalanceUpdate).toLocaleString()}
          </Text>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleRefreshBalance}>
          <MaterialCommunityIcons
            name={isRefreshing ? "loading" : "refresh"}
            size={24}
            color="#b71c1c"
          />
          <Text style={styles.actionText}>
            {isRefreshing ? 'Refreshing...' : 'Refresh Balance'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={onNavigateToTransfer}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons name="send" size={24} color="#b71c1c" />
            </View>
            <Text style={styles.actionCardTitle}>Send ICP</Text>
            <Text style={styles.actionCardSubtitle}>Transfer to another address</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={onNavigateToHistory}
          >
            <View style={styles.actionIcon}>
              <MaterialCommunityIcons name="history" size={24} color="#4caf50" />
            </View>
            <Text style={styles.actionCardTitle}>Transaction History</Text>
            <Text style={styles.actionCardSubtitle}>View recent transactions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.accountContainer}>
        <Text style={styles.accountTitle}>Account Information</Text>
        
        <View style={styles.accountItem}>
          <MaterialCommunityIcons name="account" size={20} color="#666" />
          <View style={styles.accountContent}>
            <Text style={styles.accountLabel}>Principal ID</Text>
            <Text style={styles.accountValue} numberOfLines={1}>
              {user.principal || 'Not logged in'}
            </Text>
          </View>
        </View>

        <View style={styles.accountItem}>
          <MaterialCommunityIcons name="calendar" size={20} color="#666" />
          <View style={styles.accountContent}>
            <Text style={styles.accountLabel}>Join Date</Text>
            <Text style={styles.accountValue}>
              {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.accountItem}>
          <MaterialCommunityIcons name="login" size={20} color="#666" />
          <View style={styles.accountContent}>
            <Text style={styles.accountLabel}>Login Count</Text>
            <Text style={styles.accountValue}>
              {user.loginCount || 0} times
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#b71c1c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#b71c1c',
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  balanceSource: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  sourceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  lastUpdate: {
    fontSize: 10,
    color: '#999',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#b71c1c',
    marginLeft: 8,
  },
  actionsContainer: {
    margin: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  accountContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountContent: {
    flex: 1,
    marginLeft: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
};

export default WalletScreen; 
