import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';

export interface InstalledApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  installDate: string;
  lastUsed?: string;
  launchCount: number;
  installType: 'web' | 'canister' | 'external' | 'pwa' | 'native';
  canisterId?: string;
  localPath?: string;
  pwaData?: any;
  appStoreId?: string;
  isFullyInstalled: boolean;
  version?: string;
  size?: string;
  developer?: string;
  description?: string;
  tags?: string[];
}

export interface DApp {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  rating: number;
  downloads: string;
  url: string;
  featured: boolean;
  tags: string[];
  installType?: 'web' | 'canister' | 'external' | 'pwa' | 'native';
  appStoreId?: string;
  pwaManifestUrl?: string;
  bundleUrl?: string;
  canisterId?: string;
  version?: string;
  size?: string;
  developer?: string;
}

class AppInstallationService {
  private static instance: AppInstallationService;
  private installedApps: InstalledApp[] = [];
  private listeners: ((apps: InstalledApp[]) => void)[] = [];

  private constructor() {
    this.loadInstalledApps();
  }

  static getInstance(): AppInstallationService {
    if (!AppInstallationService.instance) {
      AppInstallationService.instance = new AppInstallationService();
    }
    return AppInstallationService.instance;
  }

  private async loadInstalledApps(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('installedApps');
      if (stored) {
        this.installedApps = JSON.parse(stored);
      }
    } catch (error) {
      console.log('Error loading installed apps:', error);
    }
  }

  private async saveInstalledApps(): Promise<void> {
    try {
      await AsyncStorage.setItem('installedApps', JSON.stringify(this.installedApps));
      this.notifyListeners();
    } catch (error) {
      console.log('Error saving installed apps:', error);
    }
  }

  addListener(callback: (apps: InstalledApp[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.installedApps);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.installedApps));
  }

  getInstalledApps(): InstalledApp[] {
    try {
      const apps = this.installedApps.slice();
      return apps;
    } catch (error) {
      console.log('Error getting installed apps:', error);
      return [];
    }
  }

  isAppInstalled(appId: string): boolean {
    try {
      return this.installedApps.some(app => app.id === appId);
    } catch (error) {
      console.log('Error checking if app is installed:', error);
      return false;
    }
  }

  getInstalledApp(appId: string): InstalledApp | null {
    try {
      return this.installedApps.find(app => app.id === appId) || null;
    } catch (error) {
      console.log('Error getting installed app:', error);
      return null;
    }
  }

  async installPWA(app: DApp): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Installing PWA:', app.name);
      
      const pwaData = {
        manifest: {
          name: app.name,
          start_url: app.url,
          display: 'standalone',
          theme_color: '#b71c1c',
          background_color: '#ffffff',
          icons: [{ src: app.icon, sizes: '192x192', type: 'image/png' }],
        },
        installUrl: app.url,
        name: app.name,
        icon: app.icon,
        themeColor: '#b71c1c',
        backgroundColor: '#ffffff',
        display: 'standalone',
        scope: '/',
        startUrl: app.url,
        installedAt: new Date().toISOString(),
        version: app.version,
        description: app.description,
      };

      const installedApp: InstalledApp = {
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        installDate: new Date().toISOString(),
        lastUsed: undefined,
        launchCount: 0,
        installType: 'pwa',
        pwaData,
        isFullyInstalled: true,
        localPath: `pwa://${app.id}`,
        version: app.version,
        size: app.size,
        developer: app.developer,
        description: app.description,
        tags: app.tags,
      };

      this.installedApps.push(installedApp);
      await this.saveInstalledApps();

      return { 
        success: true, 
        message: `${app.name} has been installed as a Progressive Web App! You can now use it offline.` 
      };
    } catch (error) {
      console.log('PWA installation failed:', error);
      return { success: false, message: 'Failed to install PWA' };
    }
  }

  async installNativeApp(app: DApp): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Installing native app:', app.name);
      
      if (!app.appStoreId) {
        return { success: false, message: 'No app store ID provided' };
      }

      let storeUrl = '';
      if (Platform.OS === 'ios') {
        storeUrl = `https://apps.apple.com/app/id${app.appStoreId}`;
      } else {
        storeUrl = `https://play.google.com/store/apps/details?id=${app.appStoreId}`;
      }

      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
        
        const installedApp: InstalledApp = {
          id: app.id,
          name: app.name,
          url: app.url,
          icon: app.icon,
          installDate: new Date().toISOString(),
          lastUsed: undefined,
          launchCount: 0,
          installType: 'native',
          appStoreId: app.appStoreId,
          isFullyInstalled: false,
          localPath: `native://${app.appStoreId}`,
          version: app.version,
          size: app.size,
          developer: app.developer,
          description: app.description,
          tags: app.tags,
        };

        this.installedApps.push(installedApp);
        await this.saveInstalledApps();

        return { 
          success: true, 
          message: `App store opened for ${app.name}. Please install from the store and return here. The app will be marked as installed when you return.` 
        };
      } else {
        await Linking.openURL(app.url);
        return { 
          success: true, 
          message: `${app.name} opened in browser.` 
        };
      }
    } catch (error) {
      console.log('Native app installation failed:', error);
      return { success: false, message: 'Failed to open app store' };
    }
  }

  async installCanisterApp(app: DApp): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Installing canister app:', app.name);
      
      if (!app.canisterId) {
        return { success: false, message: 'No canister ID provided' };
      }

      const installedApp: InstalledApp = {
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        installDate: new Date().toISOString(),
        lastUsed: undefined,
        launchCount: 0,
        installType: 'canister',
        canisterId: app.canisterId,
        isFullyInstalled: true,
        localPath: `canister://${app.canisterId}`,
        version: app.version,
        size: app.size,
        developer: app.developer,
        description: app.description,
        tags: app.tags,
      };

      this.installedApps.push(installedApp);
      await this.saveInstalledApps();

      return { 
        success: true, 
        message: `${app.name} has been installed and can interact with the Internet Computer!` 
      };
    } catch (error) {
      console.log('Canister app installation failed:', error);
      return { success: false, message: 'Failed to install canister app' };
    }
  }

  async installApp(app: DApp): Promise<{ success: boolean; message: string }> {
    try {
      switch (app.installType) {
        case 'pwa':
          return await this.installPWA(app);
          
        case 'native':
          return await this.installNativeApp(app);
          
        case 'canister':
          return await this.installCanisterApp(app);
          
        case 'web':
        case 'external':
        default:
          const installedApp: InstalledApp = {
            id: app.id,
            name: app.name,
            url: app.url,
            icon: app.icon,
            installDate: new Date().toISOString(),
            lastUsed: undefined,
            launchCount: 0,
            installType: app.installType || 'web',
            isFullyInstalled: true,
            localPath: `web://${app.id}`,
            version: app.version,
            size: app.size,
            developer: app.developer,
            description: app.description,
            tags: app.tags,
          };
          
          this.installedApps.push(installedApp);
          await this.saveInstalledApps();
          
          return { 
            success: true, 
            message: `${app.name} has been added to your app library!` 
          };
      }
    } catch (error) {
      console.log('App installation failed:', error);
      return { success: false, message: 'Installation failed' };
    }
  }

  async uninstallApp(appId: string): Promise<{ success: boolean; message: string }> {
    try {
      const appToUninstall = this.installedApps.find(app => app.id === appId);
      if (!appToUninstall) {
        return { success: false, message: 'App not found' };
      }

      console.log('Uninstalling app:', appToUninstall.name, 'Type:', appToUninstall.installType);

      switch (appToUninstall.installType) {
        case 'pwa':
          console.log('Uninstalling PWA:', appToUninstall.name);
          break;
          
        case 'native':
          console.log('Removing native app from tracking:', appToUninstall.name);
          break;
          
        case 'canister':
          console.log('Uninstalling canister app:', appToUninstall.name);
          break;
          
        default:
          console.log('Uninstalling web app:', appToUninstall.name);
          break;
      }

      this.installedApps = this.installedApps.filter(app => app.id !== appId);
      await this.saveInstalledApps();
      
      let message = `${appToUninstall.name} has been uninstalled successfully!`;
      if (appToUninstall.installType === 'native') {
        message = `${appToUninstall.name} removed from tracking. To fully uninstall, please use your device's app manager.`;
      } else if (appToUninstall.installType === 'pwa') {
        message = `${appToUninstall.name} PWA data cleared and removed successfully!`;
      } else if (appToUninstall.installType === 'canister') {
        message = `${appToUninstall.name} canister app removed successfully!`;
      }
      
      return { success: true, message };
    } catch (error) {
      console.log('Uninstall error:', error);
      return { success: false, message: 'Failed to uninstall app' };
    }
  }

  async launchApp(appOrId: InstalledApp | string): Promise<{ success: boolean; message: string }> {
    try {
      let app: InstalledApp;
      
      if (typeof appOrId === 'string') {
        app = this.installedApps.find(a => a.id === appOrId)!;
        if (!app) {
          return { success: false, message: 'App not found' };
        }
      } else {
        app = appOrId;
      }

      console.log('Launching app:', app.name, 'Type:', app.installType);

      const updatedApps = this.installedApps.map(a => 
        a.id === app.id 
          ? { ...a, launchCount: a.launchCount + 1, lastUsed: new Date().toISOString() }
          : a
      );
      this.installedApps = updatedApps;
      await this.saveInstalledApps();

      if (app.installType === 'native') {
        return await this.launchNativeApp(app);
      } else if (app.installType === 'pwa') {
        await Linking.openURL(app.url);
        return { success: true, message: `Opening ${app.name} in browser...` };
      } else if (app.installType === 'canister') {
        await Linking.openURL(app.url);
        return { success: true, message: `Opening ${app.name} in browser...` };
      } else {
        await Linking.openURL(app.url);
        return { success: true, message: `Opening ${app.name} in browser...` };
      }
    } catch (error) {
      console.log('Error launching app:', error);
      return { success: false, message: 'Failed to launch app' };
    }
  }

  async updateAppStatus(appId: string, isFullyInstalled: boolean): Promise<void> {
    const updatedApps = this.installedApps.map(app => 
      app.id === appId 
        ? { ...app, isFullyInstalled }
        : app
    );
    this.installedApps = updatedApps;
    await this.saveInstalledApps();
  }

  async checkNativeAppInstallation(appId: string): Promise<{ success: boolean; message: string }> {
    try {
      const app = this.installedApps.find(a => a.id === appId);
      if (!app || app.installType !== 'native') {
        return { success: false, message: 'App not found or not a native app' };
      }

      const updatedApps = this.installedApps.map(a => 
        a.id === appId 
          ? { ...a, isFullyInstalled: true }
          : a
      );
      this.installedApps = updatedApps;
      await this.saveInstalledApps();

      return { 
        success: true, 
        message: `${app.name} has been marked as installed! You can now launch it.` 
      };
    } catch (error) {
      console.log('Error checking native app installation:', error);
      return { success: false, message: 'Failed to check installation status' };
    }
  }

  getAppStats(): { totalApps: number; pwaCount: number; nativeCount: number; canisterCount: number; webCount: number } {
    const stats = {
      totalApps: this.installedApps.length,
      pwaCount: this.installedApps.filter(app => app.installType === 'pwa').length,
      nativeCount: this.installedApps.filter(app => app.installType === 'native').length,
      canisterCount: this.installedApps.filter(app => app.installType === 'canister').length,
      webCount: this.installedApps.filter(app => app.installType === 'web').length,
    };
    return stats;
  }

  async clearAllApps(): Promise<void> {
    this.installedApps = [];
    await this.saveInstalledApps();
  }

  async isNativeAppInstalledOnDevice(packageName: string): Promise<boolean> {
    try {
      console.log('Checking if native app is installed:', packageName);
      
      if (Platform.OS === 'android') {
        try {
          const intentUrl = `intent://${packageName}#Intent;scheme=package;end`;
          console.log('Trying intent URL:', intentUrl);
          const canOpen = await Linking.canOpenURL(intentUrl);
          console.log('Intent URL can open:', canOpen);
          if (canOpen) {
            return true;
          }
        } catch (error) {
          console.log('Method 1 failed:', error);
        }

        try {
          const marketUrl = `market://details?id=${packageName}`;
          console.log('Trying market URL:', marketUrl);
          const canOpen = await Linking.canOpenURL(marketUrl);
          console.log('Market URL can open:', canOpen);
          if (canOpen) {
            return true;
          }
        } catch (error) {
          console.log('Method 2 failed:', error);
        }

        const commonSchemes = [
          `${packageName}://`,
          `com.${packageName}://`,
          `io.${packageName}://`,
        ];

        for (const scheme of commonSchemes) {
          try {
            console.log('Trying scheme:', scheme);
            const canOpen = await Linking.canOpenURL(scheme);
            console.log('Scheme can open:', canOpen);
            if (canOpen) {
              return true;
            }
          } catch (error) {
            console.log(`Scheme ${scheme} failed:`, error);
          }
        }

        if (packageName === 'io.metamask') {
          const metamaskSchemes = [
            'metamask://',
            'io.metamask://',
            'com.metamask://',
          ];
          
          for (const scheme of metamaskSchemes) {
            try {
              console.log('Trying MetaMask scheme:', scheme);
              const canOpen = await Linking.canOpenURL(scheme);
              console.log('MetaMask scheme can open:', canOpen);
              if (canOpen) {
                return true;
              }
            } catch (error) {
              console.log(`MetaMask scheme ${scheme} failed:`, error);
            }
          }
        }

        console.log('All methods failed, app not installed');
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.log('Error checking if native app is installed:', error);
      return false;
    }
  }

  async launchNativeApp(app: InstalledApp): Promise<{ success: boolean; message: string }> {
    try {
      if (!app.appStoreId) {
        return { success: false, message: 'No app store ID available' };
      }

      console.log('Attempting to launch native app:', app.name, 'Package:', app.appStoreId);

      const isInstalled = await this.isNativeAppInstalledOnDevice(app.appStoreId);
      console.log('App installed check result:', isInstalled);
      
      if (isInstalled) {
        if (Platform.OS === 'android') {
          try {
            const intentUrl = `intent://${app.appStoreId}#Intent;scheme=package;end`;
            await Linking.openURL(intentUrl);
            return { success: true, message: `Launching ${app.name}...` };
          } catch (error) {
            console.log('Direct package launch failed:', error);
          }

          const commonSchemes = [
            `${app.appStoreId}://`,
            `com.${app.appStoreId}://`,
            `io.${app.appStoreId}://`,
          ];

          for (const scheme of commonSchemes) {
            try {
              const canOpen = await Linking.canOpenURL(scheme);
              if (canOpen) {
                await Linking.openURL(scheme);
                return { success: true, message: `Launching ${app.name}...` };
              }
            } catch (error) {
              console.log(`Scheme ${scheme} failed:`, error);
            }
          }

          if (app.appStoreId === 'io.metamask') {
            const metamaskSchemes = [
              'metamask://',
              'io.metamask://',
              'com.metamask://',
            ];
            
            for (const scheme of metamaskSchemes) {
              try {
                console.log('Trying MetaMask launch scheme:', scheme);
                const canOpen = await Linking.canOpenURL(scheme);
                if (canOpen) {
                  await Linking.openURL(scheme);
                  return { success: true, message: `Launching ${app.name}...` };
                }
              } catch (error) {
                console.log(`MetaMask launch scheme ${scheme} failed:`, error);
              }
            }
          }

          try {
            const marketUrl = `market://details?id=${app.appStoreId}`;
            const canOpen = await Linking.canOpenURL(marketUrl);
            if (canOpen) {
              await Linking.openURL(marketUrl);
              return { success: true, message: `Launching ${app.name}...` };
            }
          } catch (error) {
            console.log('Market scheme failed:', error);
          }

          const storeUrl = `https://play.google.com/store/apps/details?id=${app.appStoreId}`;
          await Linking.openURL(storeUrl);
          return { 
            success: true, 
            message: `${app.name} not found. Opening app store page. Please install from there.` 
          };
        } else {
          const appUrl = `${app.appStoreId}://`;
          const canOpen = await Linking.canOpenURL(appUrl);
          if (canOpen) {
            await Linking.openURL(appUrl);
            return { success: true, message: `Launching ${app.name}...` };
          } else {
            const storeUrl = `https://apps.apple.com/app/id${app.appStoreId}`;
            await Linking.openURL(storeUrl);
            return { 
              success: true, 
              message: `${app.name} not found. Opening app store page.` 
            };
          }
        }
      } else {
        const storeUrl = Platform.OS === 'ios' 
          ? `https://apps.apple.com/app/id${app.appStoreId}`
          : `https://play.google.com/store/apps/details?id=${app.appStoreId}`;
        await Linking.openURL(storeUrl);
        return { 
          success: true, 
          message: `${app.name} is not installed. Opening app store to install.` 
        };
      }
    } catch (error) {
      console.log('Error launching native app:', error);
      return { success: false, message: 'Failed to launch native app' };
    }
  }
}

export default AppInstallationService; 