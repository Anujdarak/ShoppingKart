const axios = require('axios');

async function testLab03() {
  console.log('=== RUNNING LAB 03 PRODUCT CATALOG & DISCOVERY TESTS ===');
  const baseURL = 'http://localhost:3000';

  try {
    // 1. Task 2: Create Product with Valid Data (Expect 201)
    console.log('\n1. Testing POST /products (Valid Product)...');
    const newProduct = {
      name: 'Mechanical Gaming Keyboard Pro',
      description: 'Hot-swappable tactile RGB mechanical gaming keyboard.',
      price: 3499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
      stock: 15
    };
    const createRes = await axios.post(`${baseURL}/products`, newProduct);
    console.log('Create Status:', createRes.status);
    console.log('Created ID:', createRes.data._id);
    if (createRes.status !== 201 || !createRes.data._id || createRes.data.price !== 3499) {
      throw new Error('Failed creating product');
    }
    const createdId = createRes.data._id;

    // 2. Task 2: Failure - Missing Required Fields (Expect 400)
    console.log('\n2. Testing POST /products (Missing Fields - Expect 400)...');
    try {
      await axios.post(`${baseURL}/products`, { name: 'Incomplete' });
      throw new Error('Should have returned 400 for missing fields');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400 for missing fields:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 3. Task 2: Failure - Invalid Price <= 0 (Expect 400)
    console.log('\n3. Testing POST /products (Price <= 0 - Expect 400)...');
    try {
      await axios.post(`${baseURL}/products`, {
        name: 'Invalid Price Item',
        description: 'Test description',
        price: -50,
        category: 'Electronics',
        image: 'https://example.com/img.jpg',
        stock: 5
      });
      throw new Error('Should have returned 400 for invalid price');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400 for invalid price:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 4. Task 2: Failure - Negative Stock (Expect 400)
    console.log('\n4. Testing POST /products (Stock < 0 - Expect 400)...');
    try {
      await axios.post(`${baseURL}/products`, {
        name: 'Negative Stock Item',
        description: 'Test description',
        price: 100,
        category: 'Electronics',
        image: 'https://example.com/img.jpg',
        stock: -1
      });
      throw new Error('Should have returned 400 for negative stock');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400 for negative stock:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 5. Task 3: Get All Products (Expect 200, count, products array)
    console.log('\n5. Testing GET /products...');
    const allRes = await axios.get(`${baseURL}/products`);
    console.log('Status:', allRes.status);
    console.log('Count:', allRes.data.count);
    if (!allRes.data.success || !Array.isArray(allRes.data.products) || allRes.data.count === 0) {
      throw new Error('GET /products did not return valid product array');
    }

    // 6. Task 4: Get Single Product by ID (Expect 200)
    console.log(`\n6. Testing GET /products/${createdId}...`);
    const singleRes = await axios.get(`${baseURL}/products/${createdId}`);
    console.log('Single Product Status:', singleRes.status);
    console.log('Product Name:', singleRes.data.name);
    if (singleRes.data._id !== createdId) {
      throw new Error('Returned product ID mismatch');
    }

    // 7. Task 4: Get Single Product - Invalid ID format (Expect 400)
    console.log('\n7. Testing GET /products/invalid-id (Expect 400)...');
    try {
      await axios.get(`${baseURL}/products/invalid-id-123`);
      throw new Error('Should have returned 400 for invalid ID format');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('Correctly returned 400:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 8. Task 4: Get Single Product - Non-existent ID (Expect 404)
    console.log('\n8. Testing GET /products/66d123abc456789012345678 (Expect 404)...');
    try {
      await axios.get(`${baseURL}/products/66d123abc456789012345678`);
      throw new Error('Should have returned 404 for non-existent product');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('Correctly returned 404:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 9. Task 5: Search Filter - Case-insensitive regex
    console.log('\n9. Testing GET /products?search=kEyBoArD...');
    const searchRes = await axios.get(`${baseURL}/products?search=kEyBoArD`);
    console.log(`Search matched ${searchRes.data.count} products.`);
    if (searchRes.data.count === 0 || !searchRes.data.products.some(p => p.name.toLowerCase().includes('keyboard'))) {
      throw new Error('Search did not find keyboard products');
    }

    // 10. Task 5: Category Filter
    console.log('\n10. Testing GET /products?category=Fashion...');
    const catRes = await axios.get(`${baseURL}/products?category=Fashion`);
    console.log(`Category matched ${catRes.data.count} products.`);
    if (catRes.data.count === 0 || !catRes.data.products.every(p => p.category.toLowerCase() === 'fashion')) {
      throw new Error('Category filter returned incorrect items');
    }

    // 11. Task 5: Combined Search + Category
    console.log('\n11. Testing GET /products?search=sneakers&category=Fashion...');
    const comboRes = await axios.get(`${baseURL}/products?search=sneakers&category=Fashion`);
    console.log(`Combo matched ${comboRes.data.count} products.`);
    if (comboRes.data.count === 0) {
      throw new Error('Combined filter failed');
    }

    // 12. Bonus (+10 Marks): Price Sorting
    console.log('\n12. Testing GET /products?sort=price_asc and price_desc (Bonus)...');
    const ascRes = await axios.get(`${baseURL}/products?sort=price_asc`);
    const descRes = await axios.get(`${baseURL}/products?sort=price_desc`);
    const ascPrices = ascRes.data.products.map(p => p.price);
    const descPrices = descRes.data.products.map(p => p.price);

    console.log('Ascending prices sample:', ascPrices.slice(0, 3));
    console.log('Descending prices sample:', descPrices.slice(0, 3));

    if (ascPrices[0] > ascPrices[ascPrices.length - 1] || descPrices[0] < descPrices[descPrices.length - 1]) {
      throw new Error('Sorting was not applied correctly');
    }
    console.log('Bonus sorting verified successfully!');

    console.log('\n>>> ALL LAB 03 BACKEND & PRODUCT DISCOVERY REQUIREMENTS PASSED! <<<');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message, error.response?.data || '');
    process.exit(1);
  }
}

testLab03();
