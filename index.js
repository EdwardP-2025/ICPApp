/**
 * @format
 */

import {AppRegistry} from 'react-native';

try {
  require('./src/utils/polyfills.js');
} catch (error) {
  console.log('Polyfill loading error:', error);
}

import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
