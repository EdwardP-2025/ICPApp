import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface TransferConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  transferDetails: {
    to: string;
    amount: number;
    fee: number;
    total: number;
    from: string;
    balance: number;
  };
  isTransferring: boolean;
  error?: string;
}

const TransferConfirmationModal: React.FC<TransferConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  transferDetails,
  isTransferring,
  error,
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ff9800" />
            <Text style={styles.headerTitle}>Confirm Transfer</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Transfer Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Transfer Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To:</Text>
                <Text style={styles.summaryValue}>{formatAddress(transferDetails.to)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryValue}>{formatAmount(transferDetails.amount)} ICP</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Fee:</Text>
                <Text style={styles.summaryValue}>{formatAmount(transferDetails.fee)} ICP</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatAmount(transferDetails.total)} ICP</Text>
              </View>
            </View>

            {/* Balance Information */}
            <View style={styles.balanceSection}>
              <Text style={styles.sectionTitle}>Balance Information</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Balance:</Text>
                <Text style={styles.summaryValue}>{formatAmount(transferDetails.balance)} ICP</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining After Transfer:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: transferDetails.balance - transferDetails.total >= 0 ? '#4caf50' : '#f44336' }
                ]}>
                  {formatAmount(transferDetails.balance - transferDetails.total)} ICP
                </Text>
              </View>
            </View>

            {/* Warning Section */}
            <View style={styles.warningSection}>
              <MaterialCommunityIcons name="information" size={20} color="#2196f3" />
              <Text style={styles.warningText}>
                This transfer will be executed on the Internet Computer mainnet. 
                Please ensure all details are correct before confirming.
              </Text>
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorSection}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isTransferring}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (isTransferring || transferDetails.total > transferDetails.balance) && styles.disabledButton
              ]}
              onPress={onConfirm}
              disabled={isTransferring || transferDetails.total > transferDetails.balance}
            >
              {isTransferring ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="white" />
              )}
              <Text style={styles.confirmButtonText}>
                {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Insufficient Balance Warning */}
          {transferDetails.total > transferDetails.balance && (
            <View style={styles.insufficientWarning}>
              <MaterialCommunityIcons name="alert" size={16} color="#f44336" />
              <Text style={styles.insufficientText}>
                Insufficient balance for this transfer
              </Text>
            </View>
          )}
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
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  balanceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600' as const,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#b71c1c',
  },
  warningSection: {
    flexDirection: 'row' as const,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
  errorSection: {
    flexDirection: 'row' as const,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row' as const,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmButton: {
    backgroundColor: '#b71c1c',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  insufficientWarning: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ffebee',
    padding: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  insufficientText: {
    fontSize: 12,
    color: '#d32f2f',
    marginLeft: 4,
  },
};

export default TransferConfirmationModal; 