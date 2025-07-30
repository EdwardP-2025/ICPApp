import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface PrincipalDisplayProps {
  principal: string;
  label?: string;
  showCopyButton?: boolean;
}

const PrincipalDisplay: React.FC<PrincipalDisplayProps> = ({
  principal,
  label = 'Principal ID',
  showCopyButton = true,
}) => {
  const handleCopy = () => {
    Alert.alert(
      'Copy to Clipboard',
      `Principal ID copied: ${principal}`,
      [{ text: 'OK' }]
    );
    
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const formatPrincipal = (principal: string) => {
    if (principal.length <= 20) return principal;
    return `${principal.substring(0, 10)}...${principal.substring(principal.length - 10)}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.principalContainer}>
        <Text style={styles.principalText}>{formatPrincipal(principal)}</Text>
        {showCopyButton && (
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <MaterialCommunityIcons name="content-copy" size={20} color="#b71c1c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  principalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  principalText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default PrincipalDisplay; 
