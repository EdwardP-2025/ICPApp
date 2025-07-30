declare const global: any;

export function testAppInitialization() {
  console.log('🧪 Testing App Initialization...');
  
  try {
    // Test 1: Check if polyfills are loaded
    console.log('✅ Testing polyfills...');
    console.log('URL:', typeof global.URL);
    console.log('TextEncoder:', typeof global.TextEncoder);
    console.log('Buffer:', typeof global.Buffer);
    console.log('btoa:', typeof global.btoa);
    console.log('atob:', typeof global.atob);
    console.log('fetch:', typeof global.fetch);
    
    // Test 2: Check if URL.hostname works
    console.log('✅ Testing URL.hostname...');
    const testUrl = new URL('https://ic0.app/api/v2/status');
    console.log('URL hostname:', testUrl.hostname);
    console.log('URL host:', testUrl.host);
    console.log('URL protocol:', testUrl.protocol);
    
    // Test 3: Check if Base64 encoding works
    console.log('✅ Testing Base64 encoding...');
    const testString = 'Hello World';
    const encoded = global.btoa(testString);
    const decoded = global.atob(encoded);
    console.log('Original:', testString);
    console.log('Encoded:', encoded);
    console.log('Decoded:', decoded);
    console.log('Match:', testString === decoded);
    
    console.log('🎉 App initialization test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ App initialization test failed:', error);
    return false;
  }
}

export function testNetworkConnectivity() {
  console.log('🌐 Testing Network Connectivity...');
  
  return fetch('https://ic0.app/api/v2/status')
    .then(response => {
      console.log('✅ Network test successful:', response.status);
      return true;
    })
    .catch(error => {
      console.error('❌ Network test failed:', error);
      return false;
    });
} 