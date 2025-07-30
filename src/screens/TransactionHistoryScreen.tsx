import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { getSimpleIcpWalletService } from '../services/SimpleICPWalletService';

interface Transaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  type: 'send' | 'receive';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  fee?: number;
}

const TransactionHistoryScreen: React.FC = () => {
  const { user, mockTransactions } = useUser();
  const simpleIcpWalletService = getSimpleIcpWalletService('mainnet');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const isLoadingRef = useRef(false);

  const convertMockTransactions = useCallback((mockTxs: any[]): Transaction[] => {
    return mockTxs.map(tx => ({
      txId: tx.txId,
      from: tx.from || 'unknown',
      to: tx.to || 'unknown',
      amount: tx.amount,
      type: tx.type,
      status: tx.status === 'success' ? 'completed' : tx.status === 'pending' ? 'pending' : 'failed',
      timestamp: tx.date,
      fee: tx.fee,
    }));
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!user.loggedIn || !user.principal) {
      console.log('User not logged in or no principal, skipping transaction load');
      return;
    }

    if (isLoadingRef.current) {
      console.log('Already loading transactions, skipping');
      return;
    }

    console.log('Loading transactions for principal:', user.principal);
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const simpleTransactions = await simpleIcpWalletService.getTransactions(user.principal);
      console.log('Loaded transactions:', simpleTransactions.length);
      
      const convertedTransactions = simpleTransactions.map(tx => ({
        txId: tx.txId,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        timestamp: tx.timestamp,
        fee: tx.fee,
      }));
      
      setTransactions(convertedTransactions);
    } catch (error) {
      console.log('Failed to load transactions:', error);
      const convertedTransactions = convertMockTransactions(mockTransactions);
      setTransactions(convertedTransactions);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [user.loggedIn, user.principal, simpleIcpWalletService, mockTransactions, convertMockTransactions]);

  useEffect(() => {
    if (user.loggedIn && user.principal) {
      loadTransactions();
    }
  }, [user.loggedIn, user.principal, mockTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filter !== 'all' && tx.type !== filter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          tx.txId.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query)
        );
      }
      
      return true;
    });
  }, [transactions, filter, searchQuery]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(8);
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    }
    return address;
  };

  const formatDate = (timestamp: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseDetail = () => {
    setSelectedTransaction(null);
  };

  const handleRefresh = useCallback(() => {
    if (!isLoadingRef.current && user.loggedIn && user.principal) {
      loadTransactions();
    }
  }, [loadTransactions, user.loggedIn, user.principal]);

  const renderTransactionItem = (transaction: Transaction) => {
    const isSend = transaction.type === 'send';

    return (
      <TouchableOpacity
        key={transaction.txId}
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(transaction)}
      >
        <View style={[
          styles.transactionIcon,
          { backgroundColor: isSend ? '#ffebee' : '#e8f5e8' }
        ]}>
          <MaterialCommunityIcons
            name={isSend ? 'arrow-up' : 'arrow-down'}
            size={20}
            color={isSend ? '#b71c1c' : '#4caf50'}
          />
        </View>
        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>
              {isSend ? 'Sent' : 'Received'}
            </Text>
            <Text style={[
              styles.transactionAmount,
              { color: isSend ? '#b71c1c' : '#4caf50' }
            ]}>
              {isSend ? '-' : '+'}{formatAmount(transaction.amount)} ICP
            </Text>
          </View>
          <Text style={styles.transactionAddress}>
            {isSend ? `To: ${formatAddress(transaction.to)}` : `From: ${formatAddress(transaction.from)}`}
          </Text>
          <View style={styles.transactionFooter}>
            <Text style={styles.transactionTime}>
              {formatDate(transaction.timestamp)}
            </Text>
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons
                name={getStatusIcon(transaction.status)}
                size={12}
                color={getStatusColor(transaction.status)}
              />
              <Text style={[
                styles.statusText,
                { color: getStatusColor(transaction.status) }
              ]}>
                {transaction.status}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#ccc"
        />
      </TouchableOpacity>
    );
  };

  const renderTransactionDetail = () => {
    if (!selectedTransaction) return null;

    return (
      <View style={styles.detailOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={handleCloseDetail}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{selectedTransaction.txId}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {selectedTransaction.type === 'send' ? 'Send' : 'Receive'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                {formatAmount(selectedTransaction.amount)} ICP
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>{selectedTransaction.from}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{selectedTransaction.to}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.detailStatus}>
                <MaterialCommunityIcons
                  name={getStatusIcon(selectedTransaction.status)}
                  size={16}
                  color={getStatusColor(selectedTransaction.status)}
                />
                <Text style={[
                  styles.detailStatusText,
                  { color: getStatusColor(selectedTransaction.status) }
                ]}>
                  {selectedTransaction.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedTransaction.timestamp).toLocaleString()}
              </Text>
            </View>
            
            {selectedTransaction.fee && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>
                  {formatAmount(selectedTransaction.fee)} ICP
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const totalSent = useMemo(() => {
    return transactions.filter(tx => tx.type === 'send').reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalReceived = useMemo(() => {
    return transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#b71c1c" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Transactions:</Text>
              <Text style={styles.summaryValue}>{transactions.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Sent:</Text>
              <Text style={styles.summaryValue}>{totalSent.toFixed(4)} ICP</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Received:</Text>
              <Text style={styles.summaryValue}>{totalReceived.toFixed(4)} ICP</Text>
            </View>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'send' && styles.filterTabActive]}
            onPress={() => setFilter('send')}
          >
            <Text style={[styles.filterText, filter === 'send' && styles.filterTextActive]}>
              Sent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'receive' && styles.filterTabActive]}
            onPress={() => setFilter('receive')}
          >
            <Text style={[styles.filterText, filter === 'receive' && styles.filterTextActive]}>
              Received
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowSearch(!showSearch)}>
            <MaterialCommunityIcons 
              name={showSearch ? "close" : "magnify"} 
              size={20} 
              color="#b71c1c" 
            />
            <Text style={styles.actionButtonText}>
              {showSearch ? 'Hide Search' : 'Search'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
            <MaterialCommunityIcons name="refresh" size={20} color="#b71c1c" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#b71c1c" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'No transactions match your search'
                : filter === 'all' 
                  ? 'You haven\'t made any transactions yet'
                  : `No ${filter} transactions found`
              }
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {filteredTransactions.map(renderTransactionItem)}
          </>
        )}
      </ScrollView>

      {renderTransactionDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row' as const,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#b71c1c',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  actionBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#b71c1c',
    marginLeft: 6,
  },
  transactionList: {
    flex: 1,
    marginTop: 10,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  transactionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  transactionAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  transactionTime: {
    fontSize: 10,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusText: {
    fontSize: 10,
    marginLeft: 4,
    textTransform: 'uppercase' as const,
  },
  detailOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  detailModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  detailHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  detailContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right' as const,
  },
  detailStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  detailStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
    textTransform: 'uppercase' as const,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    marginTop: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center' as const,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#b71c1c',
  },
});

export default TransactionHistoryScreen;
