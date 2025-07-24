import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { Card, Button, useTheme, IconButton } from 'react-native-paper';
import { useState } from 'react';

const MOCK_FAVORITES = Array(6).fill(null);
const MOCK_DAPPS = Array(8).fill(null).map((_, idx) => ({ id: idx, url: 'www.baidu.com', name: `DApp${idx + 1}` }));

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, refreshBalance } = useUser();
  const theme = useTheme();
  const [showBalance, setShowBalance] = useState(true);
  
  // Calculate dynamic ICP data based on user balance
  const getICPDynamicData = () => {
    if (!user.loggedIn || user.balance === 0) {
      return {
        change: '+0.00%',
        details: [
          { id: 1, value: '+0.00', amount: '0.0000' },
          { id: 2, value: '+0.00', amount: '0.0000' },
          { id: 3, value: '+0.00', amount: '0.0000' },
        ],
      };
    }

    // Generate realistic-looking data based on current balance
    const baseBalance = user.balance;
    const changePercent = ((Math.random() * 2 - 1) * 0.5).toFixed(2); // Random change between -0.5% and +0.5%
    const isPositive = Math.random() > 0.5;
    const change = isPositive ? `+${changePercent}%` : `${changePercent}%`;

    // Generate transaction-like details
    const details = [
      {
        id: 1,
        value: isPositive ? `+${(Math.random() * 0.5).toFixed(2)}` : `-${(Math.random() * 0.5).toFixed(2)}`,
        amount: (baseBalance * (1 + Math.random() * 0.1)).toFixed(4),
      },
      {
        id: 2,
        value: isPositive ? `+${(Math.random() * 0.3).toFixed(2)}` : `-${(Math.random() * 0.3).toFixed(2)}`,
        amount: (baseBalance * (0.1 + Math.random() * 0.05)).toFixed(4),
      },
      {
        id: 3,
        value: isPositive ? `+${(Math.random() * 0.4).toFixed(2)}` : `-${(Math.random() * 0.4).toFixed(2)}`,
        amount: (baseBalance * (0.8 + Math.random() * 0.2)).toFixed(4),
      },
    ];

    return { change, details };
  };

  const icpData = getICPDynamicData();
  
  const goToDappWebView = (url: string) => {
    if (
      navigation &&
      navigation.getState &&
      navigation.getState().routeNames &&
      navigation.getState().routeNames.includes('DappWebView')
    ) {
      navigation.navigate('DappWebView', { url });
    } else {
      if (navigation && navigation.navigate) {
        navigation.navigate('Home', { screen: 'DappWebView', params: { url } });
      }
    }
  };

  const handleVerifyAccount = () => {
    if (!user.loggedIn) {
      // Navigate to Internet Identity Login
      if (navigation && navigation.navigate) {
        navigation.navigate('InternetIdentityLogin');
      }
    } else {
      // User is already verified, show info
      Alert.alert(
        'Account Verified',
        'Your account has been verified by Internet Identity.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Welcome message
  const displayName = user.nickname || (user.principal ? user.principal.substring(0, 8) + '...' : 'User');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ marginTop: 24, marginBottom: 18, alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center' }}>
          👋 Welcome, {displayName}!
        </Text>
      </View>
      {/* Wallet Balance Card */}
      <Card style={{ marginBottom: 28, backgroundColor: theme.colors.surface, borderRadius: 22, elevation: 5, shadowColor: theme.colors.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, paddingBottom: 8 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialCommunityIcons name="wallet" color={theme.colors.primary} size={28} />
            <Text style={{ fontSize: 20, fontWeight: '600', marginLeft: 10, color: theme.colors.primary }}>Wallet Balance</Text>
            <IconButton
              icon="eye"
              size={22}
              style={{ marginLeft: 'auto', marginRight: 0, marginTop: -8 }}
              onPress={() => setShowBalance(v => !v)}
              accessibilityLabel={showBalance ? 'Hide balance' : 'Show balance'}
              rippleColor={theme.colors.primary + '22'}
            />
            <IconButton
              icon="refresh"
              size={22}
              style={{ marginTop: -8 }}
              onPress={handleRefreshBalance}
              accessibilityLabel="Refresh balance"
              rippleColor={theme.colors.primary + '22'}
            />
          </View>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: theme.colors.onSurface, letterSpacing: 1, marginTop: 2, marginBottom: 6 }}>
            {showBalance ? (user.loggedIn ? `${user.balance.toFixed(4)} ICP` : '0.0000 ICP') : '••••••••'}
          </Text>
        </Card.Content>
      </Card>
      {/* Shortcuts Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
        {[{
          icon: 'apps',
          label: 'App Store',
          desc: 'Explore dapps',
          onPress: () => navigation.navigate('Market')
        }, {
          icon: 'account',
          label: 'Profile',
          desc: 'Manage your profile',
          onPress: () => navigation.navigate('Mine')
        }].map((item, idx) => (
          <Card
            key={item.label}
            style={{ flex: 1, marginRight: idx === 0 ? 10 : 0, marginLeft: idx === 1 ? 10 : 0, borderRadius: 16, elevation: 3, shadowColor: theme.colors.primary, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
            onPress={item.onPress}
          >
            <Card.Content style={{ alignItems: 'center', paddingVertical: 22 }}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={theme.colors.primary} />
              <Text style={{ marginTop: 10, fontWeight: '600', color: theme.colors.primary, fontSize: 16 }}>{item.label}</Text>
              <Text style={{ marginTop: 4, color: theme.colors.onSurface, fontSize: 12, opacity: 0.7 }}>{item.desc}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 24,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  verifyBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verifiedBox: {
    backgroundColor: '#f0f8f0',
    borderColor: '#4CAF50',
  },
  verifyContent: {
    alignItems: 'center',
  },
  verifyText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
  verifySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  principalText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  icpCardRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  icpCard: {
    flex: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icpChange: {
    fontSize: 14,
    color: '#b71c1c',
    marginLeft: 4,
  },
  icpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  icpDetails: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icpDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icpDetailText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
  },
  icpDetailAmount: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  favoriteBox: {
    width: 48,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dappBox: {
    width: 64,
    height: 64,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dappLabel: {
    fontSize: 12,
    color: '#b71c1c',
    marginTop: 4,
  },
});

export default HomeScreen; 