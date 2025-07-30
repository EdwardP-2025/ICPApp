import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
  AppState,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { internetIdentityService, InternetIdentityProfile } from '../services/InternetIdentityService';
import { useUser } from '../contexts/UserContext';

const InternetIdentityLoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [principal, setPrincipal] = useState('2vxsx-fae');
  const [nickname, setNickname] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const { login } = useUser();

  // Check for existing Internet Identity profile
  useEffect(() => {
    checkExistingProfile();
  }, []);

  // Monitor app state changes to reset authenticating state
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && authenticating) {
        console.log('📱 App became active - checking for authentication result');
        // Check if we have a profile after returning to app
        setTimeout(async () => {
          try {
            const profile = await internetIdentityService.getCurrentProfile();
            if (profile && profile.isAuthenticated && profile.principal !== 'pending') {
              console.log('✅ Found authenticated profile after app return:', profile);
              login(profile.principal);
            } else {
              console.log('⏰ No authenticated profile found - resetting state');
              setAuthenticating(false);
            }
          } catch (error) {
            console.log('❌ Error checking profile after app return:', error);
            setAuthenticating(false);
          }
        }, 1000); // Wait 1 second for deep link to process
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [authenticating, login]);

  const checkExistingProfile = async () => {
    try {
      const profile = await internetIdentityService.getCurrentProfile();
      if (profile && profile.isAuthenticated) {
        console.log('Found existing Internet Identity profile:', profile);
        // Auto-login with existing profile
        login(profile.principal);
      }
    } catch (error) {
      console.log('Failed to check existing profile:', error);
    }
  };

  const handleRealInternetIdentityLogin = async () => {
    setLoading(true);
    setAuthenticating(true);
    
    try {
      console.log('🚀 Starting real Internet Identity login...');
      
      const result = await internetIdentityService.authenticate();
      
      if (result.success) {
        console.log('✅ Internet Identity opened successfully');
        
        if (result.pending) {
          Alert.alert(
            '🌐 Internet Identity Login',
            '✅ Internet Identity opened successfully!\n\n📋 Next steps:\n1. Complete authentication on the Internet Identity site\n2. You\'ll be redirected back to the app\n3. Real principal will be captured automatically\n\n⏰ Waiting for authentication completion...',
            [{ text: 'OK' }]
          );
          
          // Reset authenticating state after showing instructions
          setAuthenticating(false);
          
        } else {
          // Don't show success alert - let the app navigate to home screen automatically
          // The UserContext will handle the login state change
          console.log('✅ Login successful, navigating to home screen...');
        }
        
      } else {
        console.log('❌ Internet Identity login failed:', result.error);
        
        Alert.alert(
          '❌ Login Failed', 
          `${result.error}\n\n🔧 Alternative options:\n• Use Manual Login with a test principal\n• Check your internet connection`,
          [
            { text: 'Manual Login', onPress: () => setAuthenticating(false) },
            { text: 'OK', onPress: () => setAuthenticating(false) }
          ]
        );
      }
      
    } catch (error) {
      console.log('❌ Internet Identity login error:', error);
      
      Alert.alert(
        '❌ Login Error', 
        'Failed to authenticate with Internet Identity.\n\n🔧 Please try:\n• Manual login with a test principal\n• Check your internet connection',
        [
          { text: 'Manual Login', onPress: () => setAuthenticating(false) },
          { text: 'OK', onPress: () => setAuthenticating(false) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async () => {
    if (!principal.trim()) {
      Alert.alert('Error', 'Please enter a valid principal ID');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Manual Internet Identity login with principal:', principal);
      
      const result = await internetIdentityService.authenticateWithPrincipal(principal.trim(), nickname.trim());
      
      if (result.success && result.profile) {
        console.log('Manual login successful:', result.profile);
        
        login(result.profile.principal, []);
        
        // Don't show alert - let the app navigate to home screen automatically
        // The UserContext will handle the login state change
        
      } else {
        console.log('Manual login failed:', result.error);
        Alert.alert('Login Failed', result.error || 'Authentication failed');
      }
      
    } catch (error) {
      console.log('Manual login error:', error);
      Alert.alert('Login Error', 'Failed to authenticate with principal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-lock" size={80} color="#b71c1c" />
          <Text style={styles.title}>Internet Identity Login</Text>
          <Text style={styles.subtitle}>
            Secure authentication for the Internet Computer
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal ID (for manual login)</Text>
            <TextInput
              style={styles.input}
              value={principal}
              onChangeText={setPrincipal}
              placeholder="Enter your Internet Identity principal"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nickname (Optional)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter a nickname for your profile"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.loginOptions}>
          <TouchableOpacity
            style={[styles.loginButton, styles.realButton]}
            onPress={handleRealInternetIdentityLogin}
            disabled={loading || authenticating}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : authenticating ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginButtonText}>Authenticating...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="web" size={24} color="#fff" />
                <Text style={styles.loginButtonText}>Login with Internet Identity</Text>
              </>
            )}
          </TouchableOpacity>

          {authenticating && (
            <TouchableOpacity
              style={[styles.loginButton, styles.resetButton]}
              onPress={() => {
                setAuthenticating(false);
                Alert.alert('Reset', 'Authentication state reset. You can try again.');
              }}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#666" />
              <Text style={[styles.loginButtonText, styles.resetButtonText]}>
                Reset State
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.loginButton, styles.manualButton]}
            onPress={handleManualLogin}
            disabled={loading || authenticating}
          >
            <MaterialCommunityIcons name="account-key" size={24} color="#b71c1c" />
            <Text style={[styles.loginButtonText, styles.manualButtonText]}>
              Manual Login
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Real Internet Identity Integration</Text>
          <Text style={styles.infoText}>
            • One-click login opens Internet Identity site{'\n'}
            • Create or sign in to your Internet Identity{'\n'}
            • Get redirected back to app with real identity{'\n'}
            • Use real authenticated principal for IC operations
          </Text>
          
          <Text style={styles.infoTitle}>Manual Login</Text>
          <Text style={styles.infoText}>
            For testing, you can use these principals:{'\n'}
            • 2vxsx-fae (anonymous){'\n'}
            • aaaaa-aa-aaa-aaaaa-aaa (test){'\n'}
            • bbbbb-bb-bbb-bbbbb-bbb (test)
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  loginOptions: {
    marginBottom: 30,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  realButton: {
    backgroundColor: '#b71c1c',
  },
  manualButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#b71c1c',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  manualButtonText: {
    color: '#b71c1c',
  },
  resetButton: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetButtonText: {
    color: '#666',
  },
  info: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
});

export default InternetIdentityLoginScreen; 
