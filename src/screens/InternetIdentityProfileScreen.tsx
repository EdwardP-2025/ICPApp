import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  TextInput,
  Switch,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { InternetIdentityProfile } from '../services/InternetIdentityService';

const InternetIdentityProfileScreen: React.FC = () => {
  const { user, getInternetIdentityProfile, updateInternetIdentityProfile, logout } = useUser();
  const [iiProfile, setIiProfile] = useState<InternetIdentityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadInternetIdentityProfile();
  }, []);

  const loadInternetIdentityProfile = async () => {
    try {
      const profile = await getInternetIdentityProfile();
      setIiProfile(profile);
      if (profile) {
        setNickname(profile.nickname);
      }
    } catch (error) {
      console.log('Failed to load Internet Identity profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    setLoading(true);
    try {
      const success = await updateInternetIdentityProfile({ nickname: nickname.trim() });
      if (success) {
        setIiProfile(prev => prev ? { ...prev, nickname: nickname.trim() } : null);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.log('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Internet Identity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              console.log('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleDeviceManagement = () => {
    Alert.alert(
      'Device Management',
      `Device ID: ${iiProfile?.deviceId || 'Unknown'}\n\nThis device is bound to your Internet Identity account.`,
      [{ text: 'OK' }]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy Settings',
      'Internet Identity privacy settings:\n\n• Profile visibility: Public\n• Data sharing: Minimal\n• Analytics: Disabled',
      [{ text: 'OK' }]
    );
  };

  if (!iiProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <MaterialCommunityIcons name="account-question" size={80} color="#666" />
          <Text style={styles.title}>No Internet Identity Profile</Text>
          <Text style={styles.subtitle}>
            Please login with Internet Identity to view your profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#b71c1c" />
          <Text style={styles.title}>Internet Identity Profile</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Principal ID</Text>
            <Text style={styles.value}>{iiProfile.principal}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Nickname</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Enter nickname"
                autoFocus
              />
            ) : (
              <Text style={styles.value}>{iiProfile.nickname}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Login Count</Text>
            <Text style={styles.value}>{iiProfile.loginCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Login</Text>
            <Text style={styles.value}>
              {new Date(iiProfile.lastLoginDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Device Bound</Text>
            <Text style={styles.value}>
              {iiProfile.deviceId ? 'Yes' : 'No'}
            </Text>
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setNickname(iiProfile.nickname);
                }}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#b71c1c" />
              <Text style={[styles.buttonText, styles.editButtonText]}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Management</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDeviceManagement}>
            <MaterialCommunityIcons name="cellphone-link" size={24} color="#666" />
            <Text style={styles.menuText}>Device Information</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacySettings}>
            <MaterialCommunityIcons name="shield-account" size={24} color="#666" />
            <Text style={styles.menuText}>Privacy Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#d32f2f" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#b71c1c',
  },
  saveButton: {
    backgroundColor: '#b71c1c',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  editButtonText: {
    color: '#b71c1c',
  },
  cancelButtonText: {
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 15,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#d32f2f',
  },
});

export default InternetIdentityProfileScreen; 