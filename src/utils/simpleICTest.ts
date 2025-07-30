import { getRealIcpWalletService } from '../services/RealICPWalletService';

export async function testSimpleICImplementation() {
  console.log('🧪 Testing Simple IC Implementation...');
  
  const realService = getRealIcpWalletService('mainnet');
  
  // Test principal - using a valid format
  const testPrincipal = 'aaaaa-aa-aaaaa-aaaaa';
  
  try {
    // Test 1: Validate principal
    console.log('🔍 Testing principal validation...');
    const isValidPrincipal = realService.isValidPrincipal(testPrincipal);
    console.log('✅ Principal validation:', isValidPrincipal);
    
    // Test 2: Validate address
    console.log('🔍 Testing address validation...');
    const isValidAddress = realService.isValidAddress(testPrincipal);
    console.log('✅ Address validation:', isValidAddress);
    
    // Test 3: Get real balance
    console.log('📊 Testing real balance fetch...');
    const balanceResult = await realService.getRealBalance(testPrincipal);
    console.log('✅ Balance result:', balanceResult);
    
    // Test 4: Get real transactions
    console.log('📜 Testing real transaction fetch...');
    const transactions = await realService.getRealTransactions(testPrincipal);
    console.log('✅ Transactions count:', transactions.length);
    console.log('✅ Sample transaction:', transactions[0]);
    
    // Test 5: Get ICP price
    console.log('💰 Testing ICP price fetch...');
    const icpPrice = await realService.getICPUSDPrice();
    console.log('✅ ICP Price (USD):', icpPrice);
    
    // Test 6: Get transaction fee
    console.log('💸 Testing transaction fee...');
    const fee = realService.getTransactionFee();
    console.log('✅ Transaction fee:', fee);
    
    console.log('🎉 All simple IC tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Simple IC test failed:', error);
    return false;
  }
}

export function testSimpleTransferSimulation() {
  console.log('🧪 Testing Simple Transfer Simulation...');
  
  const realService = getRealIcpWalletService('mainnet');
  const testPrincipal = 'aaaaa-aa-aaaaa-aaaaa';
  const testRecipient = 'bbbbb-bb-bbbbb-bbbbb';
  const testAmount = 0.1;
  
  return realService.transferICP(testPrincipal, testRecipient, testAmount)
    .then(result => {
      console.log('✅ Transfer simulation result:', result);
      return result;
    })
    .catch(error => {
      console.error('❌ Transfer simulation failed:', error);
      return { success: false, error: error.message };
    });
} 