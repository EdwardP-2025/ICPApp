import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export interface PrincipalDisplayProps {
  principal: string;
  label?: string;
  style?: any;
  showInfo?: boolean;
  showAccountId?: boolean;
  accountId?: string;
}

function truncatePrincipal(principal: string) {
  if (!principal) return '';
  if (principal.length <= 16) return principal;
  return principal.slice(0, 8) + '...' + principal.slice(-6);
}

export const PrincipalDisplay: React.FC<PrincipalDisplayProps> = ({
  principal,
  label = 'Principal',
  style,
  showInfo = true,
  showAccountId = false,
  accountId,
}) => {
  const handleCopy = async () => {
    if (principal) {
      Clipboard.setString(principal);
      if (Platform.OS === 'android') {
        // @ts-ignore
        if (global.ToastAndroid) global.ToastAndroid.show('Principal copied!', global.ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Principal copied to clipboard!');
      }
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  };

  const handleLongPress = () => {
    if (principal) {
      Alert.alert('Full Principal', principal);
      ReactNativeHapticFeedback.trigger('impactMedium');
    }
  };

  const handleInfo = () => {
    Alert.alert(
      'What is a Principal?',
      'A Principal is your unique identity on the Internet Computer. It is used to receive ICP and interact with dapps. Keep it safe and never share your recovery phrase.'
    );
  };

  const handleCopyAccountId = async () => {
    if (accountId) {
      Clipboard.setString(accountId);
      if (Platform.OS === 'android') {
        // @ts-ignore
        if (global.ToastAndroid) global.ToastAndroid.show('Account ID copied!', global.ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Account ID copied to clipboard!');
      }
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  };

  return (
    <View style={[styles.row, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.principalRow}>
        <Text
          style={styles.principalText}
          numberOfLines={1}
          ellipsizeMode="middle"
          selectable
          onLongPress={handleLongPress}
          accessibilityLabel="Principal"
        >
          {truncatePrincipal(principal)}
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          style={styles.iconBtn}
          accessibilityLabel="Copy Principal"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="content-copy" size={20} color="#b71c1c" />
        </TouchableOpacity>
        {showInfo && (
          <TouchableOpacity onPress={handleInfo} style={styles.iconBtn} accessibilityLabel="Principal Info">
            <MaterialCommunityIcons name="information-outline" size={20} color="#b71c1c" />
          </TouchableOpacity>
        )}
      </View>
      {showAccountId && accountId ? (
        <View style={styles.accountIdRow}>
          <Text style={styles.accountIdLabel}>Account ID:</Text>
          <Text style={styles.accountIdText} numberOfLines={1} ellipsizeMode="middle" selectable>{truncatePrincipal(accountId)}</Text>
          <TouchableOpacity onPress={handleCopyAccountId} style={styles.iconBtn} accessibilityLabel="Copy Account ID">
            <MaterialCommunityIcons name="content-copy" size={18} color="#b71c1c" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
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
  accountIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  accountIdLabel: {
    fontSize: 12,
    color: '#aaa',
    marginRight: 4,
  },
  accountIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
    marginRight: 4,
  },
});

export default PrincipalDisplay; 