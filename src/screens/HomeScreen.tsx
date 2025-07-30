import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';

interface HomeScreenProps {
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToAppStore?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNavigateToTransfer, 
  onNavigateToHistory,
  onNavigateToAppStore
}) => {
  const { user, refreshBalance, mockTransactions } = useUser();
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

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    }
    return address;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
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

  const quickActions = useMemo(() => [
    {
      id: 'transfer',
      title: 'Send ICP',
      subtitle: 'Transfer to another address',
      icon: 'send',
      color: '#b71c1c',
      onPress: onNavigateToTransfer,
      },
      {
      id: 'receive',
      title: 'Receive ICP',
      subtitle: 'Get your address',
      icon: 'download',
      color: '#4caf50',
      onPress: () => {
        console.log('Receive ICP');
      },
    },
    {
      id: 'history',
      title: 'Transaction History',
      subtitle: 'View recent transactions',
      icon: 'history',
      color: '#2196f3',
      onPress: onNavigateToHistory,
    },
    {
      id: 'appstore',
      title: 'App Store',
      subtitle: 'Discover dApps',
      icon: 'store',
      color: '#ff9800',
      onPress: onNavigateToAppStore,
    },
  ], [onNavigateToTransfer, onNavigateToHistory, onNavigateToAppStore]);

  const recentActivity = useMemo(() => {
    return mockTransactions
      .slice(0, 3)
      .map(tx => ({
        id: tx.txId,
        type: tx.type,
        amount: tx.amount,
        from: tx.from,
        to: tx.to,
        time: formatTimeAgo(tx.date),
        status: tx.status,
        fee: tx.fee,
      }));
  }, [mockTransactions]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.userName}>{user.nickname || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshBalance}>
          <MaterialCommunityIcons
            name={isRefreshing ? "loading" : "refresh"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Total Balance</Text>
          <View style={styles.balanceSource}>
            <View style={[
              styles.sourceIndicator,
              { backgroundColor: getBalanceSourceColor(user.balanceSource || 'unknown') }
            ]} />
            <Text style={styles.sourceText}>
              {getBalanceSourceText(user.balanceSource || 'unknown')}
            </Text>
          </View>
        </View>
        
        <Text style={styles.balanceAmount}>
          {formatBalance(user.balance)} ICP
        </Text>
        
        {user.balance > 0 && (
          <Text style={styles.balanceUSD}>
            ≈ ${formatUSDValue(user.balance, 12.50)} USD
          </Text>
        )}

        {user.lastBalanceUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {new Date(user.lastBalanceUpdate).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={onNavigateToHistory}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'send' ? '#ffebee' : '#e8f5e8' }
              ]}>
                <MaterialCommunityIcons
                  name={activity.type === 'send' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={activity.type === 'send' ? '#b71c1c' : '#4caf50'}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityType}>
                  {activity.type === 'send' ? 'Sent' : 'Received'}
                </Text>
                <Text style={[
                  styles.activityAmount,
                  { color: activity.type === 'send' ? '#b71c1c' : '#4caf50' }
                ]}>
                  {activity.type === 'send' ? '-' : '+'}{activity.amount.toFixed(8)} ICP
                </Text>
                <Text style={styles.activityAddress}>
                  {activity.type === 'send' 
                    ? `To: ${formatAddress(activity.to || 'unknown')}`
                    : `From: ${formatAddress(activity.from || 'unknown')}`
                  }
                </Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTime}>{activity.time}</Text>
                <View style={styles.statusContainer}>
                  <MaterialCommunityIcons
                    name={activity.status === 'success' ? 'check-circle' : 
                          activity.status === 'pending' ? 'clock' : 'close-circle'}
                    size={12}
                    color={activity.status === 'success' ? '#4caf50' : 
                           activity.status === 'pending' ? '#ff9800' : '#f44336'}
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyActivity}>
            <MaterialCommunityIcons name="history" size={32} color="#ccc" />
            <Text style={styles.emptyActivityText}>No recent activity</Text>
            <Text style={styles.emptyActivitySubtext}>Your transactions will appear here</Text>
          </View>
        )}
      </View>

      {/* Network Status */}
      <View style={styles.networkStatusContainer}>
        <View style={styles.networkStatus}>
          <MaterialCommunityIcons name="wifi" size={16} color="#4caf50" />
          <Text style={styles.networkStatusText}>Connected to ICP Mainnet</Text>
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: 'white',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
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
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  balanceSource: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  sourceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
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
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 10,
    color: '#999',
  },
  quickActionsContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  recentActivityContainer: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#b71c1c',
    fontWeight: '600' as const,
  },
  activityItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#b71c1c',
    marginTop: 2,
  },
  activityAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityMeta: {
    alignItems: 'flex-end' as const,
  },
  activityTime: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  emptyActivity: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  networkStatusContainer: {
    margin: 20,
  },
  networkStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  networkStatusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
};

export default HomeScreen; 
