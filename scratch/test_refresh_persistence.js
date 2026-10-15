const axios = require('axios');

async function testPersistence() {
  console.log('=== TESTING PROXY AND SESSION PERSISTENCE ===');
  const baseURL = 'http://localhost:5173'; // Testing directly through Vite proxy!

  const testEmail = `persist_user_${Date.now()}@example.com`;
  const testCustomer = {
    fullName: 'Persistent User',
    email: testEmail,
    password: 'password123',
    phone: '+1 555-987-6543'
  };

  try {
    // 1. Register through Vite proxy
    console.log(`\n1. Registering user via Vite proxy (${baseURL}/customers/register)...`);
    const regRes = await axios.post(`${baseURL}/customers/register`, testCustomer);
    console.log('Register status:', regRes.status);

    // 2. Login through Vite proxy
    console.log(`\n2. Logging in via Vite proxy (${baseURL}/customers/login)...`);
    const loginRes = await axios.post(`${baseURL}/customers/login`, {
      email: testEmail,
      password: testCustomer.password
    });
    console.log('Login status:', loginRes.status);
    console.log('Login customer returned:', loginRes.data.customer?.fullName);

    const cookies = loginRes.headers['set-cookie'];
    console.log('Cookies returned from proxy:', cookies);
    if (!cookies || !cookies.some(c => c.includes('token='))) {
      throw new Error('No cookie received via proxy');
    }
    const tokenCookie = cookies.find(c => c.includes('token=')).split(';')[0];

    // 3. Simulating page refresh by calling /customers/me with the cookie
    console.log(`\n3. Simulating page refresh: calling GET ${baseURL}/customers/me with cookie...`);
    const meRes = await axios.get(`${baseURL}/customers/me`, {
      headers: {
        Cookie: tokenCookie
      }
    });
    console.log('Profile status on simulated refresh:', meRes.status);
    console.log('Customer data retrieved:', meRes.data.fullName, meRes.data.email);

    if (meRes.data.email !== testEmail) {
      throw new Error('Customer data does not match!');
    }

    // 4. Test proxy on /products
    console.log(`\n4. Testing GET ${baseURL}/products via Vite proxy...`);
    const productsRes = await axios.get(`${baseURL}/products`);
    console.log('Products status:', productsRes.status, 'Count:', productsRes.data.count);

    console.log('\n>>> SESSION PERSISTENCE & PROXY VERIFIED SUCCESSFULLY! <<<');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message, error.response?.data || '');
    process.exit(1);
  }
}

testPersistence();
