const fs = require('fs');
const path = './node_modules/react-native-intent-launcher/android/build.gradle';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/compile /g, 'implementation ');
  fs.writeFileSync(path, content, 'utf8');
} else {
  console.log('build.gradle not found, skipping patch.');
}
