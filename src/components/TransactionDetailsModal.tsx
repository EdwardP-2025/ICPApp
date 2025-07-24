import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { Transaction } from '../services/ICPWalletService';

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ visible, onClose, transaction }) => {
  if (!transaction) return null;

  const handleCopyTxId = async () => {
    if (transaction.txId) {
      await Clipboard.setString(transaction.txId);
      if (Platform.OS === 'android') {
        // @ts-ignore
        if (global.ToastAndroid) global.ToastAndroid.show('Transaction ID copied!', global.ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Transaction ID copied to clipboard!');
      }
    }
  };

  const handleViewExplorer = () => {
    if (transaction.txId) {
      // Replace with actual explorer URL if available
      const url = `https://dashboard.internetcomputer.org/transaction/${transaction.txId}`;
      // Open in browser
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        // @ts-ignore
        if (global.Linking) global.Linking.openURL(url);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={24} color="#b71c1c" />
            </TouchableOpacity>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Type:</Text>
            <Text style={[styles.value, { color: transaction.type === 'send' ? '#b71c1c' : '#4CAF50' }]}>{transaction.type === 'send' ? 'Sent' : 'Received'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>{transaction.amount} {transaction.symbol}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: transaction.status === 'success' ? '#4CAF50' : '#b71c1c' }]}>{transaction.status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{transaction.date}</Text>
          </View>
          {transaction.from && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>From:</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">{transaction.from}</Text>
            </View>
          )}
          {transaction.to && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>To:</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">{transaction.to}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tx ID:</Text>
            <Text style={[styles.value, styles.txId]} numberOfLines={1} ellipsizeMode="middle">{transaction.txId}</Text>
            <TouchableOpacity onPress={handleCopyTxId} style={styles.iconBtn} accessibilityLabel="Copy TxId">
              <MaterialCommunityIcons name="content-copy" size={18} color="#b71c1c" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.explorerBtn} onPress={handleViewExplorer} disabled={!transaction.txId} accessibilityLabel="View on Explorer">
            <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.explorerBtnText}>View on Explorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(183,28,28,0.08)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
    width: 70,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#222',
    flexShrink: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  txId: {
    fontSize: 12,
    color: '#b71c1c',
    marginLeft: 2,
    flex: 1,
  },
  iconBtn: {
    marginLeft: 2,
    padding: 2,
  },
  explorerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 18,
    alignSelf: 'center',
  },
  explorerBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 2,
  },
});

export default TransactionDetailsModal; 