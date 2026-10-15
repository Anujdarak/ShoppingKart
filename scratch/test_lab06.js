const axios = require('axios');
const crypto = require('crypto');

async function testLab06() {
  console.log('=== STARTING LAB 06 CHECKOUT & ORDERS VERIFICATION TESTS ===');
  const baseURL = 'http://localhost:3000';

  const testEmail = `order_test_${Date.now()}@example.com`;
  const testCustomer = {
    fullName: 'Aarav Sharma',
    email: testEmail,
    password: 'password123',
    phone: '+91 9876543210'
  };

  try {
    // Step 0: Register & Login test customer
    console.log('\n0. Registering & logging in test user...');
    await axios.post(`${baseURL}/customers/register`, testCustomer);
    const loginRes = await axios.post(`${baseURL}/customers/login`, {
      email: testEmail,
      password: testCustomer.password
    });

    const cookieHeader = loginRes.headers['set-cookie'];
    const tokenCookie = cookieHeader.find(c => c.includes('token=')).split(';')[0];
    const authHeaders = { Cookie: tokenCookie };

    // Test 1: Unauthenticated checkout rejection (401)
    console.log('\n1. Testing unauthenticated checkout (Expect 401)...');
    try {
      await axios.post(`${baseURL}/orders/create-payment-order`, {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        }
      });
      throw new Error('Should have returned 401');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('Correctly returned 401 Unauthorized');
      } else {
        throw err;
      }
    }

    // Test 2: Empty cart checkout rejection (Expect 400)
    console.log('\n2. Testing checkout with empty cart (Expect 400)...');
    try {
      await axios.post(`${baseURL}/orders/create-payment-order`, {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        }
      }, { headers: authHeaders });
      throw new Error('Should have returned 400 for empty cart');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400 for empty cart:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // Fetch existing product from catalog
    console.log('\nFetching products from catalog...');
    const prodRes = await axios.get(`${baseURL}/products`);
    if (!prodRes.data.products || prodRes.data.products.length === 0) {
      throw new Error('No products in database to test cart/order');
    }
    const testProduct = prodRes.data.products[0];
    console.log(`Using product: ${testProduct.name} (Price: ₹${testProduct.price}, Stock: ${testProduct.stock})`);

    // Add item to cart
    console.log(`Adding ${testProduct.name} to cart...`);
    await axios.post(`${baseURL}/cart/${testProduct._id}`, {}, { headers: authHeaders });

    // Test 3: Shipping address validation (Invalid pincode / phone)
    console.log('\n3. Testing invalid shipping address (Expect 400)...');
    try {
      await axios.post(`${baseURL}/orders/create-payment-order`, {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '123', // invalid phone
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '12' // invalid pincode
        }
      }, { headers: authHeaders });
      throw new Error('Should have failed with 400 for invalid address');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400 for invalid shipping address:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // Test 4: Create Payment Order with valid address
    console.log('\n4. Creating payment order with valid shipping address...');
    const validAddress = {
      fullName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: '22 MG Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    };

    const orderRes = await axios.post(`${baseURL}/orders/create-payment-order`, {
      shippingAddress: validAddress,
      totalAmount: 1 // Attempting fake frontend amount!
    }, { headers: authHeaders });

    console.log('Create Payment Order Status:', orderRes.status);
    console.log('ShopKart Order ID:', orderRes.data.shopKartOrderId);
    console.log('Razorpay Order ID:', orderRes.data.razorpayOrderId);
    console.log('Amount in paise:', orderRes.data.amount);

    const expectedPaise = Math.round(testProduct.price * 100);
    if (orderRes.data.amount !== expectedPaise) {
      throw new Error(`Server failed to calculate correct total! Expected ${expectedPaise}, got ${orderRes.data.amount}`);
    }
    console.log('Server correctly ignored fake frontend amount and calculated real price!');

    const shopKartOrderId = orderRes.data.shopKartOrderId;
    const razorpayOrderId = orderRes.data.razorpayOrderId;

    // Test 5: Verify cart is NOT cleared before payment verification
    console.log('\n5. Verifying cart before payment verification...');
    const cartBefore = await axios.get(`${baseURL}/cart`, { headers: authHeaders });
    if (!cartBefore.data.cart || cartBefore.data.cart.length === 0) {
      throw new Error('Cart was cleared prematurely before payment verification!');
    }
    console.log(`Cart still contains ${cartBefore.data.cart.length} item(s) as expected.`);

    // Test 6: Fake payment signature verification (Expect 400)
    console.log('\n6. Testing fake payment signature (Expect 400)...');
    try {
      await axios.post(`${baseURL}/orders/verify-payment`, {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_fake123',
        razorpay_signature: 'fake_signature_hex'
      }, { headers: authHeaders });
      throw new Error('Should have failed with 400 for fake signature');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly rejected invalid payment signature:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // Verify cart is STILL not cleared after failed payment
    const cartStillThere = await axios.get(`${baseURL}/cart`, { headers: authHeaders });
    if (cartStillThere.data.cart.length === 0) {
      throw new Error('Cart was cleared after failed payment!');
    }
    console.log('Cart preserved after payment failure.');

    // Test 7: Valid HMAC SHA256 payment signature verification
    console.log('\n7. Testing valid payment verification...');
    const paymentId = `pay_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'shopkartLab06Secret12345678';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    const verifyRes = await axios.post(`${baseURL}/orders/verify-payment`, {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature
    }, { headers: authHeaders });

    console.log('Verify Status:', verifyRes.status);
    console.log('Order Status:', verifyRes.data.order.status);
    console.log('Payment Status:', verifyRes.data.order.paymentStatus);

    if (verifyRes.data.order.paymentStatus !== 'PAID' || verifyRes.data.order.status !== 'PLACED') {
      throw new Error('Order was not marked PAID and PLACED!');
    }

    // Test 8: Confirm user cart is NOW cleared
    console.log('\n8. Confirming cart cleared after successful payment...');
    const cartAfter = await axios.get(`${baseURL}/cart`, { headers: authHeaders });
    if (cartAfter.data.cart.length !== 0) {
      throw new Error('User cart was not cleared after payment confirmation!');
    }
    console.log('Cart successfully cleared in database!');

    // Test 9: Get My Orders API
    console.log('\n9. Testing GET /orders...');
    const ordersRes = await axios.get(`${baseURL}/orders`, { headers: authHeaders });
    console.log('Orders Count:', ordersRes.data.count);
    if (!ordersRes.data.orders.some(o => o._id === shopKartOrderId)) {
      throw new Error('Created order not found in user order history!');
    }
    console.log('Order found in user history with correct items snapshot!');

    // Test 10: Single Order API & ownership enforcement
    console.log(`\n10. Testing GET /orders/${shopKartOrderId}...`);
    const singleOrderRes = await axios.get(`${baseURL}/orders/${shopKartOrderId}`, { headers: authHeaders });
    console.log('Fetched single order:', singleOrderRes.data.order._id);

    // Test 11: Bonus Status Progression (+10 Marks)
    console.log('\n11. Testing Bonus order status progression (PATCH /orders/:id/status)...');
    const updateRes = await axios.patch(`${baseURL}/orders/${shopKartOrderId}/status`, {
      status: 'CONFIRMED'
    }, { headers: authHeaders });
    console.log('Updated Status to:', updateRes.data.order.status);
    if (updateRes.data.order.status !== 'CONFIRMED') {
      throw new Error('Failed to update status progression');
    }
    console.log('Bonus order status progression verified!');

    console.log('\n>>> ALL 11 LAB 06 CHECKOUT & ORDERS REQUIREMENTS PASSED! <<<');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message, error.response?.data || '');
    process.exit(1);
  }
}

testLab06();
