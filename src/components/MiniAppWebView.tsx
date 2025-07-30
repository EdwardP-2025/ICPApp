import React from 'react';
import { Alert, Linking } from 'react-native';

interface MiniAppWebViewProps {
  url: string;
  appName: string;
}

const MiniAppWebView: React.FC<MiniAppWebViewProps> = ({ url, appName }) => {
  const handleLaunchApp = async () => {
    let launchUrl = url;

    if (!launchUrl.startsWith('http://') && !launchUrl.startsWith('https://')) {
      launchUrl = 'https://' + launchUrl;
    }

    if (appName.toLowerCase().includes('plug')) {
      launchUrl = 'https://plugwallet.ooo';
    }

    try {
      const canOpen = await Linking.canOpenURL(launchUrl);
      
      if (canOpen) {
        await Linking.openURL(launchUrl);
        Alert.alert('Success', `${appName} launched successfully!`);
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.log('Failed to launch app:', error);
      
      const alternativeUrls = [
        launchUrl.replace('https://', 'http://'),
        launchUrl.replace('http://', 'https://'),
        `https://${launchUrl.replace(/^https?:\/\//, '')}`,
      ];

      for (const altUrl of alternativeUrls) {
        try {
          const canOpen = await Linking.canOpenURL(altUrl);
          if (canOpen) {
            await Linking.openURL(altUrl);
            Alert.alert('Success', `${appName} launched successfully!`);
            return;
          }
        } catch (altError) {
          console.log('Alternative URL failed:', altUrl, altError);
        }
      }

      Alert.alert('Error', `Failed to launch ${appName}. Please try again.`);
    }
  };

  return null;
};

export default MiniAppWebView; 