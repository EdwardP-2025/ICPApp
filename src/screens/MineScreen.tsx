import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { useState, useCallback } from 'react';
import AvatarSelector from '../components/AvatarSelector';

interface MineScreenProps {
  navigation?: any;
}

const MineScreen: React.FC<MineScreenProps> = ({ navigation }) => {
  const { user, logout, updateProfile, updatePreferences, clearSession, isSessionValid } = useUser();
  const [nickname, setNickname] = useState(user.nickname || '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Logged Out', 'You have been successfully logged out.');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    if (navigation) {
      navigation.navigate('EditProfile');
    } else {
      Alert.prompt(
        'Edit Nickname',
        'Enter your new nickname:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: (newNickname) => {
              if (newNickname && newNickname.trim()) {
                updateProfile({ nickname: newNickname.trim() });
                setNickname(newNickname.trim());
                Alert.alert('Success', 'Nickname updated successfully!');
              }
            }
          }
        ],
        'plain-text',
        nickname
      );
    }
  }, [navigation, nickname, updateProfile]);

  const handleAvatarSelected = useCallback((avatarUri: string) => {
    const newAvatar = avatarUri || null;
    setAvatar(newAvatar);
    updateProfile({ avatar: newAvatar });
  }, [updateProfile]);

  const handleChangeAvatar = useCallback(() => {
    setShowAvatarSelector(true);
  }, []);

  const handleSecuritySettings = useCallback(() => {
    Alert.alert(
      'Security Settings',
      'Security settings will be implemented soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleNotifications = useCallback(() => {
    const currentNotifications = user.preferences?.notifications ?? true;
    Alert.alert(
      'Notifications',
      `Notifications are currently ${currentNotifications ? 'enabled' : 'disabled'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: currentNotifications ? 'Disable' : 'Enable',
          onPress: () => {
            updatePreferences({ notifications: !currentNotifications });
            Alert.alert(
              'Updated',
              `Notifications ${!currentNotifications ? 'enabled' : 'disabled'} successfully!`
            );
      }
        }
      ]
    );
  }, [user.preferences?.notifications, updatePreferences]);

  const handlePrivacy = useCallback(() => {
    Alert.alert(
      'Privacy Settings',
      'Privacy settings will be implemented soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleHelp = useCallback(() => {
    Alert.alert(
      'Help & Support',
      'Help and support will be implemented soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'About ICP App',
      'Version 1.0.0\n\nInternet Computer Portal\nA secure wallet for the Internet Computer.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleClearSession = useCallback(() => {
    Alert.alert(
      'Clear Session',
      'This will clear all stored data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              Alert.alert('Session Cleared', 'All stored data has been cleared.');
    } catch (error) {
              Alert.alert('Error', 'Failed to clear session. Please try again.');
    }
          }
        }
      ]
    );
  }, [clearSession]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#b71c1c" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={40} color="#fff" />
            </View>
          )}
          <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
            <MaterialCommunityIcons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{user.nickname || 'User'}</Text>
          <Text style={styles.principal}>{user.principal || 'No principal'}</Text>
          {user.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
          {user.location && (
            <Text style={styles.location}>{user.location}</Text>
          )}
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <MaterialCommunityIcons name="pencil" size={16} color="#b71c1c" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Session Info */}
      <View style={styles.sessionContainer}>
        <Text style={styles.sectionTitle}>Session Information</Text>
        <View style={styles.sessionItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#666" />
          <Text style={styles.sessionLabel}>Joined:</Text>
          <Text style={styles.sessionValue}>{formatDate(user.joinDate)}</Text>
        </View>
        <View style={styles.sessionItem}>
          <MaterialCommunityIcons name="clock" size={16} color="#666" />
          <Text style={styles.sessionLabel}>Last Login:</Text>
          <Text style={styles.sessionValue}>{formatDate(user.lastLoginDate)}</Text>
        </View>
        <View style={styles.sessionItem}>
          <MaterialCommunityIcons name="login" size={16} color="#666" />
          <Text style={styles.sessionLabel}>Login Count:</Text>
          <Text style={styles.sessionValue}>{user.loginCount || 0}</Text>
        </View>
        <View style={styles.sessionItem}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#666" />
          <Text style={styles.sessionLabel}>Session Valid:</Text>
          <Text style={[styles.sessionValue, { color: isSessionValid() ? '#4CAF50' : '#F44336' }]}>
            {isSessionValid() ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {/* Profile Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.balance.toFixed(4)}</Text>
          <Text style={styles.statLabel}>ICP Balance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.deviceBound ? 'Yes' : 'No'}</Text>
          <Text style={styles.statLabel}>Device Bound</Text>
          </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.recoveryPhrase ? 'Set' : 'Not Set'}</Text>
          <Text style={styles.statLabel}>Recovery Phrase</Text>
        </View>
      </View>

      {/* Settings Menu */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
                            <TouchableOpacity style={styles.menuItem} onPress={handleSecuritySettings}>
                      <View style={styles.menuItemLeft}>
                        <MaterialCommunityIcons name="cog" size={24} color="#b71c1c" />
                        <Text style={styles.menuItemText}>Security</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="bell" size={24} color="#b71c1c" />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={[styles.menuItemStatus, { color: user.preferences?.notifications ? '#4CAF50' : '#F44336' }]}>
              {user.preferences?.notifications ? 'On' : 'Off'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="lock" size={24} color="#b71c1c" />
            <Text style={styles.menuItemText}>Privacy</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="help-circle" size={24} color="#b71c1c" />
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="information" size={24} color="#b71c1c" />
            <Text style={styles.menuItemText}>About</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.clearSessionButton} onPress={handleClearSession}>
          <MaterialCommunityIcons name="delete" size={20} color="#FF9800" />
          <Text style={styles.clearSessionText}>Clear Session Data</Text>
            </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <AvatarSelector
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onAvatarSelected={handleAvatarSelected}
        currentAvatar={user.avatar}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#b71c1c',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#b71c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#b71c1c',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  principal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  editProfileText: {
    fontSize: 14,
    color: '#b71c1c',
    fontWeight: '600',
  },
  sessionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sessionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  sessionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  settingsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItemStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  clearSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
    gap: 8,
  },
  clearSessionText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MineScreen; 
