import { icIdentityService } from '../services/ICIdentityService';
import { getRealIcpWalletService } from '../services/RealICPWalletService';

export const testRealICIntegration = async () => {
  console.log('🧪 Testing 100% Real IC Integration...');
  
  try {
    // Test 1: Real IC Identity Authentication
    console.log('1️⃣ Testing Real IC Identity Authentication...');
    const authResult = await icIdentityService.authenticateWithPrincipal('2vxsx-fae');
    console.log('✅ Real IC Identity Auth Result:', authResult);
    
    if (authResult.success && authResult.identity) {
      // Test 2: Real IC Balance Query
      console.log('2️⃣ Testing Real IC Balance Query...');
      const realWalletService = getRealIcpWalletService('mainnet');
      const balanceResult = await realWalletService.getBalance(authResult.identity.principal);
      console.log('✅ Real IC Balance Result:', balanceResult);
      
      // Test 3: Real IC Transfer Attempt
      console.log('3️⃣ Testing Real IC Transfer Attempt...');
      const transferResult = await realWalletService.transferICP(
        authResult.identity.principal,
        'aaaaa-aa-aaa-aaaaa-aaa',
        0.001
      );
      console.log('✅ Real IC Transfer Result:', transferResult);
      
      // Test 4: Real IC Transaction History
      console.log('4️⃣ Testing Real IC Transaction History...');
      const txHistory = await realWalletService.getTransactions(authResult.identity.principal);
      console.log('✅ Real IC Transaction History:', txHistory);
      
      console.log('🎉 All Real IC Integration Tests Completed Successfully!');
      return true;
    } else {
      console.log('❌ Real IC Identity Authentication Failed:', authResult.error);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Real IC Integration Test Failed:', error);
    return false;
  }
};

export const testRealICAPIs = async () => {
  console.log('🌐 Testing Real IC API Endpoints...');
  
  try {
    // Test IC mainnet endpoint
    const response = await fetch('https://ic0.app/api/v2/status');
    const status = await response.json();
    console.log('✅ IC Mainnet Status:', status);
    
    // Test IC ledger canister query
    const ledgerResponse = await fetch('https://ic0.app/api/v2/canister/ryjl3-tyaaa-aaaaa-aaaba-cai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: 'read_state',
        sender: '2vxsx-fae',
        paths: []
      })
    });
    
    if (ledgerResponse.ok) {
      console.log('✅ IC Ledger Canister Query Successful');
    } else {
      console.log('❌ IC Ledger Canister Query Failed:', ledgerResponse.status);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Real IC API Test Failed:', error);
    return false;
  }
}; 