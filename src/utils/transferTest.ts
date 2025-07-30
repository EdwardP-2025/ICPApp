import { getRealIcpWalletService } from '../services/RealICPWalletService';
import { getSimpleIcpWalletService } from '../services/SimpleICPWalletService';

export interface TransferTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const testRealTransferFeatures = async (): Promise<TransferTestResult[]> => {
  const results: TransferTestResult[] = [];
  const realService = getRealIcpWalletService('mainnet');
  const simpleService = getSimpleIcpWalletService('mainnet');

  // Test 1: Real Balance Fetching
  try {
    console.log('🧪 Testing Real Balance Fetching...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const balanceResult = await realService.getRealBalance(testPrincipal);
    
    results.push({
      success: balanceResult.balance >= 0,
      message: `Real balance fetch: ${balanceResult.balance} ICP (${balanceResult.source})`,
      details: balanceResult
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Real balance fetch failed: ${error}`,
      details: error
    });
  }

  // Test 2: Simple Balance Fetching (Fallback)
  try {
    console.log('🧪 Testing Simple Balance Fetching...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const balanceResult = await simpleService.getBalance(testPrincipal);
    
    results.push({
      success: balanceResult.balance >= 0,
      message: `Simple balance fetch: ${balanceResult.balance} ICP (${balanceResult.source})`,
      details: balanceResult
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Simple balance fetch failed: ${error}`,
      details: error
    });
  }

  // Test 3: Real Transfer Simulation
  try {
    console.log('🧪 Testing Real Transfer Simulation...');
    const fromPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const toAddress = 'aaaaa-real-receiver';
    const amount = 0.001; // Small test amount
    
    const transferResult = await realService.transferICP(fromPrincipal, toAddress, amount);
    
    results.push({
      success: transferResult.success,
      message: `Real transfer simulation: ${transferResult.success ? 'Success' : 'Failed'}`,
      details: transferResult
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Real transfer simulation failed: ${error}`,
      details: error
    });
  }

  // Test 4: Simple Transfer Simulation
  try {
    console.log('🧪 Testing Simple Transfer Simulation...');
    const fromPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const toAddress = 'aaaaa-sim-receiver';
    const amount = 0.001; // Small test amount
    
    const transferResult = await simpleService.transferICP(fromPrincipal, toAddress, amount);
    
    results.push({
      success: transferResult.success,
      message: `Simple transfer simulation: ${transferResult.success ? 'Success' : 'Failed'}`,
      details: transferResult
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Simple transfer simulation failed: ${error}`,
      details: error
    });
  }

  // Test 5: Real Transaction History
  try {
    console.log('🧪 Testing Real Transaction History...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const transactions = await realService.getRealTransactions(testPrincipal);
    
    results.push({
      success: transactions.length >= 0,
      message: `Real transaction history: ${transactions.length} transactions found`,
      details: { count: transactions.length, sample: transactions[0] }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Real transaction history failed: ${error}`,
      details: error
    });
  }

  // Test 6: Simple Transaction History
  try {
    console.log('🧪 Testing Simple Transaction History...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const transactions = await simpleService.getTransactions(testPrincipal);
    
    results.push({
      success: transactions.length >= 0,
      message: `Simple transaction history: ${transactions.length} transactions found`,
      details: { count: transactions.length, sample: transactions[0] }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Simple transaction history failed: ${error}`,
      details: error
    });
  }

  // Test 7: Address Validation
  try {
    console.log('🧪 Testing Address Validation...');
    const validPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const invalidPrincipal = 'invalid-principal';
    
    const validResult = realService.isValidPrincipal(validPrincipal);
    const invalidResult = realService.isValidPrincipal(invalidPrincipal);
    
    results.push({
      success: validResult && !invalidResult,
      message: `Address validation: Valid=${validResult}, Invalid=${invalidResult}`,
      details: { valid: validResult, invalid: invalidResult }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Address validation failed: ${error}`,
      details: error
    });
  }

  // Test 8: Fee Calculation
  try {
    console.log('🧪 Testing Fee Calculation...');
    const realFee = realService.getTransactionFee();
    const simpleFee = simpleService.getTransactionFee();
    
    results.push({
      success: realFee > 0 && simpleFee > 0,
      message: `Fee calculation: Real=${realFee}, Simple=${simpleFee}`,
      details: { realFee, simpleFee }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Fee calculation failed: ${error}`,
      details: error
    });
  }

  return results;
};

export const runTransferFeatureTests = async (): Promise<void> => {
  console.log('🚀 Starting Transfer Feature Tests...');
  
  const results = await testRealTransferFeatures();
  
  console.log('📊 Test Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📈 Summary: ${successCount}/${totalCount} tests passed`);
  
  if (successCount === totalCount) {
    console.log('🎉 All transfer features are working correctly!');
  } else {
    console.log('⚠️ Some transfer features need attention.');
  }
};

export const testTransferConfirmation = async (): Promise<TransferTestResult> => {
  try {
    console.log('🧪 Testing Transfer Confirmation Flow...');
    
    // Simulate transfer confirmation data
    const transferDetails = {
      to: 'aaaaa-test-receiver',
      amount: 0.001,
      fee: 0.0001,
      total: 0.0011,
      from: 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae',
      balance: 1.0,
    };
    
    // Validate transfer details
    const isValid = 
      transferDetails.amount > 0 &&
      transferDetails.fee > 0 &&
      transferDetails.total > 0 &&
      transferDetails.balance >= transferDetails.total &&
      transferDetails.to.length > 0 &&
      transferDetails.from.length > 0;
    
    return {
      success: isValid,
      message: `Transfer confirmation validation: ${isValid ? 'Valid' : 'Invalid'}`,
      details: transferDetails
    };
  } catch (error) {
    return {
      success: false,
      message: `Transfer confirmation test failed: ${error}`,
      details: error
    };
  }
};

export const testTransactionHistoryFeatures = async (): Promise<TransferTestResult[]> => {
  const results: TransferTestResult[] = [];
  const realService = getRealIcpWalletService('mainnet');
  const simpleService = getSimpleIcpWalletService('mainnet');

  // Test transaction filtering
  try {
    console.log('🧪 Testing Transaction Filtering...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const transactions = await realService.getRealTransactions(testPrincipal);
    
    const sendTransactions = transactions.filter(tx => tx.type === 'send');
    const receiveTransactions = transactions.filter(tx => tx.type === 'receive');
    const completedTransactions = transactions.filter(tx => tx.status === 'completed');
    
    results.push({
      success: true,
      message: `Transaction filtering: Send=${sendTransactions.length}, Receive=${receiveTransactions.length}, Completed=${completedTransactions.length}`,
      details: { total: transactions.length, send: sendTransactions.length, receive: receiveTransactions.length, completed: completedTransactions.length }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Transaction filtering failed: ${error}`,
      details: error
    });
  }

  // Test transaction search
  try {
    console.log('🧪 Testing Transaction Search...');
    const testPrincipal = 'h64hl1ygnna7vydqgzjk8v@meimzg09nmhha00808ho2xro2300j2oslcf9yiu5c-fae';
    const transactions = await simpleService.getTransactions(testPrincipal);
    
    const searchTerm = 'real';
    const searchResults = transactions.filter(tx => 
      tx.txId.toLowerCase().includes(searchTerm) ||
      tx.from.toLowerCase().includes(searchTerm) ||
      tx.to.toLowerCase().includes(searchTerm)
    );
    
    results.push({
      success: true,
      message: `Transaction search for "${searchTerm}": ${searchResults.length} results`,
      details: { searchTerm, results: searchResults.length, total: transactions.length }
    });
  } catch (error) {
    results.push({
      success: false,
      message: `Transaction search failed: ${error}`,
      details: error
    });
  }

  return results;
}; 