import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Image,
  Switch,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { useState, useCallback, useEffect } from 'react';
import AvatarSelector from '../components/AvatarSelector';

interface EditProfileScreenProps {
  navigation: any;
  onSave?: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation, onSave }) => {
  const { user, updateProfile, updatePreferences } = useUser();
  
  const [nickname, setNickname] = useState(user.nickname || '');
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  
  const [notifications, setNotifications] = useState(user.preferences?.notifications ?? true);
  const [darkMode, setDarkMode] = useState(user.preferences?.darkMode ?? false);
  const [language, setLanguage] = useState(user.preferences?.language ?? 'en');
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Expose save function to parent
  useEffect(() => {
    if (onSave) {
      onSave = handleSave;
    }
  }, [onSave]);

  useEffect(() => {
    const hasNicknameChanged = nickname !== user.nickname;
    const hasEmailChanged = email !== (user.email || '');
    const hasBioChanged = bio !== (user.bio || '');
    const hasLocationChanged = location !== (user.location || '');
    const hasAvatarChanged = avatar !== user.avatar;
    const hasNotificationsChanged = notifications !== (user.preferences?.notifications ?? true);
    const hasDarkModeChanged = darkMode !== (user.preferences?.darkMode ?? false);
    const hasLanguageChanged = language !== (user.preferences?.language ?? 'en');

    setHasChanges(
      hasNicknameChanged ||
      hasEmailChanged ||
      hasBioChanged ||
      hasLocationChanged ||
      hasAvatarChanged ||
      hasNotificationsChanged ||
      hasDarkModeChanged ||
      hasLanguageChanged
    );
  }, [nickname, email, bio, location, avatar, notifications, darkMode, language, user]);

  const handleAvatarSelected = useCallback((avatarUri: string | null) => {
    setAvatar(avatarUri);
  }, []);

  const handleChangeAvatar = useCallback(() => {
    setShowAvatarSelector(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    setIsSaving(true);

    try {
      const profileUpdates: Partial<typeof user> = {};
      
      if (nickname !== user.nickname) {
        profileUpdates.nickname = nickname;
      }
      if (email !== (user.email || '')) {
        profileUpdates.email = email;
      }
      if (bio !== (user.bio || '')) {
        profileUpdates.bio = bio;
      }
      if (location !== (user.location || '')) {
        profileUpdates.location = location;
      }
      if (avatar !== user.avatar) {
        profileUpdates.avatar = avatar;
      }

      const preferenceUpdates: Partial<typeof user.preferences> = {};
      
      if (notifications !== (user.preferences?.notifications ?? true)) {
        preferenceUpdates.notifications = notifications;
      }
      if (darkMode !== (user.preferences?.darkMode ?? false)) {
        preferenceUpdates.darkMode = darkMode;
      }
      if (language !== (user.preferences?.language ?? 'en')) {
        preferenceUpdates.language = language;
      }

      if (Object.keys(profileUpdates).length > 0) {
        updateProfile(profileUpdates);
      }
      
      if (Object.keys(preferenceUpdates).length > 0) {
        updatePreferences(preferenceUpdates);
      }

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    hasChanges,
    nickname,
    email,
    bio,
    location,
    avatar,
    notifications,
    darkMode,
    language,
    user,
    updateProfile,
    updatePreferences,
    navigation,
  ]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return nickname.trim().length > 0 && (email === '' || validateEmail(email));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#b71c1c" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
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
          <Text style={styles.avatarLabel}>Tap to change avatar</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nickname *</Text>
            <TextInput
              style={styles.textInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter your nickname"
              placeholderTextColor="#999"
              maxLength={30}
            />
            <Text style={styles.characterCount}>{nickname.length}/30</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, email && !validateEmail(email) ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email && !validateEmail(email) && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{bio.length}/200</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor="#999"
              maxLength={50}
            />
            <Text style={styles.characterCount}>{location.length}/50</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialCommunityIcons name="bell" size={24} color="#b71c1c" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Receive push notifications for important updates
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e0e0e0', true: '#b71c1c' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialCommunityIcons name="theme-light-dark" size={24} color="#b71c1c" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Dark Mode</Text>
                <Text style={styles.preferenceDescription}>
                  Switch between light and dark themes
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e0e0e0', true: '#b71c1c' }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialCommunityIcons name="translate" size={24} color="#b71c1c" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Language</Text>
                <Text style={styles.preferenceDescription}>
                  Choose your preferred language
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => {
                Alert.alert(
                  'Language',
                  'Select your preferred language:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'English', onPress: () => setLanguage('en') },
                    { text: 'Spanish', onPress: () => setLanguage('es') },
                    { text: 'French', onPress: () => setLanguage('fr') },
                    { text: 'German', onPress: () => setLanguage('de') },
                  ]
                );
              }}
            >
              <Text style={styles.languageText}>
                {language === 'en' ? 'English' : 
                 language === 'es' ? 'Spanish' :
                 language === 'fr' ? 'French' :
                 language === 'de' ? 'German' : 'English'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="account-key" size={20} color="#666" />
            <Text style={styles.infoLabel}>Principal:</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {user.principal || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar" size={20} color="#666" />
            <Text style={styles.infoLabel}>Joined:</Text>
            <Text style={styles.infoValue}>
              {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="login" size={20} color="#666" />
            <Text style={styles.infoLabel}>Login Count:</Text>
            <Text style={styles.infoValue}>{user.loginCount || 0}</Text>
          </View>
        </View>
      </ScrollView>

      <AvatarSelector
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onAvatarSelect={handleAvatarSelected}
        currentAvatar={user.avatar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
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
  avatarLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
  },
});

export default EditProfileScreen; 