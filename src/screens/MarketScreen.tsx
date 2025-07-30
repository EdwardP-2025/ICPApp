import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../contexts/UserContext';
import { useState } from 'react';

const MOCK_APPS = [
  {
    id: 1,
    name: 'DSCVR',
    description: 'Decentralized social media platform',
    icon: '🌐',
    category: 'Social',
    rating: 4.5,
    downloads: '10K+',
    price: 'Free',
    featured: true,
  },
  {
    id: 2,
    name: 'OpenChat',
    description: 'Decentralized messaging app',
    icon: '💬',
    category: 'Communication',
    rating: 4.3,
    downloads: '5K+',
    price: 'Free',
    featured: false,
  },
  {
    id: 3,
    name: 'Plug Wallet',
    description: 'Cryptocurrency wallet',
    icon: '💰',
    category: 'Finance',
    rating: 4.7,
    downloads: '15K+',
    price: 'Free',
    featured: true,
  },
  {
    id: 4,
    name: 'Candid',
    description: 'Programming language for IC',
    icon: '⚙️',
    category: 'Development',
    rating: 4.2,
    downloads: '2K+',
    price: 'Free',
    featured: false,
  },
  {
    id: 5,
    name: 'Motoko',
    description: 'IC programming language',
    icon: '🔧',
    category: 'Development',
    rating: 4.1,
    downloads: '1K+',
    price: 'Free',
    featured: false,
  },
  {
    id: 6,
    name: 'Internet Identity',
    description: 'Authentication service',
    icon: '🔐',
    category: 'Security',
    rating: 4.8,
    downloads: '20K+',
    price: 'Free',
    featured: true,
  },
  {
    id: 7,
    name: 'NNS',
    description: 'Network Nervous System',
    icon: '🏛️',
    category: 'Governance',
    rating: 4.6,
    downloads: '8K+',
    price: 'Free',
    featured: false,
  },
  {
    id: 8,
    name: 'Sonic',
    description: 'DeFi platform',
    icon: '📈',
    category: 'Finance',
    rating: 4.4,
    downloads: '12K+',
    price: 'Free',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Social', 'Finance', 'Communication', 'Development', 'Gaming', 'Security', 'Governance'];

const MarketScreen: React.FC = () => {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = MOCK_APPS.filter(app => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredApps = MOCK_APPS.filter(app => app.featured);

  const handleAppPress = (app: any) => {
    Alert.alert(
      'App Details',
      `${app.name}\n\n${app.description}\n\nCategory: ${app.category}\nRating: ${app.rating}/5\nDownloads: ${app.downloads}\nPrice: ${app.price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Install', onPress: () => Alert.alert('Success', `${app.name} installation started!`) }
      ]
    );
  };

  const renderCategoryChip = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.selectedCategoryChip
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === category && styles.selectedCategoryChipText
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderFeaturedApp = (app: any) => (
    <TouchableOpacity
      key={app.id}
      style={styles.featuredAppCard}
      onPress={() => handleAppPress(app)}
    >
      <View style={styles.featuredAppHeader}>
        <Text style={styles.featuredAppIcon}>{app.icon}</Text>
        <View style={styles.featuredAppBadge}>
          <Text style={styles.featuredAppBadgeText}>Featured</Text>
        </View>
      </View>
      <Text style={styles.featuredAppName}>{app.name}</Text>
      <Text style={styles.featuredAppDescription}>{app.description}</Text>
      <View style={styles.featuredAppFooter}>
        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{app.rating}</Text>
        </View>
        <Text style={styles.downloadsText}>{app.downloads}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAppCard = (app: any) => (
    <TouchableOpacity
      key={app.id}
      style={styles.appCard}
      onPress={() => handleAppPress(app)}
    >
      <View style={styles.appCardHeader}>
        <Text style={styles.appIcon}>{app.icon}</Text>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.appCategory}>{app.category}</Text>
        </View>
        <View style={styles.appRating}>
          <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{app.rating}</Text>
        </View>
      </View>
      <Text style={styles.appDescription}>{app.description}</Text>
      <View style={styles.appCardFooter}>
        <Text style={styles.downloadsText}>{app.downloads}</Text>
        <Text style={styles.priceText}>{app.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#b71c1c" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Market</Text>
            <Text style={styles.headerSubtitle}>Discover amazing DApps</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Search DApps...</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
            {CATEGORIES.map(renderCategoryChip)}
          </ScrollView>
        </View>

        {/* Featured Apps */}
        {selectedCategory === 'All' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Apps</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredAppsList}>
              {featuredApps.map(renderFeaturedApp)}
            </ScrollView>
          </View>
        )}

        {/* Apps List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Apps' : selectedCategory}
            </Text>
            <Text style={styles.appsCount}>{filteredApps.length} apps</Text>
          </View>
          <View style={styles.appsList}>
            {filteredApps.map(renderAppCard)}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#b71c1c',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  searchSection: {
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryChip: {
    backgroundColor: '#b71c1c',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#b71c1c',
    fontWeight: '600',
  },
  appsCount: {
    fontSize: 14,
    color: '#666',
  },
  featuredAppsList: {
    paddingRight: 20,
  },
  appsList: {
    paddingRight: 20,
  },
  featuredAppCard: {
    width: 200,
    height: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredAppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featuredAppIcon: {
    fontSize: 32,
  },
  featuredAppBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredAppBadgeText: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  featuredAppName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featuredAppDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 12,
  },
  featuredAppFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  downloadsText: {
    fontSize: 12,
    color: '#666',
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  appCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default MarketScreen; 