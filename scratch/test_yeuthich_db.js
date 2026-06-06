const sql = require('mssql');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: () => {
            try { return JSON.parse(data); } catch { return null; }
          }
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  let pool;
  try {
    console.log('Connecting to database to get a test user...');
    pool = await sql.connect(config);
    
    // 1. Get a customer user
    const userRes = await pool.request().query('SELECT TOP 1 NguoiDungID, HoTen, TenDangNhap, VaiTroID FROM NguoiDung');
    if (userRes.recordset.length === 0) {
      throw new Error('No users found in NguoiDung table');
    }
    const testUser = userRes.recordset[0];
    console.log('Found test user:', testUser);

    // 2. Get a valid product ID
    const productRes = await pool.request().query('SELECT TOP 2 SanPhamID, TenSanPham FROM SanPham WHERE TrangThai = 1');
    if (productRes.recordset.length === 0) {
      throw new Error('No active products found in SanPham table');
    }
    const products = productRes.recordset;
    console.log('Found test products:', products);

    await sql.close();

    // 3. Generate Token
    const token = jwt.sign(
      { NguoiDungID: testUser.NguoiDungID, TenDangNhap: testUser.TenDangNhap, VaiTroID: testUser.VaiTroID },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Generated mock JWT token for testing.');

    // 4. Test unauthorized request
    console.log('\n--- Test 1: GET /api/yeuthich without auth ---');
    const res1 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich',
      method: 'GET'
    });
    console.log('Status Code:', res1.statusCode);
    console.log('Response:', res1.data);
    if (res1.statusCode !== 401 && res1.statusCode !== 403) {
      throw new Error('Should block unauthorized requests with 401 or 403');
    }
    console.log('✅ Test 1 Passed!');

    // 5. Test authorized request (get favorites, should be empty or list)
    console.log('\n--- Test 2: GET /api/yeuthich with auth ---');
    const res2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status Code:', res2.statusCode);
    const favorites = res2.json();
    console.log('Favorites count:', favorites.length);
    if (res2.statusCode !== 200) {
      throw new Error('Should allow authorized request');
    }
    console.log('✅ Test 2 Passed!');

    // 6. Add product to favorites
    console.log('\n--- Test 3: POST /api/yeuthich (add favorite) ---');
    const targetProduct = products[0];
    const res3 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { SanPhamID: targetProduct.SanPhamID });
    console.log('Status Code:', res3.statusCode);
    console.log('Response:', res3.data);
    if (res3.statusCode !== 200) {
      throw new Error('Should successfully add product to favorites');
    }
    console.log('✅ Test 3 Passed!');

    // 7. Get favorites again to verify it is there
    console.log('\n--- Test 4: Verify product in favorites ---');
    const res4 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const updatedFavs = res4.json();
    console.log('Favorites count after add:', updatedFavs.length);
    const exists = updatedFavs.some(f => f.SanPhamID === targetProduct.SanPhamID);
    if (!exists) {
      throw new Error('Added product not found in favorites list');
    }
    console.log('✅ Test 4 Passed!');

    // 8. Sync favorites
    console.log('\n--- Test 5: POST /api/yeuthich/dongbo (sync favorites) ---');
    const syncProduct = products[1] || targetProduct;
    const res5 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich/dongbo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { sanPhamIds: [syncProduct.SanPhamID] });
    console.log('Status Code:', res5.statusCode);
    console.log('Response:', res5.data);
    if (res5.statusCode !== 200) {
      throw new Error('Should sync favorites successfully');
    }
    console.log('✅ Test 5 Passed!');

    // 9. Delete product from favorites
    console.log('\n--- Test 6: DELETE /api/yeuthich/:id (remove favorite) ---');
    const res6 = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/yeuthich/${targetProduct.SanPhamID}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status Code:', res6.statusCode);
    console.log('Response:', res6.data);
    if (res6.statusCode !== 200) {
      throw new Error('Should successfully remove favorite');
    }
    console.log('✅ Test 6 Passed!');

    // 10. Clean up / delete all
    console.log('\n--- Test 7: DELETE /api/yeuthich (clear favorites) ---');
    const res7 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yeuthich',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status Code:', res7.statusCode);
    console.log('Response:', res7.data);
    if (res7.statusCode !== 200) {
      throw new Error('Should clear all favorites successfully');
    }
    console.log('✅ Test 7 Passed!');

    console.log('\n🎉 ALL BACKEND FAVORITE TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('❌ Test failed:', err);
    if (pool) {
      await sql.close();
    }
    process.exit(1);
  }
}

runTests();
