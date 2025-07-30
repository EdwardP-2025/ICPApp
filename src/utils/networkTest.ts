export async function testICNetworkConnectivity() {
  console.log('🌐 Testing IC Network Connectivity...');
  
  const testUrls = [
    'https://ic0.app',
    'https://ic0.app/api/v2/status'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing connection to: ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ${url} - Status: ${response.status}, Time: ${responseTime}ms`);
      
      results.push({
        url,
        status: response.status,
        responseTime,
        success: response.ok
      });
      
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      results.push({
        url,
        status: 'error',
        responseTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log('🌐 Network Test Results:', results);
  return results;
}

export async function testICLedgerQuery() {
  console.log('📊 Testing IC Ledger Query...');
  
  try {
    const testPrincipal = 'aaaaa-aa-demo-address-12345';
    const accountId = '0000000000000000000000000000000000000000000000000000000000000000';
    
    const queryBody = {
      request_type: 'read_state',
      sender: '2vxsx-fae',
      paths: [
        [
          {
            canister_id: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
            key: 'account_balance',
            path: [accountId]
          }
        ]
      ]
    };
    
    console.log('Query body:', JSON.stringify(queryBody, null, 2));
    
    const response = await fetch('https://ic0.app/api/v2/canister/ryjl3-tyaaa-aaaaa-aaaba-cai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Success response:', JSON.stringify(data, null, 2));
    
    return {
      success: true,
      data
    };
    
  } catch (error) {
    console.log('❌ IC Ledger Query failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 