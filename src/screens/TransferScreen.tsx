import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getSimpleIcpWalletService } from '../services/SimpleICPWalletService';
import { useNetwork } from '../contexts/NetworkContext';
import { useUser } from '../contexts/UserContext';
import Clipboard from '@react-native-clipboard/clipboard';

const TransferScreen: React.FC = () => {
  const { user, refreshBalance, transferICP } = useUser();
  const { network } = useNetwork();
  const simpleIcpWalletService = getSimpleIcpWalletService(network);
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(0.0001);
  const [recipientError, setRecipientError] = useState('');
  const [amountError, setAmountError] = useState('');
  
  const feeAnim = useRef(new Animated.Value(0)).current;
  const prevFee = useRef(fee);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const realFee = await simpleIcpWalletService.getTransactionFee();
        setFee(realFee);
      } catch (error) {
        console.log('Error fetching fee:', error);
        setFee(0.0001);
      }
    };
    fetchFee();
  }, []);

  useEffect(() => {
    if (fee !== prevFee.current) {
      feeAnim.setValue(1);
      Animated.timing(feeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start();
      prevFee.current = fee;
    }
  }, [fee]);

  useEffect(() => {
    validateRecipient(recipient);
  }, [recipient]);

  useEffect(() => {
    validateAmount(amount);
  }, [amount, fee, user.balance]);

  const validateRecipient = (value: string) => {
    if (!value.trim()) {
      setRecipientError('');
      return false;
    }
    
    if (!simpleIcpWalletService.isValidPrincipal(value.trim()) && 
        !simpleIcpWalletService.isValidAddress(value.trim())) {
      setRecipientError('Invalid principal or address format');
      return false;
    }
    
    setRecipientError('');
    return true;
  };

  const validateAmount = (value: string) => {
    if (!value.trim()) {
      setAmountError('');
      return false;
    }
    
    const numAmount = Number(value);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Enter a valid amount');
      return false;
    }
    
    if (numAmount < 0.0001) {
      setAmountError('Minimum amount is 0.0001 ICP');
      return false;
    }
    
    if (numAmount + fee > user.balance) {
      setAmountError('Insufficient balance');
      return false;
    }
    
    setAmountError('');
    return true;
  };

  const isFormValid = (): boolean => {
    return (
      recipient.trim() !== '' &&
      amount.trim() !== '' &&
      !recipientError &&
      !amountError &&
      Number(amount) > 0 &&
      Number(amount) + fee <= user.balance
    );
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setRecipient(text.trim());
      }
    } catch (error) {
      console.log('Error pasting from clipboard:', error);
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const handleMax = () => {
    const maxAmount = Math.max(0, user.balance - fee);
    setAmount(maxAmount.toFixed(4));
  };

  const shakeAnimation = () => {
    shakeAnim.setValue(10);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTransfer = async () => {
    if (!isFormValid()) {
      shakeAnimation();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transferAmount = Number(amount);
      const recipientAddress = recipient.trim();

      console.log('Initiating transfer:', {
        to: recipientAddress,
        amount: transferAmount,
        fee,
        network,
      });

      const result = await transferICP(transferAmount, recipientAddress, fee);

      if (result.success) {
        Alert.alert(
          'Transfer Successful!',
          `Transaction ID: ${result.txId}\nFee: ${fee} ICP`,
          [
            {
              text: 'OK',
              onPress: () => {
                setRecipient('');
                setAmount('');
                setError('');
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (error: any) {
      console.log('Transfer error:', error);
      setError(error.message || 'Transfer failed');
      Alert.alert('Transfer Failed', error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const numAmount = Number(amount) || 0;
  const total = (numAmount + fee).toFixed(4);
  const remainingBalance = user.balance - (numAmount + fee);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <MaterialCommunityIcons name="wallet" size={20} color="#b71c1c" />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{user.balance.toFixed(4)} ICP</Text>
            <Text style={styles.balanceUSD}>
              ${(user.balance * 10).toFixed(2)} USD
            </Text>
            <View style={styles.balanceIndicator}>
              <MaterialCommunityIcons name="trending-up" size={16} color="#4caf50" />
              <Text style={styles.balanceIndicatorText}>+2.5% today</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <MaterialCommunityIcons name="account" size={16} color="#666" />
                <Text style={styles.inputLabel}>Recipient</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    recipientError ? styles.inputError : null,
                    { flex: 1 }
                  ]}
                  placeholder="Enter ICP principal ID or account address"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={handlePaste} 
                  style={styles.iconButton}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="content-paste" size={18} color="#b71c1c" />
                </TouchableOpacity>
              </View>
              {recipientError ? (
                <Text style={styles.errorText}>{recipientError}</Text>
              ) : null}
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#666" />
                <Text style={styles.inputLabel}>Amount (ICP)</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    amountError ? styles.inputError : null,
                    { flex: 1 }
                  ]}
                  placeholder="Enter transfer amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={handleMax} 
                  style={styles.maxButton}
                  disabled={loading}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>
              {amountError ? (
                <Text style={styles.errorText}>{amountError}</Text>
              ) : null}
            </View>

            <View style={styles.feeSection}>
              <View style={styles.feeHeader}>
                <MaterialCommunityIcons name="calculator" size={16} color="#666" />
                <Text style={styles.feeHeaderText}>Transaction Summary</Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Network Fee</Text>
                <Animated.Text
                  style={[
                    styles.feeValue,
                    {
                      backgroundColor: feeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['transparent', '#ffe5e5'],
                      }),
                    },
                  ]}
                >
                  {fee.toFixed(4)} ICP
                </Animated.Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Transfer Amount</Text>
                <Text style={styles.amountValue}>{numAmount.toFixed(4)} ICP</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{total} ICP</Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Remaining</Text>
                <Text style={[
                  styles.remainingValue,
                  { color: remainingBalance < 0 ? '#b71c1c' : '#666' }
                ]}>
                  {remainingBalance.toFixed(4)} ICP
                </Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#b71c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.transferButton,
                !isFormValid() && styles.transferButtonDisabled,
                loading && styles.transferButtonDisabled
              ]}
              onPress={handleTransfer}
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#fff" />
                  <Text style={styles.transferButtonText}>Send Transfer</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.networkInfo}>
              <View style={styles.networkBadge}>
                <MaterialCommunityIcons name="server-network" size={12} color="#666" />
                <Text style={styles.networkInfoText}>
                  {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </Text>
              </View>
              <View style={styles.securityInfo}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#4caf50" />
                <Text style={styles.securityText}>Secure Transfer</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  balanceUSD: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  balanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  balanceIndicatorText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  inputError: {
    borderColor: '#b71c1c',
    backgroundColor: '#fff5f5',
  },
  iconButton: {
    padding: 12,
    marginLeft: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  maxButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#b71c1c',
    borderRadius: 10,
    marginLeft: 12,
  },
  maxButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#b71c1c',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  feeSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  feeHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  amountValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  remainingValue: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b71c1c',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#b71c1c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  transferButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  transferButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  networkInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default TransferScreen;
