import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { getIcpWalletService } from '../services/ICPWalletService';
import { useNetwork } from '../contexts/NetworkContext';
import { useUser } from '../contexts/UserContext';
import Clipboard from '@react-native-clipboard/clipboard';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

const MOCK_FEE = 0.0001;

const TransferScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, refreshBalance, mockSend } = useUser();
  const { network } = useNetwork();
  const icpWalletService = getIcpWalletService(network);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(0.0001);
  const feeAnim = useRef(new Animated.Value(0)).current;
  const prevFee = useRef(fee);
  const [recipientError, setRecipientError] = useState('');
  const [amountError, setAmountError] = useState('');
  const useMock = true;

  useEffect(() => {
    // Fetch fee on mount
    const fetchFee = async () => {
      const realFee = await icpWalletService.getICPTransactionFee();
      setFee(realFee);
    };
    fetchFee();
  }, []);

  useEffect(() => {
    // Fetch fee every time amount changes and is valid
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    icpWalletService.getICPTransactionFee().then((realFee: number) => {
      if (realFee !== prevFee.current) {
        // Animate highlight
        feeAnim.setValue(1);
        Animated.timing(feeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }).start();
      }
      setFee(realFee);
      prevFee.current = realFee;
    });
  }, [amount]);

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    setRecipient(text);
  };

  const handleMax = () => {
    setAmount((user.balance - fee).toFixed(4));
  };

  const validate = () => {
    let recErr = '';
    let amtErr = '';
    if (!recipient) recErr = 'Recipient is required.';
    if (!amount) amtErr = 'Amount is required.';
    else if (isNaN(Number(amount)) || Number(amount) <= 0) amtErr = 'Enter a valid amount.';
    else if (Number(amount) + fee > user.balance) amtErr = 'Insufficient balance.';
    setRecipientError(recErr);
    setAmountError(amtErr);
    return recErr || amtErr;
  };

  // Placeholder: implement secure identity loading
  async function loadUserIdentity(): Promise<Ed25519KeyIdentity> {
    // TODO: Replace with secure key management
    throw new Error('loadUserIdentity not implemented. Integrate secure key storage.');
  }

  const handleTransfer = async () => {
    const validation = validate();
    if (validation) return;
    setLoading(true);
    try {
      if (!user.principal) throw new Error('User principal is missing.');
      if (useMock) {
        const result = await icpWalletService.transferICP({
          fromPrincipal: user.principal as string,
          toAddress: recipient,
          amount: Number(amount),
        });
        if (result.success) {
          mockSend(Number(amount), recipient);
          Alert.alert('Success', `Transfer complete! Tx: ${result.txId || 'N/A'}`);
          setRecipient('');
          setAmount('');
          navigation.goBack();
        } else {
          Alert.alert('Transfer Failed', result.error || 'Unknown error');
        }
      } else {
        const identity = await loadUserIdentity();
        // Convert recipient to Principal type
        const recipientPrincipal = Principal.fromText(recipient);
        const result = await icpWalletService.transferICPReal({
          fromIdentity: identity,
          toPrincipal: recipientPrincipal,
          amount: Number(amount),
        });
        // result may be a bigint or object; show generic success
        Alert.alert('Success', `Transfer complete! Result: ${result ? result.toString() : 'N/A'}`);
        setRecipient('');
        setAmount('');
        refreshBalance();
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const total = amount ? (Number(amount) + (fee || 0)).toFixed(4) : '0.0000';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#b71c1c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer ICP</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Recipient</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, recipientError ? styles.inputError : null]}
            placeholder="Principal or Account ID"
            value={recipient}
            onChangeText={text => { setRecipient(text); if (recipientError) setRecipientError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={handlePaste} style={styles.iconBtn} accessibilityLabel="Paste">
            <MaterialCommunityIcons name="content-paste" size={20} color="#b71c1c" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn} accessibilityLabel="Scan QR">
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#b71c1c" />
          </TouchableOpacity>
        </View>
        {recipientError ? (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#b71c1c" style={{ marginRight: 4 }} />
            <Text style={styles.errorText}>{recipientError}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>Amount (ICP)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, amountError ? styles.inputError : null]}
            placeholder="0.0000"
            value={amount}
            onChangeText={text => { setAmount(text); if (amountError) setAmountError(''); }}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity onPress={handleMax} style={styles.maxBtn} accessibilityLabel="Max">
            <Text style={styles.maxBtnText}>Max</Text>
          </TouchableOpacity>
        </View>
        {amountError ? (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#b71c1c" style={{ marginRight: 4 }} />
            <Text style={styles.errorText}>{amountError}</Text>
          </View>
        ) : null}
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Fee</Text>
          <Animated.Text
            style={[
              styles.feeValue,
              {
                backgroundColor: feeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#fff', '#ffe5e5'],
                }),
                borderRadius: 6,
                paddingHorizontal: 4,
              },
            ]}
          >
            {fee} ICP
          </Animated.Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Total</Text>
          <Text style={styles.feeValue}>{total} ICP</Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={handleTransfer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  card: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  iconBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(183,28,28,0.08)',
  },
  maxBtn: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#b71c1c',
  },
  maxBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  feeLabel: {
    color: '#888',
    fontSize: 14,
  },
  feeValue: {
    color: '#222',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#b71c1c',
    fontSize: 13,
    marginTop: 0,
    marginBottom: 4,
    textAlign: 'left',
  },
  sendBtn: {
    marginTop: 24,
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#b71c1c',
    backgroundColor: '#fff5f5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: -2,
    marginLeft: 2,
  },
});

export default TransferScreen;
