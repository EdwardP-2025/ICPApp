import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: string;
  granted: boolean;
  required: boolean;
}

const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'camera',
      name: 'Camera',
      description: 'Access camera for QR code scanning and photo capture',
      icon: 'camera',
      granted: false,
      required: false,
    },
    {
      id: 'storage',
      name: 'Storage',
      description: 'Access device storage for saving wallet data and backups',
      icon: 'folder',
      granted: false,
      required: true,
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Access location for nearby dApp discovery',
      icon: 'map-marker',
      granted: false,
      required: false,
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Send push notifications for transactions and updates',
      icon: 'bell',
      granted: false,
      required: false,
    },
    {
      id: 'biometrics',
      name: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition for app security',
      icon: 'fingerprint',
      granted: false,
      required: false,
    },
    {
      id: 'network',
      name: 'Network Access',
      description: 'Connect to Internet Computer network and dApps',
      icon: 'wifi',
      granted: true,
      required: true,
    },
  ]);

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = async () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      granted: p.id === 'network' || p.id === 'storage',
    })));
  };

  const handlePermissionToggle = async (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return;

    if (permission.required && permission.granted) {
      Alert.alert('Cannot Revoke', 'This permission is required for the app to function.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, granted: !p.granted } : p
      ));

      const action = permission.granted ? 'revoked' : 'granted';
      Alert.alert('Success', `${permission.name} permission ${action}.`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${permission.granted ? 'revoke' : 'grant'} ${permission.name} permission.`);
    }
  };

  const handleGrantAll = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPermissions(prev => prev.map(p => ({ ...p, granted: true })));
      Alert.alert('Success', 'All permissions granted.');
    } catch (error) {
      Alert.alert('Error', 'Failed to grant all permissions.');
    }
  };

  const handleRevokeAll = async () => {
    const revokablePermissions = permissions.filter(p => p.granted && !p.required);
    
    if (revokablePermissions.length === 0) {
      Alert.alert('No Permissions', 'No permissions can be revoked.');
      return;
    }

    Alert.alert(
      'Revoke All Permissions',
      'Are you sure you want to revoke all non-required permissions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              setPermissions(prev => prev.map(p => ({ ...p, granted: p.required })));
              Alert.alert('Success', 'All non-required permissions revoked.');
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke permissions.');
            }
          }
        }
      ]
    );
  };

  const getPermissionIcon = (permission: Permission) => {
    const iconColor = permission.granted ? '#4CAF50' : '#FF9800';
    return (
      <MaterialCommunityIcons 
        name={permission.icon as any} 
        size={24} 
        color={iconColor} 
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#b71c1c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Permissions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Permission Summary</Text>
          <Text style={styles.summaryText}>
            {permissions.filter(p => p.granted).length} of {permissions.length} permissions granted
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGrantAll}>
            <Text style={styles.actionButtonText}>Grant All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleRevokeAll}>
            <Text style={styles.actionButtonText}>Revoke All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.permissionsList}>
          {permissions.map(permission => (
            <View key={permission.id} style={styles.permissionItem}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIcon}>
                  {getPermissionIcon(permission)}
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                  {permission.required && (
                    <Text style={styles.requiredBadge}>Required</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    permission.granted ? styles.toggleButtonGranted : styles.toggleButtonDenied,
                    permission.required && permission.granted && styles.toggleButtonDisabled
                  ]}
                  onPress={() => handlePermissionToggle(permission.id)}
                  disabled={permission.required && permission.granted}
                >
                  <Text style={styles.toggleButtonText}>
                    {permission.granted ? 'Granted' : 'Denied'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About Permissions</Text>
          <Text style={styles.infoText}>
            • Required permissions cannot be revoked as they are essential for app functionality{'\n'}
            • You can grant or revoke optional permissions at any time{'\n'}
            • Some features may not work if permissions are denied
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionsList: {
    gap: 12,
    marginBottom: 20,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIcon: {
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleButtonGranted: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonDenied: {
    backgroundColor: '#FF9800',
  },
  toggleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default PermissionsScreen; 
