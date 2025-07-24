// NOTE: Ensure tsconfig.json includes "resolveJsonModule": true and "lib": ["es2015", ...] for ES2015 features and JSON imports.
import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Image, 
  TextInput as RNTextInput, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import appsData from '../../assets/apps.json';
import { useFocusEffect, useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { imageMap } from '../assets/imageMap';
import * as RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import IntentLauncher, { IntentConstant } from 'react-native-intent-launcher';
import { Card, Chip, Button, useTheme, Avatar } from 'react-native-paper';

const PLACEHOLDER_IMAGE = require('../../assets/icon.png');

// Fix implicit any types
const getAllTags = (apps: Array<{ tags: string[] }>): string[] => {
  const tagSet = new Set<string>();
  apps.forEach((app: { tags: string[] }) => app.tags.forEach((tag: string) => tagSet.add(tag)));
  return Array.from(tagSet);
};

const INSTALLED_APPS_KEY = 'installedMiniApps';

const MarketScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // Track image errors by app name
  const [imageErrors, setImageErrors] = useState<{ [name: string]: boolean }>({});
  const navigation = useNavigation<any>();
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const [installing, setInstalling] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [name: string]: number }>({});
  const [realInstalled, setRealInstalled] = useState<{ [name: string]: boolean }>({});
  const theme = useTheme();

  // Refresh installed apps on focus or when returning from detail
  useEffect(() => {
    const fetchInstalled = async () => {
      const data = await AsyncStorage.getItem(INSTALLED_APPS_KEY);
      setInstalledApps(data ? JSON.parse(data) : []);
    };
    if (isFocused) fetchInstalled();
  }, [isFocused]);

  // Check real installed status for all apps (Android only)
  useEffect(() => {
    if (Platform.OS === 'android') {
      (async () => {
        const pkgs = await (DeviceInfo as any).getInstalledPackages?.() || [];
        const status: { [name: string]: boolean } = {};
        appsData.forEach(app => {
          if (app.packageName) status[app.name] = pkgs.includes(app.packageName);
        });
        setRealInstalled(status);
      })();
    }
  }, [isFocused]);

  // Filter apps by search and selected tag
  const filteredApps = useMemo(() => {
    let filtered = appsData;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(lower) ||
        app.tags.some((tag: string) => tag.toLowerCase().includes(lower))
      );
    }
    if (selectedTag) {
      filtered = filtered.filter(app => Array.isArray(app.tags) && app.tags.some((tag: string) => tag === selectedTag));
    }
    return filtered;
  }, [search, selectedTag]);

  const allTags = useMemo(() => getAllTags(appsData), []);

  const handleImageError = (name: string) => {
    setImageErrors(prev => ({ ...prev, [name]: true }));
  };

  const handleInstall = async (app: any): Promise<void> => {
    if (Platform.OS !== 'android') return;
    if (!app.apkUrl) return;
    setInstalling(app.name);
    setDownloadProgress(p => ({ ...p, [app.name]: 0 }));
    try {
      const apkFilename = app.apkUrl.split('/').pop();
      const localUri = RNFS.CachesDirectoryPath + '/' + apkFilename;
      const downloadResult = RNFS.downloadFile({
        fromUrl: app.apkUrl,
        toFile: localUri,
        progress: (res) => {
          setDownloadProgress(p => ({ ...p, [app.name]: res.bytesWritten / res.contentLength }));
        },
        progressDivider: 10,
      });
      const result = await downloadResult.promise;
      if (result.statusCode !== 200) throw new Error('Download failed');
      IntentLauncher.startActivity({
        action: 'android.intent.action.VIEW',
        data: 'file://' + localUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
    } catch (e) {
      // Optionally show error
    }
    setInstalling(null);
    setTimeout(() => {
      // Re-check installed status
      (async () => {
        const pkgs = await (DeviceInfo as any).getInstalledPackages?.() || [];
        setRealInstalled(s => ({ ...s, [app.name]: pkgs.includes(app.packageName) }));
      })();
    }, 3000);
  };

  const handleOpen = (app: any): void => {
    if (Platform.OS !== 'android') return;
    if (!app.packageName) return;
    try {
      IntentLauncher.startApp({ packageName: app.packageName });
    } catch (e) {}
  };

  const handleUninstall = (app: any): void => {
    if (Platform.OS !== 'android') return;
    if (!app.packageName) return;
    try {
      IntentLauncher.startActivity({
        action: IntentConstant.ACTION_DELETE,
        data: `package:${app.packageName}`,
      });
      setTimeout(() => {
        (async () => {
          const pkgs = await (DeviceInfo as any).getInstalledPackages?.() || [];
          setRealInstalled(s => ({ ...s, [app.name]: pkgs.includes(app.packageName) }));
        })();
      }, 3000);
    } catch (e) {}
  };

  const renderAppCard = ({ item }: { item: any }): React.JSX.Element => {
    // App icon logic
    let iconSource;
    if (item.icon && imageMap[item.icon]) {
      iconSource = imageMap[item.icon];
    } else if (item.icon && item.icon.startsWith('http')) {
      iconSource = { uri: item.icon };
    } else if (item.screenshots && imageMap[item.screenshots[0]]) {
      iconSource = imageMap[item.screenshots[0]];
    } else if (item.screenshots && item.screenshots[0]) {
      iconSource = { uri: item.screenshots[0] };
    } else {
      iconSource = PLACEHOLDER_IMAGE;
    }
    const isInstalled = Array.isArray(installedApps)
      ? installedApps.indexOf(item.name) !== -1
      : false;
    return (
      <Card
        style={{ marginBottom: 18, borderRadius: 18, elevation: 2, backgroundColor: theme.colors.surface }}
        onPress={() => navigation.navigate('AppDetail', { app: item })}
        accessibilityLabel={`Mini app card for ${item.name}`}
      >
        <Card.Content style={{ flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 12 }}>
          <Avatar.Image
            source={iconSource}
            size={64}
            style={{ marginRight: 18, backgroundColor: theme.colors.background }}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.colors.onSurface }}>{item.name}</Text>
              {realInstalled[item.name] && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondary + '22', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.secondary} />
                  <Text style={{ color: theme.colors.secondary, fontSize: 12, marginLeft: 2, fontWeight: '600' }}>Installed</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.onSurface + 'BB', marginBottom: 6 }}>{item.description}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
              {item.tags.map((tag: string) => (
                <Chip
                  key={tag}
                  mode={selectedTag === tag ? 'flat' : 'outlined'}
                  selected={selectedTag === tag}
                  style={{
                    marginRight: 6,
                    marginBottom: 4,
                    backgroundColor: selectedTag === tag ? theme.colors.primary : theme.colors.background,
                    borderColor: theme.colors.primary,
                    borderWidth: selectedTag === tag ? 0 : 1,
                    height: 28,
                  }}
                  textStyle={{ color: selectedTag === tag ? theme.colors.onPrimary : theme.colors.primary, fontSize: 13, fontWeight: '500' }}
                  onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  accessibilityLabel={`Filter by tag: ${tag}`}
                >
                  #{tag}
                </Chip>
              ))}
            </View>
            {Platform.OS === 'android' && (
              <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                {realInstalled[item.name] ? (
                  <>
                    <Button
                      mode="contained-tonal"
                      icon="open-in-new"
                      style={{ borderRadius: 8, marginRight: 8 }}
                      labelStyle={{ color: theme.colors.secondary, fontWeight: '600' }}
                      onPress={() => handleOpen(item)}
                    >
                      Open
                    </Button>
                    <Button
                      mode="outlined"
                      icon="delete"
                      style={{ borderRadius: 8, borderColor: theme.colors.error, borderWidth: 1 }}
                      labelStyle={{ color: theme.colors.error, fontWeight: '600' }}
                      onPress={() => handleUninstall(item)}
                    >
                      Uninstall
                    </Button>
                  </>
                ) : (
                  <Button
                    mode="contained"
                    icon={installing === item.name ? undefined : 'download'}
                    style={{ borderRadius: 8, backgroundColor: theme.colors.primary, minWidth: 90 }}
                    labelStyle={{ color: theme.colors.onPrimary, fontWeight: '600' }}
                    onPress={() => handleInstall(item)}
                    disabled={installing === item.name}
                    loading={installing === item.name}
                  >
                    {installing === item.name ? `${Math.round((downloadProgress[item.name] || 0) * 100)}%` : 'Install'}
                  </Button>
                )}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.header, { color: theme.colors.onSurface }]}>Market</Text>
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.primary} />
        <RNTextInput
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          placeholder="Search mini apps by name or tag..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.colors.onSurface + '77'}
          accessibilityLabel="Search mini apps"
        />
      </View>
      {/* Tag filter row */}
      <View style={{ marginTop: 14, marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            alignItems: 'center',
            minHeight: 40,
          }}
          style={{ flexGrow: 0 }}
        >
          {allTags.map(tag => (
            <Chip
              key={tag}
              mode={selectedTag === tag ? 'flat' : 'outlined'}
              selected={selectedTag === tag}
              style={{
                marginRight: 8,
                backgroundColor: selectedTag === tag ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.primary,
                borderWidth: selectedTag === tag ? 0 : 1,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
              }}
              textStyle={{
                color: selectedTag === tag ? theme.colors.onPrimary : theme.colors.primary,
                fontSize: 14,
                fontWeight: '500',
              }}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              accessibilityLabel={`Filter by tag: ${tag}`}
            >
              #{tag}
            </Chip>
          ))}
        </ScrollView>
      </View>
      {/* Mini Apps List */}
      <FlatList
        data={filteredApps}
        keyExtractor={(item: any) => item.name}
        renderItem={renderAppCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.colors.onSurface + '77' }]}>No mini apps found.</Text>}
        accessibilityLabel="Mini apps list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#222',
  },
  tagsScroll: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  screenshot: {
    width: 80,
    height: 80,
    borderRadius: 12,
    margin: 12,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  appDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagSelected: {
    backgroundColor: '#b71c1c',
  },
  tagText: {
    fontSize: 12,
    color: '#4285f4',
  },
  tagTextSelected: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 40,
  },
  installedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  installedText: {
    color: '#43a047',
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '600',
  },
});

export default MarketScreen; 