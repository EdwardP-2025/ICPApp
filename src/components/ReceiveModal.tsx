import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  principal: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ visible, onClose, principal }) => {
  const handleCopyAddress = () => {
    Alert.alert(
      'Copy Address',
      `Address copied: ${principal}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Receive ICP</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
          <View style={styles.qrContainer}>
              <MaterialCommunityIcons name="qrcode" size={120} color="#b71c1c" />
              <Text style={styles.qrLabel}>QR Code</Text>
          </View>

            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Your Address</Text>
              <View style={styles.addressBox}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {principal}
                </Text>
                <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton}>
                  <MaterialCommunityIcons name="content-copy" size={20} color="#b71c1c" />
            </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.note}>
              Share this address to receive ICP from other users
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  addressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ReceiveModal; 
