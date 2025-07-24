import 'react-native-get-random-values';
import { Buffer } from 'buffer';
declare const global: any;
global.Buffer = Buffer;

import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserProvider, useUser } from './src/contexts/UserContext';
import * as Linking from 'expo-linking';
import HomeScreen from './src/screens/HomeScreen';
import MarketScreen from './src/screens/MarketScreen';
import MineScreen from './src/screens/MineScreen';
import WalletScreen from './src/screens/WalletScreen';
import DappWebViewScreen from './src/screens/DappWebViewScreen';
import InternetIdentityLoginScreen from './src/screens/InternetIdentityLoginScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import TransferScreen from './src/screens/TransferScreen';
import MiniAppsScreen from './src/screens/MiniAppsScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NetworkProvider } from './src/contexts/NetworkContext';
import AppDetailScreen from './src/screens/AppDetailScreen';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#b71c1c',
    onPrimary: '#fff',
    secondary: '#4CAF50',
    onSecondary: '#fff',
    background: '#fff',
    surface: '#fff',
    onSurface: '#222',
    error: '#b71c1c',
    outline: '#b71c1c',
    // Add more overrides as needed
  },
};

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MineStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="DappWebView" component={DappWebViewScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="InternetIdentityLogin" component={InternetIdentityLoginScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function MineStackScreen() {
  return (
    <MineStack.Navigator>
      <MineStack.Screen name="MineMain" component={MineScreen} options={{ headerShown: false }} />
      <MineStack.Screen name="InternetIdentityLogin" component={InternetIdentityLoginScreen} options={{ headerShown: false }} />
      <MineStack.Screen name="Permissions" component={PermissionsScreen} options={{ headerShown: false }} />
    </MineStack.Navigator>
  );
}

function WalletStackScreen() {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} options={{ headerShown: false }} />
      <WalletStack.Screen name="Transfer" component={TransferScreen} options={{ headerShown: false }} />
      <WalletStack.Screen name="MiniApps" component={MiniAppsScreen} options={{ title: 'Mini Apps' }} />
    </WalletStack.Navigator>
  );
}

function MarketStackScreen() {
  return (
    <MarketStack.Navigator>
      <MarketStack.Screen name="MarketMain" component={MarketScreen} options={{ headerShown: false }} />
      <MarketStack.Screen name="AppDetail" component={AppDetailScreen} options={{ title: 'App Detail' }} />
    </MarketStack.Navigator>
  );
}

// Deep link handler component
function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const navigationRef = useNavigationContainerRef();
  const { login, user } = useUser();

  // Monitor user state changes and navigate when logged in
  useEffect(() => {
    if (user.loggedIn && navigationRef.isReady()) {
      navigationRef.navigate('Mine' as never);
    }
  }, [user.loggedIn, navigationRef]);

  useEffect(() => {
    let handled = false;
    const handleDeepLink = (event: { url: string }) => {
      if (handled) return;
      const parsed = Linking.parse(event.url);
      
      if (parsed.scheme === 'icpapp' && parsed.hostname === 'login' && parsed.queryParams?.principal) {
        const principal = parsed.queryParams.principal as string;
        
        // Update user state immediately
        login(principal);
        handled = true;
        
        // Force navigation after a short delay
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('Mine' as never);
          }
        }, 500);
        
      } else if (parsed.scheme === 'icpapp' && parsed.hostname === 'login' && parsed.queryParams?.error) {
        const error = parsed.queryParams.error as string;
        // Handle login error - could show an alert or navigate to error screen
        handled = true;
        
      } else if (parsed.scheme === 'icpapp' && parsed.hostname === 'logout') {
        // App state is already cleared in UserContext.logout()
        // Just navigate to Mine tab to show login screen
        if (navigationRef.isReady()) {
          navigationRef.navigate('Mine' as never);
        }
        handled = true;
      }
    };
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a link
    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    
    return () => subscription.remove();
  }, [login, navigationRef, user]);

  return (
    <NavigationContainer ref={navigationRef}>{children}</NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NetworkProvider>
        <UserProvider>
          <DeepLinkHandler>
            <Tab.Navigator>
              <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                options={{
                  tabBarLabel: 'Home',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="home" color={color} size={size} />
                  ),
                  headerShown: false,
                }}
              />
              <Tab.Screen
                name="Market"
                component={MarketStackScreen}
                options={{
                  tabBarLabel: 'Market',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="circle-slice-8" color={color} size={size} />
                  ),
                  headerShown: false,
                }}
              />
              <Tab.Screen
                name="Wallet"
                component={WalletStackScreen}
                options={{
                  tabBarLabel: 'Wallet',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="wallet" color={color} size={size} />
                  ),
                  headerShown: false,
                }}
              />
              <Tab.Screen
                name="Mine"
                component={MineStackScreen}
                options={{
                  tabBarLabel: 'Mine',
                  tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="account" color={color} size={size} />
                  ),
                  headerShown: false,
                }}
              />
            </Tab.Navigator>
          </DeepLinkHandler>
        </UserProvider>
      </NetworkProvider>
    </PaperProvider>
  );
}
