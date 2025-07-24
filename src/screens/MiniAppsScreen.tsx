import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import appsData from '../../assets/apps.json';

const PLACEHOLDER_IMAGE = require('../../assets/icon.png');

const MiniAppsScreen = () => {
  const [search, setSearch] = useState('');
  const [filteredApps, setFilteredApps] = useState(appsData);

  useEffect(() => {
    if (!search) {
      setFilteredApps(appsData);
    } else {
      const lower = search.toLowerCase();
      setFilteredApps(
        appsData.filter(app =>
          app.name.toLowerCase().includes(lower) ||
          app.tags.some((tag: string) => tag.toLowerCase().includes(lower))
        )
      );
    }
  }, [search]);

  const renderAppCard = ({ item }: { item: any }) => (
    <View style={styles.card} accessibilityLabel={`Mini app card for ${item.name}`}> 
      <Image
        source={item.screenshots && item.screenshots[0] ? { uri: item.screenshots[0] } : PLACEHOLDER_IMAGE}
        style={styles.screenshot}
        resizeMode="cover"
        accessibilityLabel={`${item.name} screenshot`}
      />
      <View style={styles.cardContent}>
        <Text style={styles.appName}>{item.name}</Text>
        <Text style={styles.appDesc}>{item.description}</Text>
        <View style={styles.tagsRow}>
          {item.tags.map((tag: string) => (
            <View key={tag} style={styles.tag} accessibilityLabel={`Tag: ${tag}`}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mini Apps</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search mini apps by name or tag..."
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Search mini apps"
      />
      {/* Future: Category filter UI here */}
      <FlatList
        data={filteredApps}
        keyExtractor={item => item.name}
        renderItem={renderAppCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No mini apps found.</Text>}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  tagText: {
    fontSize: 12,
    color: '#4285f4',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 40,
  },
});

export default MiniAppsScreen; 