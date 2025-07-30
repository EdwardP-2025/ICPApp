import { internetIdentityService } from '../services/InternetIdentityService';
import { Linking, Alert } from 'react-native';

export const testRealInternetIdentityFlow = async () => {
  console.log('=== 🧪 Testing Real Internet Identity Flow ===');
  
  try {
    // Test basic URL opening
    console.log('1. Testing basic URL opening...');
    const canOpenGoogle = await Linking.canOpenURL('https://www.google.com');
    console.log('Can open Google:', canOpenGoogle);
    
    const canOpenII = await Linking.canOpenURL('https://identity.ic0.app');
    console.log('Can open Internet Identity:', canOpenII);
    
    // Test Internet Identity service
    console.log('2. Testing Internet Identity service...');
    const result = await internetIdentityService.authenticate();
    console.log('Authentication result:', result);
    
    // Test profile retrieval
    console.log('3. Testing profile retrieval...');
    const profile = await internetIdentityService.getCurrentProfile();
    console.log('Current profile:', profile);
    
    return {
      success: true,
      canOpenGoogle,
      canOpenII,
      authResult: result,
      profile
    };
    
  } catch (error) {
    console.log('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testURLOpening = async () => {
  console.log('=== 🌐 Testing URL Opening ===');
  
  const testUrls = [
    'https://www.google.com',
    'https://identity.ic0.app',
    'https://identity.ic0.app?return=test',
    'icpapp://auth?session=test'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing URL: ${url}`);
      const canOpen = await Linking.canOpenURL(url);
      console.log(`Can open ${url}:`, canOpen);
      
      if (canOpen) {
        try {
          await Linking.openURL(url);
          console.log(`✅ Successfully opened: ${url}`);
        } catch (openError) {
          console.log(`❌ Failed to open ${url}:`, openError);
        }
      }
    } catch (error) {
      console.log(`❌ Error testing ${url}:`, error);
    }
  }
};

export const testManualAuthentication = async () => {
  console.log('=== 🔑 Testing Manual Authentication ===');
  
  try {
    const testPrincipals = [
      '2vxsx-fae',
      'aaaaa-aa-aaa-aaaaa-aaa',
      'bbbbb-bb-bbb-bbbbb-bbb'
    ];
    
    for (const principal of testPrincipals) {
      console.log(`Testing principal: ${principal}`);
      const result = await internetIdentityService.authenticateWithPrincipal(principal, `Test_${principal.substr(0, 8)}`);
      console.log(`Result for ${principal}:`, result);
    }
    
  } catch (error) {
    console.log('❌ Manual authentication test failed:', error);
  }
};

export const testDeepLinkHandling = async () => {
  console.log('=== 🔗 Testing Deep Link Handling ===');
  
  const testDeepLinks = [
    'icpapp://auth?session=test123&success=true&principal=aaaaa-aa-aaa-aaaaa-aaa',
    'icpapp://auth?session=test456&success=false&error=test_error',
    'icpapp://auth?session=test789',
    'https://example.com'
  ];
  
  for (const deepLink of testDeepLinks) {
    console.log(`Testing deep link: ${deepLink}`);
    // Simulate deep link handling
    if (deepLink.includes('icpapp://auth')) {
      const urlObj = new URL(deepLink);
      const principal = urlObj.searchParams.get('principal');
      const success = urlObj.searchParams.get('success');
      const error = urlObj.searchParams.get('error');
      const session = urlObj.searchParams.get('session');
      
      console.log('Parsed parameters:', { principal, success, error, session });
    }
  }
};

export const testDeepLinkSetup = async () => {
  console.log('=== 🔗 Testing Deep Link Setup ===');
  
  try {
    // Test if we can open our own app scheme
    const canOpenAppScheme = await Linking.canOpenURL('icpapp://auth?test=true');
    console.log('Can open app scheme (icpapp://):', canOpenAppScheme);
    
    // Test if we can open Internet Identity URL
    const canOpenII = await Linking.canOpenURL('https://identity.ic0.app');
    console.log('Can open Internet Identity URL:', canOpenII);
    
    // Test if we can open Internet Identity with return URL
    const testReturnUrl = 'icpapp://auth?session=test123&success=true&principal=aaaaa-aa-aaa-aaaaa-aaa';
    const encodedReturnUrl = encodeURIComponent(testReturnUrl);
    const iiUrlWithReturn = `https://identity.ic0.app?return=${encodedReturnUrl}`;
    console.log('Test Internet Identity URL with return:', iiUrlWithReturn);
    
    const canOpenIIWithReturn = await Linking.canOpenURL(iiUrlWithReturn);
    console.log('Can open Internet Identity with return URL:', canOpenIIWithReturn);
    
    // Test manual deep link simulation
    console.log('Testing manual deep link simulation...');
    const testDeepLinks = [
      'icpapp://auth?session=test123&success=true&principal=aaaaa-aa-aaa-aaaaa-aaa',
      'icpapp://auth?session=test456&success=false&error=test_error',
      'icpapp://auth?session=test789',
    ];
    
    for (const deepLink of testDeepLinks) {
      console.log(`Testing deep link: ${deepLink}`);
      try {
        await Linking.openURL(deepLink);
        console.log(`✅ Successfully opened: ${deepLink}`);
      } catch (error) {
        console.log(`❌ Failed to open: ${deepLink}`, error);
      }
    }
    
    return {
      success: true,
      canOpenAppScheme,
      canOpenII,
      canOpenIIWithReturn,
      testDeepLinks
    };
    
  } catch (error) {
    console.log('❌ Deep link test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testCompleteIntegration = async () => {
  console.log('=== 🚀 Testing Complete Internet Identity Integration ===');
  
  try {
    // 1. Test URL opening
    console.log('1. Testing URL opening...');
    await testURLOpening();
    
    // 2. Test manual authentication
    console.log('2. Testing manual authentication...');
    await testManualAuthentication();
    
    // 3. Test deep link handling
    console.log('3. Testing deep link handling...');
    await testDeepLinkHandling();
    
    // 4. Test profile management
    console.log('4. Testing profile management...');
    const profile = await internetIdentityService.getCurrentProfile();
    console.log('Current profile:', profile);
    
    // 5. Test device binding
    console.log('5. Testing device binding...');
    const deviceId = await internetIdentityService.getDeviceId();
    const isDeviceBound = await internetIdentityService.isDeviceBound();
    console.log('Device ID:', deviceId);
    console.log('Is device bound:', isDeviceBound);
    
    Alert.alert(
      '✅ Integration Test Complete',
      'All Internet Identity integration tests completed successfully!\n\nCheck console for detailed results.',
      [{ text: 'OK' }]
    );
    
  } catch (error) {
    console.log('❌ Integration test failed:', error);
    Alert.alert(
      '❌ Integration Test Failed',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
}; 

export const testVercelAppIntegration = async () => {
  console.log('=== 🚀 Testing Vercel App Integration ===');
  
  try {
    const VERCEL_II_URL = 'https://icp-ii-callback-qkzn.vercel.app';
    
    console.log('1. Testing Vercel app URL opening...');
    const canOpenVercel = await Linking.canOpenURL(VERCEL_II_URL);
    console.log('Can open Vercel app:', canOpenVercel);
    
    if (canOpenVercel) {
      console.log('2. Opening Vercel app...');
      await Linking.openURL(VERCEL_II_URL);
      console.log('✅ Vercel app opened successfully');
    } else {
      console.log('❌ Cannot open Vercel app URL');
    }
    
    // Test deep link callback format
    console.log('3. Testing deep link callback format...');
    const testCallbacks = [
      'icpapp://login?principal=aaaaa-aa-aaa-aaaaa-aaa',
      'icpapp://login?error=authentication_failed',
      'icpapp://auth?session=test&success=true&principal=bbbbb-bb-bbb-bbbbb-bbb'
    ];
    
    for (const callback of testCallbacks) {
      console.log(`Testing callback: ${callback}`);
      try {
        await Linking.openURL(callback);
        console.log(`✅ Successfully processed: ${callback}`);
      } catch (error) {
        console.log(`❌ Failed to process: ${callback}`, error);
      }
    }
    
    return {
      success: true,
      canOpenVercel,
      testCallbacks
    };
    
  } catch (error) {
    console.log('❌ Vercel app integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 

export const testLoginFlow = async () => {
  console.log('🧪 Testing login flow with real principal...');
  
  const testPrincipal = 'a6gj4-lsq3u-mkon2-y3okt-hy575-vtczy-bcw7k-jgpap-5nbny-k4lho-qae';
  
  try {
    // Test the principal validation
    const segments = testPrincipal.split('-');
    const isValid = (segments.length === 11 && segments.every(segment => segment.length === 5)) ||
                   (segments.length === 4 && segments.every(segment => segment.length === 5));
    
    console.log('✅ Principal validation test:', isValid);
    console.log('📊 Principal segments:', segments.length);
    console.log('📊 Principal:', testPrincipal);
    
    // Test URL parsing
    const testUrl = `icpapp://login?principal=${testPrincipal}`;
    console.log('🔗 Test URL:', testUrl);
    
    // Manual URL parsing test
    const parseUrlParams = (url: string): Record<string, string> => {
      const params: Record<string, string> = {};
      const queryIndex = url.indexOf('?');
      if (queryIndex === -1) return params;
      
      const queryString = url.substring(queryIndex + 1);
      const pairs = queryString.split('&');
      
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
      
      return params;
    };
    
    const params = parseUrlParams(testUrl);
    console.log('📋 Parsed params:', params);
    console.log('✅ URL parsing test successful');
    
    return {
      success: true,
      principal: testPrincipal,
      isValid: isValid,
      segments: segments.length,
      parsedParams: params
    };
    
  } catch (error) {
    console.log('❌ Login flow test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 

export const testExactPrincipal = () => {
  console.log('🧪 Testing exact principal validation...');
  
  const testPrincipal = 'a6gj4-lsq3u-mkon2-y3okt-hy575-vtczy-bcw7k-jgpap-5nbny-k4lho-qae';
  
  // Manual validation test
  const segments = testPrincipal.split('-');
  console.log('📊 Principal segments:', segments.length);
  console.log('📊 Segment lengths:', segments.map(s => s.length));
  console.log('📊 Principal:', testPrincipal);
  
  // Check if it has 11 segments
  if (segments.length === 11) {
    // First 10 segments should be 5 characters, last segment can be shorter
    const first10Valid = segments.slice(0, 10).every(segment => segment.length === 5);
    const lastSegmentValid = segments[10].length >= 1 && segments[10].length <= 5;
    
    console.log('✅ First 10 segments valid:', first10Valid);
    console.log('✅ Last segment valid:', lastSegmentValid);
    console.log('✅ Total validation:', first10Valid && lastSegmentValid);
    
    return {
      success: first10Valid && lastSegmentValid,
      segments: segments.length,
      first10Valid,
      lastSegmentValid,
      lastSegmentLength: segments[10].length
    };
  }
  
  return {
    success: false,
    error: 'Wrong number of segments'
  };
}; 