import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Transaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  type: 'send' | 'receive';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  fee?: number;
  blockHeight?: number;
  memo?: string;
}

interface TransactionDetailsModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  visible,
  transaction,
  onClose,
}) => {
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
    return date.toLocaleString();
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

  const handleViewOnExplorer = () => {
    if (transaction?.blockHeight) {
      const url = `https://dashboard.internetcomputer.org/transaction/${transaction.blockHeight}`;
      Linking.openURL(url);
    }
  };

  const handleCopyTxId = () => {
    if (transaction?.txId) {
      console.log('Copying transaction ID:', transaction.txId);
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Transaction Status */}
            <View style={styles.statusSection}>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons
                  name={getStatusIcon(transaction.status)}
                  size={24}
                  color={getStatusColor(transaction.status)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                  {transaction.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.transactionType}>
                {transaction.type === 'send' ? 'Sent' : 'Received'}
              </Text>
            </View>

            {/* Amount Section */}
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <Text style={[
                styles.amountText,
                { color: transaction.type === 'send' ? '#b71c1c' : '#4caf50' }
              ]}>
                {transaction.type === 'send' ? '-' : '+'}{formatAmount(transaction.amount)} ICP
              </Text>
              {transaction.fee && (
                <Text style={styles.feeText}>
                  Fee: {formatAmount(transaction.fee)} ICP
                </Text>
              )}
            </View>

            {/* Transaction Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Transaction Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transaction ID:</Text>
                <View style={styles.infoValueContainer}>
                  <Text style={styles.infoValue}>{transaction.txId}</Text>
                  <TouchableOpacity onPress={handleCopyTxId} style={styles.copyButton}>
                    <MaterialCommunityIcons name="content-copy" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>From:</Text>
                <Text style={styles.infoValue}>{formatAddress(transaction.from)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>To:</Text>
                <Text style={styles.infoValue}>{formatAddress(transaction.to)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{formatDate(transaction.timestamp)}</Text>
              </View>

              {transaction.blockHeight && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Block Height:</Text>
                  <Text style={styles.infoValue}>{transaction.blockHeight}</Text>
                </View>
              )}

              {transaction.memo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Memo:</Text>
                  <Text style={styles.infoValue}>{transaction.memo}</Text>
                </View>
              )}
            </View>

            {/* Network Information */}
            <View style={styles.networkSection}>
              <Text style={styles.sectionTitle}>Network Information</Text>
              <Text style={styles.networkText}>
                This transaction was processed on the Internet Computer mainnet.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              {transaction.blockHeight && (
                <TouchableOpacity style={styles.actionButton} onPress={handleViewOnExplorer}>
                  <MaterialCommunityIcons name="external-link" size={20} color="#2196f3" />
                  <Text style={styles.actionButtonText}>View on Explorer</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statusSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 8,
    textTransform: 'uppercase' as const,
  },
  transactionType: {
    fontSize: 14,
    color: '#666',
  },
  amountSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  feeText: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right' as const,
  },
  infoValueContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  networkSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  networkText: {
    fontSize: 12,
    color: '#1976d2',
    lineHeight: 18,
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600' as const,
    marginLeft: 8,
  },
};

export default TransactionDetailsModal;
