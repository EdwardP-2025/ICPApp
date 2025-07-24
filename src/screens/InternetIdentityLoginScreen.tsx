import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const InternetIdentityLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueMessage, setIssueMessage] = useState('');

  // Internet Identity URL (production)
  const II_URL = 'https://identity.ic0.app/';
  const STATUS_URL = 'https://status.internetcomputer.org/';

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'II_LOGIN_SUCCESS') {
        // Extract principal and other data from II
        const { principal, userNumber } = data;
        login(principal);
        Alert.alert('Success', 'Successfully logged in with Internet Identity!', [
          { text: 'OK', onPress: () => navigation.navigate('Mine') }
        ]);
      } else if (data.type === 'II_LOGIN_ERROR') {
        Alert.alert('Error', 'Failed to login with Internet Identity. Please try again.');
      } else if (data.type === 'II_ISSUE_DETECTED') {
        setIssueMessage(data.message || 'There may be ongoing issues with Internet Identity.');
        setShowIssueModal(true);
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  };

  const injectJavaScript = `
    (function() {
      // Listen for II login events
      window.addEventListener('message', function(event) {
        if (event.origin !== 'https://identity.ic0.app') return;
        try {
          const data = event.data;
          if (data && data.type === 'II_LOGIN_SUCCESS') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'II_LOGIN_SUCCESS',
              principal: data.principal,
              userNumber: data.userNumber
            }));
          } else if (data && data.type === 'II_LOGIN_ERROR') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'II_LOGIN_ERROR',
              error: data.error
            }));
          }
        } catch (error) {
          // ignore
        }
      });
      // Detect "Check ongoing issues" or similar warnings in the DOM
      setInterval(function() {
        var issueNode = document.querySelector('body');
        if (issueNode && issueNode.innerText && issueNode.innerText.match(/Check ongoing issues|service disruption|maintenance|try again later/i)) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'II_ISSUE_DETECTED',
            message: 'Internet Identity may be experiencing issues. Please check the status or try again later.'
                }));
        }
      }, 2000);
      true;
    })();
  `;

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setWebViewKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(II_URL);
  };

  const handleOpenStatus = () => {
    Linking.openURL(STATUS_URL);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#b71c1c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Internet Identity Login</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <MaterialCommunityIcons name="refresh" size={24} color="#b71c1c" />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b71c1c" />
          <Text style={styles.loadingText}>Loading Internet Identity...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: II_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        injectedJavaScript={injectJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={false}
        userAgent="ICPApp/1.0"
      />

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to login:</Text>
        <Text style={styles.instructionsText}>
          1. Click "Login with Internet Identity" on the page{"\n"}
          2. Choose your authentication method (device, security key, etc.){"\n"}
          3. Complete the authentication process{"\n"}
          4. You'll be automatically logged in to the app
        </Text>
        <TouchableOpacity style={styles.openBrowserBtn} onPress={handleOpenInBrowser}>
          <MaterialCommunityIcons name="open-in-new" size={18} color="#b71c1c" />
          <Text style={styles.openBrowserText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>

      {/* Issue Modal */}
      <Modal
        visible={showIssueModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Internet Identity Issue</Text>
            <Text style={styles.modalMessage}>{issueMessage}</Text>
            <TouchableOpacity style={styles.statusBtn} onPress={handleOpenStatus}>
              <Text style={styles.statusBtnText}>Check DFINITY Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowIssueModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  webview: {
    flex: 1,
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  openBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  openBrowserText: {
    color: '#b71c1c',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b71c1c',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBtn: {
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  statusBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeBtnText: {
    color: '#b71c1c',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default InternetIdentityLoginScreen; 