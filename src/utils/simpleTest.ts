import { getSimpleIcpWalletService } from '../services/SimpleICPWalletService';

export async function testSimpleImplementation() {
  console.log('🧪 Testing Simple ICP Implementation...');
  
  const simpleService = getSimpleIcpWalletService('mainnet');
  
  // Test principal
  const testPrincipal = 'aaaaa-aa-aaaaa-aaaaa';
  
  try {
    // Test 1: Validate principal
    console.log('🔍 Testing principal validation...');
    const isValidPrincipal = simpleService.isValidPrincipal(testPrincipal);
    console.log('✅ Principal validation:', isValidPrincipal);
    
    // Test 2: Validate address
    console.log('🔍 Testing address validation...');
    const isValidAddress = simpleService.isValidAddress(testPrincipal);
    console.log('✅ Address validation:', isValidAddress);
    
    // Test 3: Get balance
    console.log('📊 Testing balance fetch...');
    const balanceResult = await simpleService.getBalance(testPrincipal);
    console.log('✅ Balance result:', balanceResult);
    
    // Test 4: Get transactions
    console.log('📜 Testing transaction fetch...');
    const transactions = await simpleService.getTransactions(testPrincipal);
    console.log('✅ Transactions count:', transactions.length);
    console.log('✅ Sample transaction:', transactions[0]);
    
    // Test 5: Get ICP price
    console.log('💰 Testing ICP price fetch...');
    const icpPrice = await simpleService.getICPUSDPrice();
    console.log('✅ ICP Price (USD):', icpPrice);
    
    // Test 6: Get transaction fee
    console.log('💸 Testing transaction fee...');
    const fee = simpleService.getTransactionFee();
    console.log('✅ Transaction fee:', fee);
    
    console.log('🎉 All simple tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Simple test failed:', error);
    return false;
  }
}

export function testSimpleTransfer() {
  console.log('🧪 Testing Simple Transfer...');
  
  const simpleService = getSimpleIcpWalletService('mainnet');
  const testPrincipal = 'aaaaa-aa-aaaaa-aaaaa';
  const testRecipient = 'bbbbb-bb-bbbbb-bbbbb';
  const testAmount = 0.1;
  
  return simpleService.transferICP(testPrincipal, testRecipient, testAmount)
    .then(result => {
      console.log('✅ Transfer result:', result);
      return result;
    })
    .catch(error => {
      console.error('❌ Transfer failed:', error);
      return { success: false, error: error.message };
    });
}
