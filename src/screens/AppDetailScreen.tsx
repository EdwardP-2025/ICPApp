import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Platform, Animated, Easing, Linking, Modal, TextInput, KeyboardAvoidingView, Platform as RNPlatform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
import axios from 'axios';
import { imageMap } from '../assets/imageMap';
import * as RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import IntentLauncher, { IntentConstant } from 'react-native-intent-launcher';

const PLACEHOLDER_IMAGE = require('../../assets/icon.png');
const SCREEN_WIDTH = Dimensions.get('window').width;
const INSTALLED_APPS_KEY = 'installedMiniApps';
const REMOTE_REVIEWS_URL = 'https://mock-icp-reviews-api.example.com/reviews'; // Replace with real endpoint if available

const getRandomAvatar = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;

const AppDetailScreen = ({ route, navigation }: any) => {
  const { app } = route.params;
  const [installed, setInstalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [buttonScale] = useState(new Animated.Value(1));
  const [iconOpacity] = useState(new Animated.Value(0));
  const [carouselOpacities] = useState(app.screenshots && app.screenshots.length > 0 ? app.screenshots.map(() => new Animated.Value(0)) : [new Animated.Value(0)]);
  const [reviews, setReviews] = useState(app.reviews || []);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const REVIEWS_KEY = `reviews_${app.name.replace(/\s+/g, '_')}`;

  // Check if app is installed (Android only, Expo Go compatible, Play Store inference method)
  const checkInstalled = async () => {
    if (Platform.OS === 'android' && app.name === 'Plug Wallet') {
      let status = false;
      try {
        const playStoreUrl = 'market://details?id=co.psychedelic.plug';
        const supported = await Linking.canOpenURL(playStoreUrl);
        // If supported, the Play Store can open, so the app is NOT installed
        // If not supported, the app IS installed
        status = !supported;
        console.log('Plug Wallet Play Store canOpenURL:', supported, '=> installed:', status);
      } catch (e) {
        console.log('Plug Wallet Play Store install status check error:', e);
        status = false;
      }
      setInstalled(status);
    } else {
      setInstalled(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkInstalled();
  }, [app.name]);

  // Add navigation focus listener to re-check installed status
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkInstalled();
      if (app.name === 'Plug Wallet') {
        console.log('Returned to app from Play Store. Checking installed status for Plug Wallet...');
        setTimeout(async () => {
          await checkInstalled();
          console.log('Plug Wallet installed status after returning:', installed);
        }, 1000);
      }
    });
    return unsubscribe;
  }, [navigation, app.name]);

  useEffect(() => {
    Animated.timing(iconOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    carouselOpacities.forEach((opacity: Animated.Value, idx: number) => {
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 100 * idx);
    });
  }, []);

  useEffect(() => {
    (async () => {
      let remoteReviews = [];
      try {
        const res = await axios.get(`${REMOTE_REVIEWS_URL}/${encodeURIComponent(app.name)}`);
        remoteReviews = res.data || [];
      } catch (e) {
      }
      const localData = await AsyncStorage.getItem(REVIEWS_KEY);
      let localReviews = localData ? JSON.parse(localData) : [];
      const allReviews = [...remoteReviews, ...localReviews.filter((lr: any) => !remoteReviews.some((rr: any) => rr.date === lr.date))];
      setReviews(allReviews);
    })();
  }, [REVIEWS_KEY]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: app.name });
  }, [navigation, app.name]);

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(msg);
    }
  };

  // Real APK install or open in browser
  const handleInstall = async () => {
    if (!app.apkUrl) {
      showToast('No install or download URL provided.');
      return;
    }
    // If it's a Play Store or website link, open in browser
    if (!app.apkUrl.endsWith('.apk')) {
      console.log('Install from Play Store clicked for', app.name, 'with packageName:', app.packageName);
      console.log('Current installed status before redirect:', installed);
      Linking.openURL(app.apkUrl);
      return;
    }
    if (Platform.OS !== 'android') {
      showToast('APK install is only supported on Android.');
      return;
    }
    setActionLoading(true);
    setDownloadProgress(0);
    try {
      const apkFilename = app.apkUrl.split('/').pop();
      const localUri = `${RNFS.CachesDirectoryPath}/${apkFilename}`;
      const downloadResult = await RNFS.downloadFile({
        fromUrl: app.apkUrl,
        toFile: localUri,
        progress: (progress) => {
          const { bytesWritten, contentLength } = progress;
          let percent = 0;
          if (contentLength > 0) {
            percent = bytesWritten / contentLength;
          }
          setDownloadProgress(percent);
        },
        progressDivider: 1,
      }).promise;
      if (downloadResult.statusCode !== 200) throw new Error('Download failed');
      setDownloadProgress(1);
      // Launch APK installer
      IntentLauncher.startActivity({
        action: 'android.intent.action.VIEW',
        data: 'file://' + localUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
      showToast('APK downloaded. Please confirm installation.');
    } catch (e) {
      showToast('Failed to download or install APK.');
    }
    setActionLoading(false);
    setTimeout(checkInstalled, 3000); // Re-check after a short delay
  };

  // Real APK open
  const handleOpen = async () => {
    if (Platform.OS === 'android' && app.name === 'Plug Wallet') {
      const scheme = (globalThis as any).plugWalletScheme;
      if (scheme) {
        console.log('Opening Plug Wallet with scheme:', scheme);
        Linking.openURL(scheme);
        return;
      }
      if (app.packageName) {
        // Try to open via package (custom dev build)
        try {
          IntentLauncher.startApp({ packageName: app.packageName });
          return;
        } catch (e) {
          console.log('IntentLauncher.startApp error:', e);
        }
      }
      // Fallback to Play Store
      Linking.openURL('https://play.google.com/store/apps/details?id=co.psychedelic.plug');
      return;
    }
    // Default open logic for other apps
    if (app.website) {
      Linking.openURL(app.website);
    }
  };

  // Real APK uninstall
  const handleUninstall = async () => {
    if (Platform.OS !== 'android') {
      showToast('Uninstall is only supported on Android.');
      return;
    }
    if (!app.packageName) {
      showToast('No package name provided.');
      return;
    }
    try {
      IntentLauncher.startActivity({
        action: IntentConstant.ACTION_DELETE,
        data: `package:${app.packageName}`,
      });
      setTimeout(checkInstalled, 3000);
    } catch (e) {
      showToast('Failed to uninstall app.');
    }
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
    if (installed) {
      handleUninstall();
    } else {
      handleInstall();
    }
  };

  const handleLaunch = () => {
    if (app.website) {
      Linking.openURL(app.website);
    }
  };

  const handleAddReview = async () => {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    const newReview = {
      text: reviewText,
      rating: reviewRating,
      date: new Date().toISOString(),
      avatar: getRandomAvatar(reviewText + Date.now()),
      reported: false,
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updatedReviews));
    // Simulate remote POST
    try {
      await axios.post(`${REMOTE_REVIEWS_URL}/${encodeURIComponent(app.name)}`, newReview);
    } catch (e) {}
    setReviewText('');
    setReviewRating(5);
    setReviewModalVisible(false);
    setReviewSubmitting(false);
  };

  const handleReportReview = async (idx: number) => {
    const updated = [...reviews];
    updated[idx].reported = true;
    setReviews(updated);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  };

  const handleUnhideReview = async (idx: number) => {
    const updated = [...reviews];
    updated[idx].reported = false;
    setReviews(updated);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : (app.rating || 0).toFixed(1);

  const screenshots = app.screenshots && app.screenshots.length > 0 ? app.screenshots : [null];

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH * 0.8));
    setCarouselIndex(index);
  };

  let installLabel = 'Install';
  if (!app.apkUrl) installLabel = 'No Download';
  else if (!app.apkUrl.endsWith('.apk')) {
    if (app.apkUrl.includes('play.google.com')) installLabel = 'Install from Play Store';
    else installLabel = 'Open in Browser';
  }

  return (
    <View style={styles.gradientBg}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        {/* App Icon with Gradient */}
        <View style={styles.iconGradientWrap}>
          <View style={styles.iconGradient} />
          <View style={styles.iconOuterCircle}>
            <Animated.View style={{ opacity: iconOpacity }}>
              <View style={styles.iconBorder}>
                <Image
                  source={(() => {
                    let iconSource;
                    if (app.icon && imageMap[app.icon]) {
                      iconSource = imageMap[app.icon];
                    } else if (app.icon && app.icon.startsWith('http')) {
                      iconSource = { uri: app.icon };
                    } else if (screenshots[0] && imageMap[screenshots[0]]) {
                      iconSource = imageMap[screenshots[0]];
                    } else if (screenshots[0]) {
                      iconSource = { uri: screenshots[0] };
                    } else {
                      iconSource = PLACEHOLDER_IMAGE;
                    }
                    return iconSource;
                  })()}
                  style={styles.appIcon}
                  resizeMode="cover"
                  accessibilityLabel={`${app.name} icon`}
                />
              </View>
            </Animated.View>
          </View>
        </View>
        {/* Screenshot Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.screenshotRow}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {screenshots.map((src: string | null, idx: number) => {
            let imageSource;
            if (src && imageMap[src]) {
              imageSource = imageMap[src];
            } else if (src) {
              imageSource = { uri: src };
            } else {
              imageSource = PLACEHOLDER_IMAGE;
            }
            return (
              <Animated.Image
                key={idx}
                source={imageSource}
                style={[styles.screenshot, { opacity: carouselOpacities[idx] }]}
                resizeMode="cover"
                accessibilityLabel={`${app.name} screenshot ${idx + 1}`}
              />
            );
          })}
        </ScrollView>
        {/* Carousel Dots */}
        <View style={styles.carouselDots}>
          {screenshots.map((_: string | null, idx: number) => (
            <View
              key={idx}
              style={[styles.dot, carouselIndex === idx && styles.dotActive]}
              accessibilityLabel={carouselIndex === idx ? 'Current screenshot' : 'Screenshot dot'}
            />
          ))}
        </View>
        {/* Divider */}
        <View style={styles.divider} />
        {/* App Card */}
        <View style={styles.infoCard}>
          <Text style={styles.header} accessibilityLabel={`App name: ${app.name}`}>{app.name}</Text>
          <Text style={styles.subtitle}>{app.subtitle || 'Mini App'}</Text>
          {app.developer && (
            <Text style={styles.metaText} accessibilityLabel={`Developer: ${app.developer}`}>By {app.developer}</Text>
          )}
          {app.version && (
            <Text style={styles.metaText} accessibilityLabel={`Version: ${app.version}`}>Version {app.version}</Text>
          )}
          {app.lastUpdated && (
            <Text style={styles.metaText} accessibilityLabel={`Last updated: ${app.lastUpdated}`}>Last updated: {app.lastUpdated}</Text>
          )}
          <Text style={styles.desc}>{app.description}</Text>
          <View style={styles.tagsRow}>
            {app.tags.map((tag: string) => (
              <View key={tag} style={styles.tag} accessibilityLabel={`Tag: ${tag}`}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          {app.website && (
            <TouchableOpacity style={styles.launchBtn} onPress={handleLaunch} accessibilityLabel="Open app website" activeOpacity={0.85}>
              <MaterialCommunityIcons name="open-in-new" size={18} color="#4285f4" style={{ marginRight: 6 }} />
              <Text style={styles.launchBtnText}>Open Website</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Add status badge rendering above the install/uninstall button */}
        {Platform.OS === 'android' && (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            {app.packageName ? (
              installed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 2 }}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#43a047" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#43a047', fontWeight: '600', fontSize: 15 }}>Installed</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 2 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#e53935" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#e53935', fontWeight: '600', fontSize: 15 }}>Not Installed</Text>
                </View>
              )
            ) : app.apkUrl && app.apkUrl.includes('play.google.com') ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3eafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 2 }}>
                <MaterialCommunityIcons name="google-play" size={18} color="#4285f4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#4285f4', fontWeight: '600', fontSize: 15 }}>Available on Play Store</Text>
              </View>
            ) : app.apkUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3eafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 2 }}>
                <MaterialCommunityIcons name="web" size={18} color="#4285f4" style={{ marginRight: 6 }} />
                <Text style={{ color: '#4285f4', fontWeight: '600', fontSize: 15 }}>Web App</Text>
              </View>
            ) : null}
          </View>
        )}
        {/* Install/Uninstall/Open Button */}
        <Animated.View style={{ width: '88%', marginTop: 18, transform: [{ scale: buttonScale }] }}>
          {Platform.OS === 'android' ? (
            app.packageName && installed ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonUninstall, styles.buttonShadow, { flex: 1 }]}
                  onPress={handleUninstall}
                  disabled={loading || actionLoading}
                  accessibilityLabel={'Uninstall app'}
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <MaterialCommunityIcons name="delete" size={22} color="#fff" style={{ marginRight: 10 }} />
                  )}
                  <Text style={styles.buttonText}>Uninstall</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonInstall, styles.buttonShadow, { flex: 1 }]}
                  onPress={handleOpen}
                  accessibilityLabel={'Open app'}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="open-in-new" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.buttonText}>Open</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonInstall, styles.buttonShadow]}
                onPress={handleInstall}
                disabled={loading || actionLoading}
                accessibilityLabel={'Install app'}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <MaterialCommunityIcons name="download" size={22} color="#fff" style={{ marginRight: 10 }} />
                )}
                <Text style={styles.buttonText}>{installLabel}</Text>
                {actionLoading && (
                  <Text style={{ color: '#fff', marginLeft: 8, fontSize: 13 }}>{Math.round(downloadProgress * 100)}%</Text>
                )}
              </TouchableOpacity>
            )
          ) : (
            <Text style={{ color: '#b71c1c', fontWeight: 'bold', textAlign: 'center', fontSize: 16, marginVertical: 12 }}>
              APK install/open/uninstall is only supported on Android.
            </Text>
          )}
        </Animated.View>
        {/* Reviews & Ratings */}
        <View style={styles.reviewsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.ratingValue}>{averageRating}</Text>
            <View style={{ flexDirection: 'row', marginLeft: 4 }}>
              {[1,2,3,4,5].map(i => (
                <MaterialCommunityIcons
                  key={i}
                  name={i <= Math.round(averageRating) ? 'star' : 'star-outline'}
                  size={20}
                  color="#fbc02d"
                  accessibilityLabel={i <= Math.round(averageRating) ? 'Filled star' : 'Empty star'}
                />
              ))}
            </View>
            <Text style={styles.reviewsCount} accessibilityLabel={`Number of reviews: ${reviews.length}`}>({reviews.length} reviews)</Text>
            <TouchableOpacity style={styles.addReviewBtn} onPress={() => setReviewModalVisible(true)} accessibilityLabel="Add review">
              <MaterialCommunityIcons name="plus-circle" size={20} color="#4285f4" />
              <Text style={styles.addReviewText}>Add Review</Text>
            </TouchableOpacity>
          </View>
          {reviews.length === 0 && <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>}
          {reviews.map((r: any, idx: number) =>
            r.reported ? (
              <TouchableOpacity key={idx} onLongPress={() => handleUnhideReview(idx)} style={styles.reviewItem} accessibilityLabel="Hidden review (long press to unhide)">
                <Text style={styles.reviewText}>(This review has been reported and hidden. Long press to unhide.)</Text>
              </TouchableOpacity>
            ) : (
              <View key={idx} style={styles.reviewItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Image source={{ uri: r.avatar || getRandomAvatar(r.text + r.date) }} style={styles.reviewAvatar} accessibilityLabel="Reviewer avatar" />
                  {[1,2,3,4,5].map(i => (
                    <MaterialCommunityIcons
                      key={i}
                      name={i <= r.rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#fbc02d"
                    />
                  ))}
                  <Text style={styles.reviewDate}>{new Date(r.date).toLocaleDateString()}</Text>
                  <TouchableOpacity style={styles.reportBtn} onPress={() => handleReportReview(idx)} accessibilityLabel="Report review">
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#e53935" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
              </View>
            )
          )}
        </View>
        {/* Review Modal */}
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Review</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setReviewRating(i)}>
                    <MaterialCommunityIcons
                      name={i <= reviewRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#fbc02d"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                maxLength={300}
                accessibilityLabel="Review text input"
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonInstall, { marginTop: 18, width: '100%' }]}
                onPress={handleAddReview}
                disabled={reviewSubmitting || !reviewText.trim()}
                accessibilityLabel="Submit review"
              >
                {reviewSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setReviewModalVisible(false)} accessibilityLabel="Close review modal">
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  iconRow: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 18,
  },
  appIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  screenshotRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 0,
    marginTop: 0,
    width: '100%',
    minHeight: SCREEN_WIDTH * 0.4,
  },
  screenshot: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#f0f0f0',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bbb',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4285f4',
  },
  desc: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    paddingHorizontal: 24,
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
    fontSize: 13,
    color: '#4285f4',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#43a047',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonInstall: {
    backgroundColor: '#43a047',
  },
  buttonUninstall: {
    backgroundColor: '#e53935',
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 36,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 18,
    alignSelf: 'center',
  },
  buttonShadow: {
    shadowColor: '#43a047',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconGradientWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 8,
    width: 120,
    height: 120,
  },
  iconGradient: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(66,133,244,0.10)',
    top: 0,
    left: 0,
  },
  iconOuterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconBorder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#e3eafc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginTop: 10,
    marginBottom: 10,
    width: '88%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
    marginTop: -2,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  launchBtnText: {
    color: '#4285f4',
    fontSize: 15,
    fontWeight: '600',
  },
  gradientBg: {
    flex: 1,
    backgroundColor: 'linear-gradient(180deg, #f7f8fa 0%, #e3eafc 100%)',
  },
  reviewsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    marginBottom: 10,
    width: '88%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  reviewsCount: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addReviewText: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noReviews: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 8,
  },
  reviewItem: {
    marginTop: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    width: '100%',
  },
  reviewDate: {
    fontSize: 12,
    color: '#bbb',
    marginLeft: 10,
  },
  reviewText: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '88%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  reviewInput: {
    width: '100%',
    minHeight: 60,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafbfc',
    marginBottom: 8,
  },
  modalCloseBtn: {
    marginTop: 10,
  },
  modalCloseText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  reportBtn: {
    marginLeft: 8,
    padding: 2,
  },
});

export default AppDetailScreen; 