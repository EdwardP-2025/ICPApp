import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Modal, Alert, ToastAndroid, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import PrincipalDisplay from '../components/PrincipalDisplay';
import { getIcpWalletService } from '../services/ICPWalletService';
import { useNetwork } from '../contexts/NetworkContext';

const JOIN_TIME_KEY = 'ICPApp_JoinTime';

function truncatePrincipal(principal: string) {
  if (!principal) return '';
  if (principal.length <= 16) return principal;
  return principal.slice(0, 8) + '...' + principal.slice(-6);
}

const MineScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout, setProfile, refreshBalance } = useUser();
  const { network } = useNetwork();
  const icpWalletService = getIcpWalletService(network);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nickname, setNickname] = useState(user.nickname || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [joinTime, setJoinTime] = useState<string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [icpUsd, setIcpUsd] = useState<number>(0);

  // Fetch ICP/USD price
  const fetchICPPrice = async () => {
    const price = await icpWalletService.getICPUSDPrice();
    setIcpUsd(price);
  };
  useEffect(() => { fetchICPPrice(); }, []);

  React.useEffect(() => {
    const fetchJoinTime = async () => {
      if (user.loggedIn) {
        let stored = await AsyncStorage.getItem(JOIN_TIME_KEY);
        if (!stored) {
          const now = new Date().toISOString();
          await AsyncStorage.setItem(JOIN_TIME_KEY, now);
          setJoinTime(now);
        } else {
          setJoinTime(stored);
        }
      } else {
        setJoinTime(null);
      }
    };
    fetchJoinTime();
  }, [user.loggedIn]);

  const handleEditProfile = () => {
    setNickname(user.nickname || '');
    setAvatar(user.avatar);
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    setProfile(nickname, avatar);
    setEditModalVisible(false);
  };

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
      includeBase64: true,
    });
    // Fix: 'canceled' does not exist on type 'ImagePickerResponse'.
    // Use 'didCancel' instead, and ensure uri is defined before setting avatar.
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri ?? null;
      setAvatar(uri);
    }
  };

  const handleRefreshBalance = async () => {
    if (isRefreshingBalance) return;
    
    setIsRefreshingBalance(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshingBalance(false);
    }
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.centerContent}>
          <TouchableOpacity style={styles.loginBtn} onPress={() => Linking.openURL('https://icp-ii-callback-qkzn.vercel.app')}>
            <Text style={styles.loginBtnText}>Login with Internet Identity</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
        <View style={styles.introBox}>
          <Text style={styles.introText}>Project Introduction{"\n"}and Help Button (Jump)</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon={() => <MaterialCommunityIcons name="fullscreen" color="#b71c1c" size={28} />} size={28} onPress={() => {}} style={{ marginRight: 8 }} />
        <View style={styles.spacer} />
        <IconButton icon={() => <MaterialCommunityIcons name="cog-off" color="#b71c1c" size={28} />} size={28} onPress={logout} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity style={styles.avatarContainerModern} onPress={handlePickAvatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImageModern} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={72} color="#b71c1c" />
            )}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.nickname}>{user.nickname || 'Nickname'}</Text>
            <TouchableOpacity onPress={handleEditProfile} style={{ marginLeft: 8 }}>
              <MaterialCommunityIcons name="pencil" size={20} color="#b71c1c" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.principalRow}>
          <PrincipalDisplay principal={user.principal || ''} label="Principal" />
        </View>
        <View style={styles.joinTimeRow}>
          <MaterialCommunityIcons name="calendar-month" size={14} color="#bbb" style={{ marginRight: 4 }} />
          <Text style={styles.joinTimeModern}>
            Joined {joinTime ? new Date(joinTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />

      {/* Balance Card */}
      <View style={styles.balanceCardModern}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="alpha-i-box" size={36} color="#b71c1c" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.balanceLabelModern}>ICP Balance</Text>
            <Text style={styles.balanceValueModern}>{user.balance.toFixed(4)} ICP</Text>
            <Text style={styles.fiatValueModern}>${(user.balance * icpUsd).toFixed(2)} USD</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleRefreshBalance}>
          <MaterialCommunityIcons name={isRefreshingBalance ? "loading" : "refresh"} size={28} color="#b71c1c" />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Wallet')}>
          <MaterialCommunityIcons name="wallet" size={28} color="#b71c1c" />
          <Text style={styles.quickActionText}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={28} color="#b71c1c" />
          <Text style={styles.quickActionText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity style={styles.avatarEditContainer} onPress={handlePickAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={72} color="#b71c1c" />
              )}
              <Text style={styles.avatarEditText}>Change Avatar</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter nickname"
              maxLength={24}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={[styles.modalBtn, { backgroundColor: '#b71c1c' }] }>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    marginVertical: 32,
  },
  loginBtn: {
    minWidth: 240,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#b71c1c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  loginBtnText: {
    color: '#b71c1c',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  introBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  introText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  // Logged in UI styles
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 14,
    color: '#666',
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  principalLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  principalValue: {
    fontSize: 12,
    color: '#444',
    marginBottom: 4,
  },
  joinTime: {
    fontSize: 14,
    color: '#666',
  },
  walletSection: {
    marginBottom: 24,
  },
  balanceContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataSection: {
    gap: 16,
  },
  dataBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 20,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataLabel: {
    fontSize: 16,
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEditText: {
    fontSize: 14,
    color: '#b71c1c',
    marginTop: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginLeft: 8,
  },
  modalBtnText: {
    fontSize: 16,
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 8,
    alignItems: 'center',
  },
  balanceCardModern: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  balanceLabelModern: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  balanceValueModern: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  fiatValueModern: {
    fontSize: 15,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    width: '100%',
  },
  principalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  principalTextModern: {
    color: '#888',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    marginRight: 4,
  },
  joinTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    width: '100%',
    gap: 2,
  },
  joinTimeModern: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'right',
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  avatarContainerModern: {
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: '#fff',
    padding: 4,
  },
  avatarImageModern: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
});

export default MineScreen; 