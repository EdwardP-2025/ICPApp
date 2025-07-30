import { Identity, AnonymousIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';

export interface InternetIdentityProfile {
  principal: string;
  nickname: string;
  avatar: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  lastLoginDate: string;
  loginCount: number;
  sessionId?: string;
}

export interface InternetIdentityResult {
  success: boolean;
  profile?: InternetIdentityProfile;
  error?: string;
  pending?: boolean;
}

export interface LoginOptions {
  useBiometric?: boolean;
  rememberDevice?: boolean;
}

class InternetIdentityService {
  private currentIdentity: Identity | null = null;
  private currentProfile: InternetIdentityProfile | null = null;
  private readonly STORAGE_KEY = 'ICPApp_InternetIdentity';
  private readonly DEVICE_ID_KEY = 'ICPApp_DeviceId';
  private readonly II_URL = 'https://identity.ic0.app';
  private readonly APP_SCHEME = 'icpapp://';
  private pendingSessions: Map<string, { timestamp: number; principal?: string }> = new Map();
  private onAuthenticationComplete?: (profile: InternetIdentityProfile) => void;

  constructor() {
    this.initializeDeviceId();
    this.setupDeepLinkHandler();
    this.cleanupOldSessions();
  }

  // Set callback for when authentication completes
  setAuthenticationCallback(callback: (profile: InternetIdentityProfile) => void) {
    this.onAuthenticationComplete = callback;
  }

  private async initializeDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      }
    } catch (error) {
      console.log('Failed to initialize device ID:', error);
    }
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupDeepLinkHandler(): void {
    let isProcessing = false; // Prevent multiple simultaneous calls
    
    const handleDeepLink = async (event: { url: string }) => {
      if (isProcessing) {
        console.log('⏳ Deep link already being processed, skipping...');
        return;
      }
      
      console.log('🔗 Deep link received:', event.url);
      
      if (event.url.startsWith(this.APP_SCHEME)) {
        isProcessing = true;
        
        try {
          const result = await this.handleInternetIdentityCallback(event.url);
          
          if (result && result.success && result.profile) {
            console.log('✅ Deep link authentication successful:', result.profile.principal);
            
            // Automatically complete the login with the received principal
            await this.completeRealAuthentication(result.profile.principal);
            
            console.log('🎉 Login completed with principal:', result.profile.principal);
            
            // Don't show alert - let the app navigate to home screen automatically
            // The UserContext will handle the login state change
            
          } else if (result && !result.success) {
            console.log('❌ Deep link authentication failed:', result.error);
            
            // Only show error alert if it's a real error, not just processing
            if (result.error && !result.error.includes('Invalid principal')) {
              Alert.alert(
                '❌ Authentication Failed',
                `Error: ${result.error}\nPlease try again.`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.log('❌ Deep link processing error:', error);
        } finally {
          isProcessing = false;
        }
      }
    };

    // Set up the deep link listener
    Linking.addEventListener('url', handleDeepLink);
    
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial deep link URL:', url);
        handleDeepLink({ url });
      }
    });
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, session] of this.pendingSessions.entries()) {
      if (now - session.timestamp > maxAge) {
        this.pendingSessions.delete(sessionId);
      }
    }
  }

  private async handleInternetIdentityCallback(url: string): Promise<InternetIdentityResult | null> {
    try {
      console.log('📱 Full URL:', url);
      
      // Parse URL manually since URLSearchParams might not be available
      const parseUrlParams = (url: string): Record<string, string> => {
        const params: Record<string, string> = {};
        
        // Extract query string from URL
        const queryIndex = url.indexOf('?');
        if (queryIndex === -1) return params;
        
        const queryString = url.substring(queryIndex + 1);
        const pairs = queryString.split('&');
        
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
        
        return params;
      };
      
      // Check if this is a login callback from Internet Identity
      if (url.includes('icpapp://login')) {
        console.log('🔗 Processing Internet Identity login callback');
        
        const params = parseUrlParams(url);
        const principal = params.principal;
        const error = params.error;
        
        console.log('📋 Parsed params:', { principal, error });
        
        if (error) {
          console.log('❌ Internet Identity returned error:', error);
          return {
            success: false,
            error: `Internet Identity error: ${error}`
          };
        }
        
        if (principal && this.isValidPrincipal(principal)) {
          console.log('✅ Valid principal received from Internet Identity:', principal);
          
          // Create profile from real principal
          const profile: InternetIdentityProfile = {
            principal: principal,
            nickname: `User-${principal.substring(0, 8)}`,
            avatar: null,
            deviceId: await this.getDeviceId(),
            isAuthenticated: true,
            lastLoginDate: new Date().toISOString(),
            loginCount: 1,
            sessionId: Math.random().toString(36).substring(2, 15)
          };
          
          // Save the real profile
          this.saveProfile(profile);
          
          return {
            success: true,
            profile: profile
          };
        } else {
          console.log('❌ Invalid or missing principal from Internet Identity');
          return {
            success: false,
            error: 'Invalid principal received from Internet Identity'
          };
        }
      }
      
      // Legacy auth callback handling (fallback)
      if (url.includes('icpapp://auth')) {
        console.log('🔗 Processing legacy auth callback');
        
        const params = parseUrlParams(url);
        const session = params.session;
        const principal = params.principal;
        const error = params.error;
        
        console.log('📋 Parsed legacy params:', { session, principal, error });
        
        if (error) {
          console.log('❌ Legacy callback returned error:', error);
          return {
            success: false,
            error: `Authentication error: ${error}`
          };
        }
        
        if (principal && this.isValidPrincipal(principal)) {
          console.log('✅ Valid principal received from legacy callback:', principal);
          
          // Create profile from real principal
          const profile: InternetIdentityProfile = {
            principal: principal,
            nickname: `User-${principal.substring(0, 8)}`,
            avatar: null,
            deviceId: await this.getDeviceId(),
            isAuthenticated: true,
            lastLoginDate: new Date().toISOString(),
            loginCount: 1,
            sessionId: session || Math.random().toString(36).substring(2, 15)
          };
          
          // Save the real profile
          this.saveProfile(profile);
          
          return {
            success: true,
            profile: profile
          };
        } else {
          console.log('❌ Invalid or missing principal from legacy callback');
          return {
            success: false,
            error: 'Invalid principal received from authentication'
          };
        }
      }
      
      console.log('❌ Unknown callback URL format:', url);
      return null;
      
    } catch (error) {
      console.log('❌ Failed to handle Internet Identity callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse callback'
      };
    }
  }

  private isValidPrincipal(principal: string): boolean {
    if (!principal || typeof principal !== 'string') {
      console.log('❌ Principal validation failed: invalid input');
      return false;
    }
    
    // Real Internet Identity principals have 11 segments separated by hyphens
    // Format: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
    // Note: The last segment can be shorter than 5 characters
    const segments = principal.split('-');
    
    console.log('🔍 Principal validation:', {
      principal: principal.substring(0, 20) + '...',
      segments: segments.length,
      segmentLengths: segments.map(s => s.length)
    });
    
    // Check if it has 11 segments and most segments are 5 characters
    if (segments.length === 11) {
      // First 10 segments should be 5 characters, last segment can be shorter
      const first10Valid = segments.slice(0, 10).every(segment => segment.length === 5);
      const lastSegmentValid = segments[10].length >= 1 && segments[10].length <= 5;
      
      console.log('🔍 11-segment validation:', {
        first10Valid,
        lastSegmentValid,
        lastSegmentLength: segments[10].length,
        isValid: first10Valid && lastSegmentValid
      });
      
      if (first10Valid && lastSegmentValid) {
        console.log('✅ Principal validation successful');
        return true;
      }
    }
    
    // Also accept test principals with 4 segments for development
    if (segments.length === 4 && segments.every(segment => segment.length === 5)) {
      console.log('✅ Test principal validation successful');
      return true;
    }
    
    console.log('❌ Principal validation failed: no valid format');
    return false;
  }

  private async completeRealAuthentication(principal: string): Promise<void> {
    try {
      console.log('🔑 Completing real authentication with principal:', principal);
      
      if (!this.isValidPrincipal(principal)) {
        console.log('❌ Invalid principal format:', principal);
        return;
      }
      
      // Create a real profile from the authenticated principal
      const profile: InternetIdentityProfile = {
        principal: principal,
        nickname: `User-${principal.substring(0, 8)}`,
        avatar: null,
        deviceId: await this.getDeviceId(),
        isAuthenticated: true,
        lastLoginDate: new Date().toISOString(),
        loginCount: 1,
        sessionId: Math.random().toString(36).substring(2, 15)
      };
      
      // Save the authenticated profile
      await this.saveProfile(profile);
      
      // Update current profile
      this.currentProfile = profile;
      
      console.log('✅ Real authentication completed successfully');
      console.log('📱 Profile saved:', profile);
      
      // Trigger login state change - this will automatically navigate to home screen
      // The UserContext will detect the profile change and update the login state
      this.onAuthenticationComplete?.(profile);
      
    } catch (error) {
      console.log('❌ Failed to complete real authentication:', error);
    }
  }

  async authenticate(options: LoginOptions = {}): Promise<InternetIdentityResult> {
    try {
      console.log('🚀 Starting real Internet Identity authentication...');
      
      // Use the Internet Identity callback URL for proper authentication
      const II_CALLBACK_URL = 'https://icp-ii-callback-qkzn.vercel.app';
      
      console.log('🌐 Opening Internet Identity authentication:', II_CALLBACK_URL);
      
      // Open the Internet Identity authentication
      await Linking.openURL(II_CALLBACK_URL);
      
      console.log('✅ Successfully opened Internet Identity authentication');
      
      // The Internet Identity service will handle the authentication
      // and redirect back to our app with the principal via deep link
      // Expected deep link format: icpapp://login?principal=xxxxx-xxxxx-xxxxx-xxxxx
      
      // Return pending result - actual result will come via deep link
      return {
        success: true,
        pending: true,
        profile: {
          principal: 'pending',
          nickname: 'Authenticating...',
          avatar: null,
          deviceId: await this.getDeviceId(),
          isAuthenticated: false,
          lastLoginDate: new Date().toISOString(),
          loginCount: 0,
          sessionId: Math.random().toString(36).substring(2, 15)
        }
      };
      
    } catch (error) {
      console.log('❌ Real Internet Identity authentication failed:', error);
      
      // Clean up any pending sessions on error
      this.cleanupOldSessions();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open Internet Identity',
      };
    }
  }

  async authenticateWithPrincipal(principalText: string, nickname?: string): Promise<InternetIdentityResult> {
    try {
      console.log('🔑 Authenticating with Internet Identity principal:', principalText);
      
      // Validate the principal format
      if (!this.isValidPrincipal(principalText)) {
        return {
          success: false,
          error: `Invalid principal format. Expected format: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx (11 segments, last can be shorter) or xxxxx-xxxxx-xxxxx-xxxxx (4 segments for testing)`
        };
      }
      
      const principal = Principal.fromText(principalText);
      
      // Create identity (in production, this would be a real authenticated identity)
      const identity = new AnonymousIdentity();
      
      // Generate or get device ID
      const deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY) || this.generateDeviceId();
      
      // Create user profile
      const profile: InternetIdentityProfile = {
        principal: principal.toText(),
        nickname: nickname || `User_${principal.toText().substr(0, 8)}`,
        avatar: null,
        deviceId: deviceId,
        isAuthenticated: true,
        lastLoginDate: new Date().toISOString(),
        loginCount: 1,
      };
      
      // Load existing profile if available
      const existingProfile = await this.loadProfile(principal.toText());
      if (existingProfile) {
        profile.nickname = existingProfile.nickname;
        profile.avatar = existingProfile.avatar;
        profile.loginCount = existingProfile.loginCount + 1;
      }
      
      this.currentIdentity = identity;
      this.currentProfile = profile;
      
      // Save profile
      await this.saveProfile(profile);
      
      console.log('✅ Internet Identity authentication successful:', {
        principal: profile.principal,
        nickname: profile.nickname,
        deviceId: profile.deviceId,
        loginCount: profile.loginCount
      });

      return {
        success: true,
        profile: profile
      };

    } catch (error) {
      console.log('❌ Internet Identity authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid principal format or authentication failed',
      };
    }
  }

  async getCurrentProfile(): Promise<InternetIdentityProfile | null> {
    try {
      console.log('🔍 Getting current Internet Identity profile...');
      
      // First check if we have a current profile in memory
      if (this.currentProfile && this.currentProfile.isAuthenticated) {
        console.log('✅ Found current profile in memory:', this.currentProfile.principal);
        return this.currentProfile;
      }
      
      // Try to load from storage
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const profile = JSON.parse(storedData) as InternetIdentityProfile;
        if (profile && profile.isAuthenticated) {
          console.log('✅ Found authenticated profile in storage:', profile.principal);
          this.currentProfile = profile;
          return profile;
        }
      }
      
      console.log('❌ No authenticated profile found');
      return null;
      
    } catch (error) {
      console.log('❌ Error getting current profile:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<InternetIdentityProfile>): Promise<boolean> {
    try {
      if (!this.currentProfile) {
        return false;
      }
      
      this.currentProfile = { ...this.currentProfile, ...updates };
      await this.saveProfile(this.currentProfile);
      return true;
    } catch (error) {
      console.log('Failed to update profile:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      this.currentIdentity = null;
      this.currentProfile = null;
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.log('Failed to logout:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile?.isAuthenticated || false;
  }

  async getIdentity(): Promise<Identity | null> {
    return this.currentIdentity;
  }

  async signMessage(message: string): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!this.currentIdentity) {
        return { success: false, error: 'No identity available' };
      }
      
      // For now, create a simple hash signature
      const signature = this.simpleHash(message).toString(16);
      
      return {
        success: true,
        signature: signature
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign message'
      };
    }
  }

  private async saveProfile(profile: InternetIdentityProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.log('Failed to save profile:', error);
    }
  }

  private async loadProfile(principal: string): Promise<InternetIdentityProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as InternetIdentityProfile;
        if (profile.principal === principal) {
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.log('Failed to load profile:', error);
      return null;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async getDeviceId(): Promise<string> {
    try {
      return await AsyncStorage.getItem(this.DEVICE_ID_KEY) || this.generateDeviceId();
    } catch (error) {
      return this.generateDeviceId();
    }
  }

  async isDeviceBound(): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceId();
      return Boolean(deviceId && deviceId.length > 10);
    } catch (error) {
      return false;
    }
  }

  async completeManualAuthentication(principal: string, nickname?: string): Promise<InternetIdentityResult> {
    try {
      console.log('🔧 Completing manual Internet Identity authentication with principal:', principal);
      
      if (!this.isValidPrincipal(principal)) {
        throw new Error('Invalid principal format. Expected format: xxxxx-xxxxx-xxxxx-xxxxx');
      }
      
      // Complete the authentication manually
      await this.completeRealAuthentication(principal);
      
      // Get the completed profile
      const profile = await this.getCurrentProfile();
      
      if (profile && profile.isAuthenticated) {
        console.log('✅ Manual authentication completed successfully:', profile);
        
        return {
          success: true,
          profile: profile
        };
      } else {
        throw new Error('Failed to complete manual authentication');
      }
      
    } catch (error) {
      console.log('❌ Manual authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Manual authentication failed',
      };
    }
  }
}

export const internetIdentityService = new InternetIdentityService(); 