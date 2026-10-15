const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testCart() {
  console.log('=== RUNNING LAB 05 SHOPKART SHOPPING CART TESTS ===\n');
  const baseURL = 'http://localhost:3000';

  let testToken = null;
  let testCookie = null;
  let testProduct = null;
  let lowStockProduct = null;

  try {
    // 0. Ensure server is online & endpoints registered
    console.log('0. Checking Backend Health Check Route GET /...');
    const healthRes = await axios.get(baseURL);
    console.log('Health check status:', healthRes.status, healthRes.data.endpoints.cart);
    if (!healthRes.data.endpoints.cart) {
      throw new Error('Cart endpoints missing in health check!');
    }

    // 1. Fetch products from catalog
    console.log('\n1. Fetching products from GET /products...');
    const productsRes = await axios.get(`${baseURL}/products`);
    const allProducts = productsRes.data.products;
    if (!allProducts || allProducts.length === 0) {
      throw new Error('No products found in DB to test cart with!');
    }
    testProduct = allProducts[0];
    // Find a product with lower stock if available
    lowStockProduct = allProducts.find(p => p.stock > 0 && p.stock <= 5) || allProducts[0];
    console.log(`Using test product: ${testProduct._id} (${testProduct.name}), Stock: ${testProduct.stock}`);
    console.log(`Using low stock product: ${lowStockProduct._id} (${lowStockProduct.name}), Stock: ${lowStockProduct.stock}`);

    // 2. Unauthenticated Requests (Expect 401)
    console.log('\n2. Testing unauthenticated requests (Expect 401)...');
    try {
      await axios.get(`${baseURL}/cart`);
      throw new Error('GET /cart without token should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ GET /cart without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    try {
      await axios.post(`${baseURL}/cart/${testProduct._id}`);
      throw new Error('POST /cart/:id without token should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ POST /cart/:id without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    try {
      await axios.patch(`${baseURL}/cart/${testProduct._id}`, { quantity: 2 });
      throw new Error('PATCH /cart/:id without token should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ PATCH /cart/:id without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    try {
      await axios.delete(`${baseURL}/cart/${testProduct._id}`);
      throw new Error('DELETE /cart/:id without token should have failed with 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✓ DELETE /cart/:id without token correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    // 3. Register & Login test customer
    console.log('\n3. Logging in / Registering test customer...');
    const testEmail = `test_cart_${Date.now()}@example.com`;
    await axios.post(`${baseURL}/customers/register`, {
      fullName: 'Cart Tester',
      email: testEmail,
      password: 'password123',
      phone: '9876543210'
    });

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
    console.log('Customer logged in. Token acquired:', !!testToken);

    const authHeaders = {
      headers: {
        Cookie: testCookie,
        Authorization: `Bearer ${testToken}`
      }
    };

    // 4. Initial Cart should be empty
    console.log('\n4. Testing GET /cart for fresh user (Expect 0 items)...');
    const initialCartRes = await axios.get(`${baseURL}/cart`, authHeaders);
    console.log('Initial cart length:', initialCartRes.data.cart.length);
    if (!Array.isArray(initialCartRes.data.cart) || initialCartRes.data.cart.length !== 0) {
      throw new Error('Fresh customer cart should be empty array');
    }
    console.log('✓ Initial cart is empty');

    // 5. Invalid Product ID format (Expect 400)
    console.log('\n5. Testing POST /cart/invalid_id (Expect 400)...');
    try {
      await axios.post(`${baseURL}/cart/invalid123`, {}, authHeaders);
      throw new Error('Should have returned 400 for invalid product ID');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ Correctly returned 400 for invalid product ID format');
      } else {
        throw err;
      }
    }

    // 6. Non-existent Product (Expect 404)
    console.log('\n6. Testing POST /cart/non_existent_id (Expect 404)...');
    const fakeId = new mongoose.Types.ObjectId().toString();
    try {
      await axios.post(`${baseURL}/cart/${fakeId}`, {}, authHeaders);
      throw new Error('Should have returned 404 for non-existent product');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Correctly returned 404 for non-existent product');
      } else {
        throw err;
      }
    }

    // 7. Add product to cart (Task 2: quantity = 1)
    console.log('\n7. Testing POST /cart/:productId (Add new product)...');
    const addRes1 = await axios.post(`${baseURL}/cart/${testProduct._id}`, {}, authHeaders);
    console.log('Add 1 status:', addRes1.status, 'Message:', addRes1.data.message);
    const item1 = addRes1.data.cart.find(i => i.product._id.toString() === testProduct._id.toString());
    if (!item1 || item1.quantity !== 1) {
      throw new Error(`Expected quantity 1, got ${item1?.quantity}`);
    }
    console.log('✓ Product added with quantity = 1 and populated product details');

    // 8. Add same product again (Task 2: increment quantity to 2)
    console.log('\n8. Testing POST /cart/:productId again (Increment existing item)...');
    const addRes2 = await axios.post(`${baseURL}/cart/${testProduct._id}`, {}, authHeaders);
    console.log('Add 2 status:', addRes2.status);
    const item2 = addRes2.data.cart.find(i => i.product._id.toString() === testProduct._id.toString());
    if (!item2 || item2.quantity !== 2) {
      throw new Error(`Expected quantity 2, got ${item2?.quantity}`);
    }
    if (addRes2.data.cart.length !== 1) {
      throw new Error('Duplicate rows created for same product! Should update existing row.');
    }
    console.log('✓ Same product incremented quantity to 2 without creating duplicate row');

    // 9. Get Cart (Task 3: populated product)
    console.log('\n9. Testing GET /cart (Task 3: populated Product)...');
    const getCartRes = await axios.get(`${baseURL}/cart`, authHeaders);
    console.log('Cart items count:', getCartRes.data.cart.length);
    const cartProduct = getCartRes.data.cart[0].product;
    console.log('Populated Product data:', {
      _id: cartProduct._id,
      name: cartProduct.name,
      price: cartProduct.price,
      stock: cartProduct.stock
    });
    if (!cartProduct.name || cartProduct.price === undefined || cartProduct.stock === undefined) {
      throw new Error('Product details were not properly populated!');
    }
    console.log('✓ GET /cart properly populated Product information');

    // 10. Update quantity (Task 4: PATCH /cart/:productId)
    console.log('\n10. Testing PATCH /cart/:productId (Set quantity = 3)...');
    const patchRes = await axios.patch(`${baseURL}/cart/${testProduct._id}`, { quantity: 3 }, authHeaders);
    const patchedItem = patchRes.data.cart.find(i => i.product._id.toString() === testProduct._id.toString());
    if (!patchedItem || patchedItem.quantity !== 3) {
      throw new Error(`Expected quantity 3, got ${patchedItem?.quantity}`);
    }
    console.log('✓ Successfully updated product quantity to 3');

    // 11. Reject quantity < 1 (Task 4: Expect 400)
    console.log('\n11. Testing PATCH /cart/:productId with quantity = 0 (Expect 400)...');
    try {
      await axios.patch(`${baseURL}/cart/${testProduct._id}`, { quantity: 0 }, authHeaders);
      throw new Error('Should have returned 400 for quantity < 1');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ Correctly returned 400 for quantity < 1:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 12. Reject quantity exceeding stock (Task 4: Expect 400)
    console.log('\n12. Testing PATCH /cart/:productId exceeding stock (Expect 400)...');
    try {
      await axios.patch(`${baseURL}/cart/${testProduct._id}`, { quantity: 999999 }, authHeaders);
      throw new Error('Should have returned 400 for quantity > stock');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ Correctly returned 400 for quantity exceeding stock:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 13. Update quantity for product not in cart (Expect 404)
    console.log('\n13. Testing PATCH /cart/:productId for product not in cart (Expect 404)...');
    const anotherProduct = allProducts.find(p => p._id.toString() !== testProduct._id.toString());
    try {
      await axios.patch(`${baseURL}/cart/${anotherProduct._id}`, { quantity: 1 }, authHeaders);
      throw new Error('Should have returned 404 for item not in cart');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Correctly returned 404 for product not in cart');
      } else {
        throw err;
      }
    }

    // 14. Remove product from cart (Task 5: DELETE /cart/:productId)
    console.log('\n14. Testing DELETE /cart/:productId (Valid remove)...');
    const deleteRes = await axios.delete(`${baseURL}/cart/${testProduct._id}`, authHeaders);
    console.log('Delete status:', deleteRes.status, 'Message:', deleteRes.data.message);
    if (deleteRes.data.cart.some(i => i.product._id.toString() === testProduct._id.toString())) {
      throw new Error('Item still present in cart after deletion!');
    }
    console.log('✓ Product removed from cart successfully');

    // 15. Remove product not in cart (Expect 404)
    console.log('\n15. Testing DELETE /cart/:productId when not in cart (Expect 404)...');
    try {
      await axios.delete(`${baseURL}/cart/${testProduct._id}`, authHeaders);
      throw new Error('Should have returned 404 for item not in cart');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✓ Correctly returned 404 for product not in cart:', err.response.data.message);
      } else {
        throw err;
      }
    }

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND SHOPPING CART TESTS PASSED! (100/100)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ CART TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
}

testCart();
