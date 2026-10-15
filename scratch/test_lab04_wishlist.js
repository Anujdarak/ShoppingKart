const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testWishlist() {
  console.log('=== RUNNING LAB 04 SHOPKART WISHLIST TESTS ===\n');
  const baseURL = 'http://localhost:3000';

  let testToken = null;
  let testCookie = null;
  let testProductId = null;

  try {
    // 0. Ensure server is online
    console.log('0. Checking Backend Health Check Route GET /...');
    const healthRes = await axios.get(baseURL);
    console.log('Health check status:', healthRes.status, healthRes.data.endpoints.wishlist);

    // 1. Get a valid product ID from catalog
    console.log('\n1. Fetching a product from GET /products...');
    const productsRes = await axios.get(`${baseURL}/products`);
    if (!productsRes.data.products || productsRes.data.products.length === 0) {
      throw new Error('No products found in DB to test wishlist with!');
    }
    testProductId = productsRes.data.products[0]._id;
    console.log(`Using test product ID: ${testProductId} (${productsRes.data.products[0].name})`);

    // 2. Unauthenticated Requests (Expect 401)
    console.log('\n2. Testing unauthenticated requests (Expect 401)...');
    try {
      await axios.get(`${baseURL}/wishlist`);
      throw new Error('GET /wishlist should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ GET /wishlist without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    try {
      await axios.post(`${baseURL}/wishlist/${testProductId}`);
      throw new Error('POST /wishlist/:id should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ POST /wishlist/:id without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    // 3. Register / Login a test user
    console.log('\n3. Logging in / Registering test customer...');
    const testEmail = `test_wishlist_${Date.now()}@example.com`;
    const regRes = await axios.post(`${baseURL}/customers/register`, {
      fullName: 'Wishlist Tester',
      email: testEmail,
      password: 'password123',
      phone: '9876543210'
    });
    console.log('Test customer registered:', regRes.data.customer.email);

    const loginRes = await axios.post(`${baseURL}/customers/login`, {
      email: testEmail,
      password: 'password123'
    });
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      testCookie = setCookie[0].split(';')[0];
      const match = testCookie.match(/token=([^;]+)/);
      if (match) {
        testToken = match[1];
      }
    }
    console.log('Customer logged in. Cookie obtained:', !!testCookie, 'Bearer token obtained:', !!testToken);

    const authHeaders = {
      headers: {
        Cookie: testCookie,
        Authorization: `Bearer ${testToken}`
      }
    };

    // 4. Initial Wishlist should be empty (Task 3)
    console.log('\n4. Testing GET /wishlist for fresh user (Expect 0 items)...');
    const initialWishlistRes = await axios.get(`${baseURL}/wishlist`, authHeaders);
    console.log('Initial wishlist count:', initialWishlistRes.data.count);
    if (initialWishlistRes.data.count !== 0 || !Array.isArray(initialWishlistRes.data.wishlist)) {
      throw new Error('Initial wishlist should be empty array');
    }
    console.log('✓ Initial wishlist is empty');

    // 5. Test Invalid Product ID (Expect 400)
    console.log('\n5. Testing POST /wishlist/invalid_id (Expect 400)...');
    try {
      await axios.post(`${baseURL}/wishlist/invalid123`, {}, authHeaders);
      throw new Error('Should have returned 400 for invalid ID');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ Correctly returned 400 for invalid product ID format:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 6. Test Non-existent Product ID (Expect 404)
    console.log('\n6. Testing POST /wishlist/non_existent_id (Expect 404)...');
    const fakeId = new mongoose.Types.ObjectId().toString();
    try {
      await axios.post(`${baseURL}/wishlist/${fakeId}`, {}, authHeaders);
      throw new Error('Should have returned 404 for non-existent product');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Correctly returned 404 for non-existent product:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 7. Add Product to Wishlist (Task 2 - Expect 200/201)
    console.log('\n7. Testing POST /wishlist/:productId (Valid Add)...');
    const addRes = await axios.post(`${baseURL}/wishlist/${testProductId}`, {}, authHeaders);
    console.log('Add status:', addRes.status, 'Message:', addRes.data.message);
    if ((addRes.status !== 200 && addRes.status !== 201) || !addRes.data.success) {
      throw new Error('Failed to add product to wishlist');
    }
    console.log('✓ Product added successfully');

    // 8. Prevent Duplicate Entry (Task 2 - Expect 409 Conflict)
    console.log('\n8. Testing Duplicate POST /wishlist/:productId (Expect 409)...');
    try {
      await axios.post(`${baseURL}/wishlist/${testProductId}`, {}, authHeaders);
      throw new Error('Should have returned 409 Conflict for duplicate product');
    } catch (err) {
      if (err.response?.status === 409) {
        console.log('✓ Correctly returned 409 Conflict on duplicate:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 9. Get Wishlist and verify populate() (Task 3)
    console.log('\n9. Testing GET /wishlist with populated Product data...');
    const populatedRes = await axios.get(`${baseURL}/wishlist`, authHeaders);
    console.log('Wishlist count:', populatedRes.data.count);
    const savedItem = populatedRes.data.wishlist[0];
    console.log('Populated item:', {
      _id: savedItem._id,
      name: savedItem.name,
      price: savedItem.price,
      category: savedItem.category,
      stock: savedItem.stock
    });
    if (!savedItem.name || savedItem.price === undefined || !savedItem.category) {
      throw new Error('Wishlist item was not properly populated with Product details');
    }
    console.log('✓ GET /wishlist returned properly populated Product reference');

    // 10. Remove Product from Wishlist (Task 4 - Expect 200)
    console.log('\n10. Testing DELETE /wishlist/:productId (Valid Remove)...');
    const removeRes = await axios.delete(`${baseURL}/wishlist/${testProductId}`, authHeaders);
    console.log('Remove status:', removeRes.status, 'Message:', removeRes.data.message);
    if (removeRes.status !== 200 || !removeRes.data.success) {
      throw new Error('Failed to remove product from wishlist');
    }
    console.log('✓ Product removed successfully');

    // 11. Remove non-existent/already removed product (Task 4 - Expect 404)
    console.log('\n11. Testing DELETE /wishlist/:productId when not in wishlist (Expect 404)...');
    try {
      await axios.delete(`${baseURL}/wishlist/${testProductId}`, authHeaders);
      throw new Error('Should have returned 404 when product is not in wishlist');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Correctly returned 404 for item not in wishlist:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 12. Test Bonus Toggle Endpoint (PATCH /wishlist/:productId/toggle)
    console.log('\n12. Testing Bonus PATCH /wishlist/:productId/toggle...');
    const toggle1 = await axios.patch(`${baseURL}/wishlist/${testProductId}/toggle`, {}, authHeaders);
    console.log('Toggle 1 (Add):', toggle1.data);
    if (!toggle1.data.saved) throw new Error('Toggle 1 should have saved: true');

    const toggle2 = await axios.patch(`${baseURL}/wishlist/${testProductId}/toggle`, {}, authHeaders);
    console.log('Toggle 2 (Remove):', toggle2.data);
    if (toggle2.data.saved !== false) throw new Error('Toggle 2 should have saved: false');
    console.log('✓ Wishlist toggle endpoint works both ways');

    console.log('\n=========================================');
    console.log('🎉 ALL BACKEND WISHLIST TESTS PASSED! (100/100)');
    console.log('=========================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
}

testWishlist();
