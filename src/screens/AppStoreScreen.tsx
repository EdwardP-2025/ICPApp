import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppInstallationService from '../services/AppInstallationService';
import MiniAppLauncher from '../components/MiniAppWebView';
import type { InstalledApp, DApp } from '../services/AppInstallationService';

interface AppStoreScreenProps {
  navigation?: any;
}

const AppStoreScreen: React.FC<AppStoreScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<DApp | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [installingApp, setInstallingApp] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);
  const [launchingApp, setLaunchingApp] = useState<InstalledApp | null>(null);

  const installationService = AppInstallationService.getInstance();

  const categories = useMemo(() => [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'finance', name: 'Finance', icon: 'currency-btc' },
    { id: 'social', name: 'Social', icon: 'account-group' },
    { id: 'gaming', name: 'Gaming', icon: 'gamepad-variant' },
    { id: 'tools', name: 'Tools', icon: 'tools' },
    { id: 'defi', name: 'DeFi', icon: 'chart-line' },
    { id: 'security', name: 'Security', icon: 'shield-check' },
    { id: 'governance', name: 'Governance', icon: 'vote' },
  ], []);

  const dApps = useMemo(() => [
    {
      id: 'dscvr',
      name: 'DSCVR',
      description: 'Decentralized social media platform',
      category: 'social',
      icon: '🌐',
      rating: 4.5,
      downloads: '10K+',
      url: 'https://dscvr.one',
      featured: true,
      tags: ['social', 'content'],
      installType: 'pwa' as const,
      version: '2.1.0',
      size: '15.2 MB',
      developer: 'DSCVR Team',
    },
    {
      id: 'openchat',
      name: 'OpenChat',
      description: 'Decentralized messaging app',
      category: 'social',
      icon: '💬',
      rating: 4.3,
      downloads: '5K+',
      url: 'https://oc.app',
      featured: true,
      tags: ['messaging', 'chat'],
      installType: 'pwa' as const,
      version: '1.8.5',
      size: '12.8 MB',
      developer: 'OpenChat Team',
    },
    {
      id: 'plug-wallet',
      name: 'Plug Wallet',
      description: 'Cryptocurrency wallet for ICP',
      category: 'finance',
      icon: '💰',
      rating: 4.7,
      downloads: '15K+',
      url: 'https://plugwallet.ooo',
      featured: true,
      tags: ['wallet', 'crypto'],
      installType: 'pwa' as const,
      version: '3.2.1',
      size: '8.5 MB',
      developer: 'Plug Team',
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Popular Ethereum wallet',
      category: 'finance',
      icon: '🦊',
      rating: 4.8,
      downloads: '50M+',
      url: 'https://metamask.io',
      featured: true,
      tags: ['wallet', 'ethereum'],
      installType: 'native' as const,
      appStoreId: Platform.OS === 'ios' ? '1438144202' : 'io.metamask',
      version: '10.0.0',
      size: '25.1 MB',
      developer: 'ConsenSys',
    },
    {
      id: 'sonic',
      name: 'Sonic',
      description: 'DeFi platform on Internet Computer',
      category: 'defi',
      icon: '📈',
      rating: 4.4,
      downloads: '12K+',
      url: 'https://sonic.ooo',
      featured: false,
      tags: ['defi', 'trading'],
      installType: 'pwa' as const,
      version: '1.5.2',
      size: '18.3 MB',
      developer: 'Sonic Team',
    },
    {
      id: 'nns',
      name: 'NNS',
      description: 'Network Nervous System governance',
      category: 'governance',
      icon: '🏛️',
      rating: 4.6,
      downloads: '8K+',
      url: 'https://nns.ic0.app',
      featured: false,
      tags: ['governance', 'voting'],
      installType: 'canister' as const,
      canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
      version: '1.0.0',
      size: '5.2 MB',
      developer: 'DFINITY Foundation',
    },
    {
      id: 'internet-identity',
      name: 'Internet Identity',
      description: 'Secure authentication service',
      category: 'security',
      icon: '🔐',
      rating: 4.9,
      downloads: '20K+',
      url: 'https://identity.ic0.app',
      featured: true,
      tags: ['authentication', 'security'],
      installType: 'canister' as const,
      canisterId: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
      version: '1.3.4',
      size: '6.7 MB',
      developer: 'DFINITY Foundation',
    },
    {
      id: 'motoko-playground',
      name: 'Motoko Playground',
      description: 'Online IDE for Motoko development',
      category: 'tools',
      icon: '⚙️',
      rating: 4.2,
      downloads: '3K+',
      url: 'https://m7sm4-2iaaa-aaaab-qabra-cai.raw.ic0.app/',
      featured: false,
      tags: ['development', 'ide'],
      installType: 'pwa' as const,
      version: '1.3.0',
      size: '2.1 MB',
      developer: 'DFINITY Foundation',
    },
    {
      id: 'ic-dashboard',
      name: 'IC Dashboard',
      description: 'Internet Computer network dashboard',
      category: 'tools',
      icon: '📊',
      rating: 4.1,
      downloads: '2K+',
      url: 'https://dashboard.internetcomputer.org/',
      featured: false,
      tags: ['dashboard', 'analytics'],
      installType: 'pwa' as const,
      version: '1.0.0',
      size: '1.8 MB',
      developer: 'DFINITY Foundation',
    },
  ], []);

  const getInstalledAppIds = useCallback(() => {
    try {
      const apps = installationService.getInstalledApps();
      return new Set(apps.map(app => app.id));
    } catch (error) {
      console.log('Error getting installed apps:', error);
      return new Set();
    }
  }, [installationService]);

  const isAppInstalled = useCallback((appId: string) => {
    try {
      const installedIds = getInstalledAppIds();
      return installedIds.has(appId);
    } catch (error) {
      console.log('Error checking app installation:', error);
      return false;
    }
  }, [getInstalledAppIds]);

  const getInstalledApp = useCallback((appId: string) => {
    try {
      const apps = installationService.getInstalledApps();
      return apps.find(app => app.id === appId);
    } catch (error) {
      console.log('Error getting installed app:', error);
      return null;
    }
  }, [installationService]);

  const featuredApps = useMemo(() => {
    return dApps.filter(app => app.featured).slice(0, 3);
  }, [dApps]);

  const popularApps = useMemo(() => {
    return dApps
      .sort((a, b) => {
        const aScore = parseFloat(a.downloads.replace(/[^0-9]/g, '')) * a.rating;
        const bScore = parseFloat(b.downloads.replace(/[^0-9]/g, '')) * b.rating;
        return bScore - aScore;
      })
      .slice(0, 6);
  }, [dApps]);

  const newArrivals = useMemo(() => {
    return dApps
      .filter(app => app.id === 'motoko-playground' || app.id === 'ic-dashboard')
      .slice(0, 3);
  }, [dApps]);

  const filteredApps = useMemo(() => {
    let apps = dApps;
    
    if (selectedCategory !== 'all') {
      apps = apps.filter(app => app.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      apps = apps.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return apps;
  }, [dApps, selectedCategory, searchQuery]);

  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);
        const apps = installationService.getInstalledApps();
        setInstalledApps(apps);
      } catch (error) {
        console.log('Error loading apps:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      try {
        const apps = installationService.getInstalledApps();
        setInstalledApps(apps);
      } catch (error) {
        console.log('Error refreshing apps:', error);
      }
    });

    return unsubscribe;
  }, [navigation, installationService]);

  useEffect(() => {
    return () => {
      setInstalledApps([]);
      setSelectedApp(null);
      setShowDetailModal(false);
      setInstallingApp(null);
      setShowLauncher(false);
      setLaunchingApp(null);
    };
  }, []);

  const handleInstall = useCallback(async (app: DApp) => {
    if (installingApp) return;
    
    setInstallingApp(app.id);
    setLoading(true);

    try {
      const result = await installationService.installApp(app);
      
      if (result.success) {
        Alert.alert('Installation Successful', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Installation Failed', result.message, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert(
        'Installation Error',
        `An error occurred while installing ${app.name}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setInstallingApp(null);
      setLoading(false);
    }
  }, [installationService, installingApp]);

  const handleLaunchApp = useCallback(async (app: InstalledApp) => {
    try {
      setLoading(true);
      
      if (app.installType === 'pwa' || app.installType === 'canister') {
        setLaunchingApp(app);
        setShowLauncher(true);
        setLoading(false);
        return;
      }
      
      const result = await installationService.launchApp(app);
      
      if (result.success) {
        Alert.alert('Success', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Launch Failed', result.message, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to launch app');
    } finally {
      setLoading(false);
    }
  }, [installationService]);

  const handleLauncherClose = useCallback(() => {
    setShowLauncher(false);
    setLaunchingApp(null);
  }, []);

  const checkNativeAppInstallation = useCallback(async (appId: string) => {
    try {
      const result = await installationService.checkNativeAppInstallation(appId);
      
      if (result.success) {
        Alert.alert('Installation Complete', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Installation Check Failed', result.message, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check installation status');
    }
  }, [installationService]);

  const handleAppPress = useCallback((app: DApp) => {
    const installedApp = getInstalledApp(app.id);
    if (installedApp && installedApp.installType === 'native' && !installedApp.isFullyInstalled) {
      Alert.alert(
        'Check Installation Status',
        `Did you install ${app.name} from the app store?`,
        [
          { text: 'Not Yet', style: 'cancel' },
          { 
            text: 'Yes, Check Status', 
            onPress: () => checkNativeAppInstallation(app.id)
          },
          {
            text: 'Mark as Installed',
            onPress: () => {
              Alert.alert(
                'Mark as Installed',
                `Are you sure you want to mark ${app.name} as installed? This will allow you to launch it.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Yes, Mark Installed', 
                    onPress: () => checkNativeAppInstallation(app.id)
                  }
                ]
              );
            }
          }
        ]
      );
    } else {
      setSelectedApp(app);
      setShowDetailModal(true);
    }
  }, [getInstalledApp, checkNativeAppInstallation]);

  const handleUninstall = useCallback(async (app: DApp) => {
    Alert.alert(
      'Uninstall App',
      `Are you sure you want to uninstall ${app.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await installationService.uninstallApp(app.id);
              
              if (result.success) {
                Alert.alert('Success', result.message, [{ text: 'OK' }]);
                setInstalledApps(installationService.getInstalledApps());
              } else {
                Alert.alert('Uninstall Failed', result.message, [{ text: 'OK' }]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to uninstall app');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [installationService]);

  const handleAppLongPress = useCallback((app: DApp) => {
    const isInstalled = isAppInstalled(app.id);
    
    if (isInstalled) {
      Alert.alert(
        'App Options',
        `What would you like to do with ${app.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Launch', onPress: () => {
            const installedApp = getInstalledApp(app.id);
            if (installedApp) {
              handleLaunchApp(installedApp);
            }
          }},
          { text: 'Uninstall', style: 'destructive', onPress: () => handleUninstall(app) }
        ]
      );
    } else {
      handleAppPress(app);
    }
  }, [isAppInstalled, getInstalledApp, handleLaunchApp, handleUninstall, handleAppPress]);

  const renderCategoryChip = useCallback((category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryChip,
        selectedCategory === category.id && styles.selectedCategoryChip
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <MaterialCommunityIcons
        name={category.icon as any}
        size={16}
        color={selectedCategory === category.id ? '#fff' : '#666'}
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === category.id && styles.selectedCategoryText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory]);

  const renderFeaturedApp = useCallback((app: DApp) => {
    const isInstalled = isAppInstalled(app.id);
    const installedApp = getInstalledApp(app.id);
    const isInstalling = installingApp === app.id;
    
    return (
      <TouchableOpacity
        key={app.id}
        style={styles.featuredAppCard}
        onPress={() => handleAppPress(app)}
        onLongPress={() => handleAppLongPress(app)}
      >
        <View style={styles.featuredAppHeader}>
          <View style={styles.featuredAppIconContainer}>
            <Text style={styles.featuredAppIcon}>{app.icon}</Text>
          </View>
          <View style={styles.featuredAppInfo}>
            <Text style={styles.featuredAppName}>{app.name}</Text>
            <View style={styles.featuredAppRating}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.featuredRatingText}>{app.rating}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.featuredAppDescription}>{app.description}</Text>
        <Text style={styles.featuredDownloadsText}>{app.downloads} downloads</Text>

        <View style={styles.featuredAppTags}>
          {app.tags.slice(0, 2).map((tag: string, index: number) => (
            <View key={index} style={styles.featuredTag}>
              <Text style={styles.featuredTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.featuredInstallButton, isInstalling && styles.installingButton]}
          onPress={() => {
            if (isInstalled) {
              if (installedApp?.installType === 'native' && !installedApp?.isFullyInstalled) {
                checkNativeAppInstallation(app.id);
              } else {
                handleLaunchApp(installedApp!);
              }
            } else {
              handleInstall(app);
            }
          }}
          disabled={loading || isInstalling}
        >
          {isInstalling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isInstalled ? (
            <MaterialCommunityIcons name="play" size={20} color="#fff" />
          ) : (
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
          )}
          <Text style={styles.featuredInstallButtonText}>
            {isInstalling ? 'Installing...' : isInstalled ? 'Launch' : 'Install'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [installingApp, loading, handleInstall, handleAppPress, handleAppLongPress, handleLaunchApp, checkNativeAppInstallation, isAppInstalled, getInstalledApp]);

  const renderAppCard = useCallback((app: DApp) => {
    const isInstalled = isAppInstalled(app.id);
    const installedApp = getInstalledApp(app.id);
    const isInstalling = installingApp === app.id;
    
    return (
      <TouchableOpacity
        key={app.id}
        style={styles.appCard}
        onPress={() => handleAppPress(app)}
        onLongPress={() => handleAppLongPress(app)}
      >
        <View style={styles.appCardHeader}>
          <View style={styles.appIconContainer}>
            <Text style={styles.appIcon}>{app.icon}</Text>
          </View>
          <View style={styles.appHeaderInfo}>
            <Text style={styles.appName}>{app.name}</Text>
            <View style={styles.appRating}>
              <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{app.rating}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.appDescription}>{app.description}</Text>
        <Text style={styles.downloadsText}>{app.downloads} downloads</Text>

        <View style={styles.installTypeBadge}>
          <Text style={styles.installTypeText}>
            {app.installType === 'pwa' ? 'PWA' : 
             app.installType === 'native' ? 'Native' :
             app.installType === 'canister' ? 'Canister' : 'Web'}
          </Text>
        </View>
        
        <View style={styles.appCardFooter}>
          {isInstalled ? (
            <TouchableOpacity
              style={[styles.installButton, isInstalling && styles.installingButton]}
              onPress={() => {
                if (installedApp?.installType === 'native' && !installedApp?.isFullyInstalled) {
                  checkNativeAppInstallation(app.id);
                } else {
                  handleLaunchApp(installedApp!);
                }
              }}
              disabled={loading || isInstalling}
            >
              {isInstalling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="play" size={16} color="#fff" />
              )}
              <Text style={styles.installButtonText}>
                {installedApp?.installType === 'native' && !installedApp?.isFullyInstalled 
                  ? 'Check Status' 
                  : isInstalling ? 'Installing...' : 'Launch'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.installButton, isInstalling && styles.installingButton]}
              onPress={() => handleInstall(app)}
              disabled={loading || isInstalling}
            >
              {isInstalling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="download" size={16} color="#fff" />
              )}
              <Text style={styles.installButtonText}>
                {isInstalling ? 'Installing...' : 'Install'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [installingApp, loading, handleInstall, handleLaunchApp, handleAppPress, checkNativeAppInstallation, handleAppLongPress, isAppInstalled, getInstalledApp]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ICP App Store</Text>
        <Text style={styles.headerSubtitle}>Discover dApps on Internet Computer</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(renderCategoryChip)}
        </ScrollView>
      </View>

      {selectedCategory === 'all' && searchQuery === '' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Apps</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredApps.map(renderFeaturedApp)}
          </ScrollView>
        </View>
      )}

      {selectedCategory === 'all' && searchQuery === '' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Apps</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularApps.map(renderFeaturedApp)}
          </ScrollView>
        </View>
      )}

      {selectedCategory === 'all' && searchQuery === '' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {newArrivals.map(renderFeaturedApp)}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Apps' : `${categories.find(c => c.id === selectedCategory)?.name} Apps`}
          </Text>
          <Text style={styles.appCount}>{filteredApps.length} apps</Text>
        </View>
        
        {filteredApps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No apps found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        ) : (
          <View style={styles.appsGrid}>
            {filteredApps.map(renderAppCard)}
          </View>
        )}
      </View>

      {showLauncher && launchingApp && (
        <Modal
          visible={showLauncher}
          animationType="slide"
          transparent={true}
          onRequestClose={handleLauncherClose}
        >
          <View style={styles.modalOverlay}>
            <MiniAppLauncher
              app={launchingApp}
              onClose={handleLauncherClose}
              visible={showLauncher}
            />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 20,
    backgroundColor: '#b71c1c',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedCategoryChip: {
    backgroundColor: '#b71c1c',
    borderColor: '#b71c1c',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginLeft: 6,
  },
  selectedCategoryText: {
    color: 'white',
  },
  section: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  appCount: {
    fontSize: 14,
    color: '#666',
  },
  appsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  featuredAppCard: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuredAppHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  featuredAppIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  featuredAppIcon: {
    fontSize: 24,
  },
  featuredAppInfo: {
    flex: 1,
  },
  featuredAppName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 4,
  },
  featuredAppRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  featuredRatingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  featuredAppDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuredDownloadsText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  featuredAppTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  featuredTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  featuredTagText: {
    fontSize: 12,
    color: '#666',
  },
  featuredInstallButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#b71c1c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 44,
  },
  featuredInstallButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  appCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 200,
    justifyContent: 'space-between' as const,
  },
  appCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
  },
  appIcon: {
    fontSize: 18,
  },
  appHeaderInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 4,
  },
  appRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  downloadsText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  installTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
    alignSelf: 'flex-start' as const,
    marginBottom: 12,
  },
  installTypeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600' as const,
  },
  installButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#b71c1c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 36,
    width: '100%',
  },
  installButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 6,
  },
  installingButton: {
    backgroundColor: '#666',
  },
  emptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  appCardFooter: {
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default AppStoreScreen;