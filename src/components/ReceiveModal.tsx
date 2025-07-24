import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  principal: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ visible, onClose, principal }) => {
  const handleCopy = async () => {
    if (principal) {
      await Clipboard.setString(principal);
      if (Platform.OS === 'android') {
        // @ts-ignore
        if (global.ToastAndroid) global.ToastAndroid.show('Principal copied!', global.ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Principal copied to clipboard!');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Receive ICP</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={24} color="#b71c1c" />
            </TouchableOpacity>
          </View>
          <View style={styles.qrContainer}>
            <QRCode value={principal} size={180} backgroundColor="#fff" color="#b71c1c" />
          </View>
          <Text style={styles.label}>Your Principal</Text>
          <View style={styles.principalRow}>
            <Text style={styles.principalText} numberOfLines={1} ellipsizeMode="middle" selectable>{principal}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.iconBtn} accessibilityLabel="Copy Principal">
              <MaterialCommunityIcons name="content-copy" size={18} color="#b71c1c" />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>Share this QR code or your principal to receive ICP.</Text>
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
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
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
  qrContainer: {
    marginVertical: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
  },
  principalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
    width: '100%',
    justifyContent: 'center',
  },
  principalText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15,
    color: '#333',
    flexShrink: 1,
    marginRight: 6,
    letterSpacing: 0.2,
  },
  iconBtn: {
    marginLeft: 2,
    padding: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ReceiveModal; 