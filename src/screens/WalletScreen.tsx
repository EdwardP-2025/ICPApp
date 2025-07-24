import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, FlatList, ToastAndroid, Platform, RefreshControl } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { getIcpWalletService } from '../services/ICPWalletService';
import { useNetwork } from '../contexts/NetworkContext';
import Clipboard from '@react-native-clipboard/clipboard';
import PrincipalDisplay from '../components/PrincipalDisplay';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import ReceiveModal from '../components/ReceiveModal';
import SkeletonLoader from '../components/SkeletonLoader';

function truncatePrincipal(principal: string) {
  if (!principal) return '';
  if (principal.length <= 16) return principal;
  return principal.slice(0, 8) + '...' + principal.slice(-6);
}

const WalletScreen: React.FC = () => {
  const { user, refreshBalance, mockTransactions } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [icpUsd, setIcpUsd] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]); // Changed type to any[] as Transaction type is removed
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const [selectedTx, setSelectedTx] = useState<any | null>(null); // Changed type to any
  const [modalVisible, setModalVisible] = useState(false);
  const [receiveVisible, setReceiveVisible] = useState(false);
  const { network, toggleNetwork } = useNetwork();
  const icpWalletService = getIcpWalletService(network);
  const useMock = true; // Set to true for mock/testing

  const fetchICPPrice = async () => {
    const price = await icpWalletService.getICPUSDPrice();
    setIcpUsd(price);
  };

  const fetchTransactions = async () => {
    if (!user.principal) return;
    setTxLoading(true);
    setTxError(null);
    try {
      let txs;
      if (useMock) {
        // Use mockTransactions from context
        txs = mockTransactions;
      } else {
        txs = await icpWalletService.getTransactionsReal(user.principal);
      }
      setTransactions(txs);
    } catch (e: any) {
      setTxError(e.message || 'Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchICPPrice();
    fetchTransactions();
  }, [user.principal]);

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshBalance();
      await fetchICPPrice();
      await fetchTransactions();
    } catch (error) {
      console.error('Error refreshing balance:', error);
      Alert.alert('Error', 'Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReceive = () => {
    setReceiveVisible(true);
  };

  const handleSend = () => {
    navigation.navigate('Transfer');
  };

  const handleSwap = () => {
    Alert.alert('Swap ICP', 'Swap functionality coming soon!');
  };

  const handleCopyPrincipal = () => {
    if (user.principal) {
      Clipboard.setString(user.principal);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Principal copied!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Principal copied to clipboard!');
      }
    }
  };

  if (!user.loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color="#b71c1c" />
          <Text style={styles.loginMessage}>Please log in to view your wallet</Text>
        </View>
      </SafeAreaView>
    );
  }

  const MOCK_TOKENS = [
    {
      symbol: 'ICP',
      name: 'Internet Computer',
      icon: 'alpha-i-box' as const,
      balance: user.balance,
      fiat: (user.balance * icpUsd).toFixed(2), // Real ICP to USD
    },
    // Add more tokens here in the future
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshBalance}
            colors={["#b71c1c"]}
            tintColor="#b71c1c"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessible accessibilityRole="header" accessibilityLabel="ICP Wallet">ICP Wallet</Text>
          <TouchableOpacity
            onPress={toggleNetwork}
            style={styles.networkToggleBtn}
            accessibilityLabel={`Switch to ${network === 'mainnet' ? 'testnet' : 'mainnet'}`}
            accessibilityRole="button"
            accessible
            testID="network-toggle"
          >
            <MaterialCommunityIcons name={network === 'mainnet' ? 'cloud' : 'cloud-outline'} size={22} color={network === 'mainnet' ? '#b71c1c' : '#888'} />
            <Text style={[styles.networkLabel, { color: network === 'mainnet' ? '#b71c1c' : '#888' }]}>{network.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefreshBalance}
            disabled={isRefreshing}
            accessibilityLabel="Refresh balance"
            accessibilityRole="button"
            accessible
            testID="refresh-balance"
          >
            <MaterialCommunityIcons 
              name={isRefreshing ? "loading" : "refresh"} 
              size={24} 
              color="#b71c1c" 
            />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardModern}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="alpha-i-box" size={36} color="#b71c1c" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.balanceLabelModern}>Total Balance</Text>
              {(txLoading || isRefreshing) ? (
                <>
                  <SkeletonLoader width={120} height={32} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={80} height={18} />
                </>
              ) : (
                <>
                  <Text style={styles.balanceValueModern}>{user.balance.toFixed(4)} ICP</Text>
                  <Text style={styles.fiatValueModern}>${(user.balance * icpUsd).toFixed(2)} USD</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.principalRow}>
            <PrincipalDisplay principal={user.principal || ''} label="Principal" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleReceive}
            accessibilityLabel="Receive ICP"
            accessibilityRole="button"
            accessible
            testID="quick-action-receive"
          >
            <MaterialCommunityIcons name="download" size={28} color="#b71c1c" />
            <Text style={styles.quickActionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={handleSend}>
            <MaterialCommunityIcons name="upload" size={28} color="#b71c1c" />
            <Text style={styles.quickActionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={handleSwap}>
            <MaterialCommunityIcons name="swap-horizontal" size={28} color="#b71c1c" />
            <Text style={styles.quickActionText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => {}}>
            <MaterialCommunityIcons name="chart-bar" size={28} color="#b71c1c" />
            <Text style={styles.quickActionText}>Stake</Text>
          </TouchableOpacity>
        </View>

        {/* Token List */}
        <View style={styles.tokenListSection}>
          <Text style={styles.sectionTitleModern}>Tokens</Text>
          <FlatList
            data={MOCK_TOKENS}
            keyExtractor={item => item.symbol}
            renderItem={({ item }) => (
              <View style={styles.tokenRow}>
                <MaterialCommunityIcons name={item.icon} size={32} color="#b71c1c" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenName}>{item.name}</Text>
                  <Text style={styles.tokenSymbol}>{item.symbol}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tokenBalance}>{item.balance.toFixed(4)} {item.symbol}</Text>
                  <Text style={styles.tokenFiat}>${item.fiat} USD</Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSectionModern}>
          <Text style={styles.sectionTitleModern}>Recent Transactions</Text>
          {txLoading ? (
            <View style={{ padding: 16 }}>
              {[...Array(4)].map((_, i) => (
                <SkeletonLoader key={i} width="100%" height={36} style={{ marginBottom: 14, borderRadius: 12 }} />
              ))}
            </View>
          ) : txError ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <MaterialCommunityIcons name="alert-circle" size={32} color="#b71c1c" />
              <Text style={{ color: '#b71c1c', marginTop: 12 }}>{txError}</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.noTransactionsModern}>
              <MaterialCommunityIcons name="history" size={48} color="#ccc" />
              <Text style={styles.noTransactionsTextModern}>No transactions yet</Text>
              <Text style={styles.noTransactionsSubtextModern}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={item => item.txId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setSelectedTx(item); setModalVisible(true); }}
                  activeOpacity={0.8}
                  accessibilityLabel={`View details for transaction ${item.txId}`}
                  accessibilityRole="button"
                  accessible
                  testID={`transaction-${item.txId}`}
                >
                  <View style={styles.txRow}>
                    <MaterialCommunityIcons
                      name={item.type === 'send' ? 'arrow-top-right' : 'arrow-bottom-left'}
                      size={24}
                      color={item.type === 'send' ? '#b71c1c' : '#4CAF50'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txType}>{item.type === 'send' ? 'Sent' : 'Received'} {item.amount} {item.symbol}</Text>
                      <Text style={styles.txDetail}>{item.type === 'send' ? `To: ${item.to}` : `From: ${item.from}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.txDate}>{item.date}</Text>
                      <Text style={[styles.txStatus, { color: item.status === 'success' ? '#4CAF50' : '#b71c1c' }]}>{item.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
        <TransactionDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          transaction={selectedTx}
        />
        <ReceiveModal
          visible={receiveVisible}
          onClose={() => setReceiveVisible(false)}
          principal={user.principal || ''}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginMessage: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24, // Add top padding for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 0, // Ensure no left margin
  },
  networkToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
  },
  networkLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  balanceCard: {
    backgroundColor: '#f8f8f8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  principalText: {
    fontSize: 12,
    color: '#888',
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  transactionsSection: {
    padding: 16,
  },
  noTransactions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  noTransactionsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#222',
  },
  balanceInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  balanceSourceText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  balanceUpdateText: {
    fontSize: 10,
    color: '#999',
  },
  balanceCardModern: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 8,
  },
  balanceLabelModern: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
    fontWeight: '500',
  },
  balanceValueModern: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  fiatValueModern: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '600',
  },
  principalTextModern: {
    color: '#888',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    marginRight: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  quickActionBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  quickActionBtnPressed: {
    backgroundColor: 'rgba(183,28,28,0.08)',
  },
  quickActionText: {
    fontSize: 13,
    color: '#b71c1c',
    marginTop: 6,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    width: '100%',
  },
  tokenListSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitleModern: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    marginLeft: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tokenName: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  tokenSymbol: {
    fontSize: 12,
    color: '#888',
  },
  tokenBalance: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  tokenFiat: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  transactionsSectionModern: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#fafbfc',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  noTransactionsModern: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  noTransactionsTextModern: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  noTransactionsSubtextModern: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fafbfc',
  },
  txType: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  txDetail: {
    fontSize: 12,
    color: '#888',
  },
  txDate: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 2,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  principalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'flex-end',
    width: '100%',
    gap: 6,
  },
  copyIconBtn: {
    marginLeft: 6,
    padding: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(183,28,28,0.08)',
  },
});

export default WalletScreen; 