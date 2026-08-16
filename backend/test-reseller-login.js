const http = require('http');

async function testResellerLogin() {
  console.log('=== Testing Reseller Login Through Customer Portal ===\n');
  
  const postData = JSON.stringify({
    identifier: 'kopparapugeetha95@gmail.com',
    password: 'Test@123', // Update if you know the actual password
    userType: 'customer'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login/password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      const parsed = JSON.parse(data);
      console.log('Response Data:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.status === 'success') {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('\nUser Details:');
        console.log('  - Role:', parsed.data.user.role);
        console.log('  - Actual Role:', parsed.data.user.actualRole);
        console.log('  - Customer ID:', parsed.data.user.customerId);
        console.log('  - Reseller ID:', parsed.data.user.resellerId);
        console.log('  - Reseller Code:', parsed.data.user.resellerCode);
        
        if (parsed.data.user.resellerId) {
          console.log('\n✅ Reseller data is included! User can access both portals.');
        } else {
          console.log('\n❌ Reseller data is missing! User cannot access reseller portal.');
        }
      } else {
        console.log('\n❌ LOGIN FAILED');
        console.log('Error:', parsed.message);
        if (parsed.code === 'INVALID_PASSWORD') {
          console.log('\nNote: Password is incorrect. Please update the script with the correct password.');
        }
      }
    });
  });

  req.on('error', (error) => {
    console.error('Test error:', error);
  });

  req.write(postData);
  req.end();
}

testResellerLogin();
