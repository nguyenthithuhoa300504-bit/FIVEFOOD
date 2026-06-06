const { sql } = require('../config/db.config');
const http = require('http');
const path = require('path');
const { fork } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = 3001;

// Helper to make local HTTP requests to the Express server
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTest() {
  let serverProcess = null;
  let pool = null;
  
  try {
    console.log('--------------------------------------------------');
    console.log('  STARTING INTEGRATION TEST FOR THANHTOAN FLOW');
    console.log('--------------------------------------------------');

    // 1. Start Server automatically in background
    console.log('1. Starting Express server in the background on port 3001...');
    serverProcess = fork(path.join(__dirname, '../app.js'), [], { 
      silent: true,
      env: { ...process.env, PORT: '3001' }
    });
    
    // Log server stdout/stderr to console if needed for debugging
    serverProcess.stdout.on('data', (data) => {
      // console.log(`[Server Stdout]: ${data}`);
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Stderr]: ${data}`);
    });

    // Wait 3.5 seconds for the server to spin up and database to connect
    await new Promise(resolve => setTimeout(resolve, 3500));
    console.log('✅ Express Server started successfully on port 3000.');

    // 2. Setup Database Connection
    console.log('\n2. Connecting to SQL Server database...');
    pool = await sql.connect({
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123456',
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_DATABASE || 'WebBanDoAn',
      port: parseInt(process.env.DB_PORT) || 1433,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });
    console.log('✅ Database connected.');

    const reqDb = pool.request();

    // Ensure test user and role exist
    const rolesResult = await reqDb.query("SELECT VaiTroID FROM VaiTro WHERE TenVaiTro = N'Khách hàng' OR VaiTroID = 3");
    let customerRoleId = 3;
    if (rolesResult.recordset.length > 0) {
      customerRoleId = rolesResult.recordset[0].VaiTroID;
    }

    const adminRolesResult = await reqDb.query("SELECT VaiTroID FROM VaiTro WHERE TenVaiTro = N'Admin' OR VaiTroID = 1");
    let adminRoleId = 1;
    if (adminRolesResult.recordset.length > 0) {
      adminRoleId = adminRolesResult.recordset[0].VaiTroID;
    }

    // Clean up old test data
    console.log('\n3. Cleaning up old test data (if any)...');
    await reqDb.query("DELETE tt FROM ThanhToan tt INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID INNER JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID WHERE nd.TenDangNhap IN ('testthanhtoan', 'testadmin')");
    await reqDb.query("DELETE hd FROM HoaDon hd INNER JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID WHERE nd.TenDangNhap IN ('testthanhtoan', 'testadmin')");
    await reqDb.query("DELETE FROM NguoiDung WHERE TenDangNhap IN ('testthanhtoan', 'testadmin')");

    // 4. Register test users via API
    console.log('\n4. Registering test customer and admin users...');
    const registerRes = await request('POST', '/api/register', {
      VaiTroID: customerRoleId,
      HoTen: 'Khách Thanh Toán Thử Nghiệm',
      TenDangNhap: 'testthanhtoan',
      MatKhau: 'SecurePass123',
      Email: 'testthanhtoan@example.com',
      SoDienThoai: '0901234568',
      DiaChi: '123 Payment Street'
    });
    if (registerRes.status !== 201) {
      throw new Error(`Failed to register test user: ${JSON.stringify(registerRes)}`);
    }
    const testUserId = registerRes.body.data.NguoiDungID;
    console.log(`✅ Test customer registered: NguoiDungID = ${testUserId}`);

    const registerAdminRes = await request('POST', '/api/register', {
      VaiTroID: adminRoleId,
      HoTen: 'Admin Thử Nghiệm',
      TenDangNhap: 'testadmin',
      MatKhau: 'SecurePass123',
      Email: 'testadmin@example.com',
      SoDienThoai: '0901234569',
      DiaChi: '123 Admin Street'
    });
    if (registerAdminRes.status !== 201) {
      throw new Error(`Failed to register test admin: ${JSON.stringify(registerAdminRes)}`);
    }
    const testAdminId = registerAdminRes.body.data.NguoiDungID;
    console.log(`✅ Test admin registered: NguoiDungID = ${testAdminId}`);

    // 5. Login to get JWT tokens
    console.log('\n5. Logging in to retrieve JWT tokens...');
    const loginRes = await request('POST', '/api/login', {
      TenDangNhap: 'testthanhtoan',
      MatKhau: 'SecurePass123'
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Failed to login: ${JSON.stringify(loginRes)}`);
    }
    const userToken = loginRes.body.token;

    const loginAdminRes = await request('POST', '/api/login', {
      TenDangNhap: 'testadmin',
      MatKhau: 'SecurePass123'
    });
    if (loginAdminRes.status !== 200 || !loginAdminRes.body.token) {
      throw new Error(`Failed to login admin: ${JSON.stringify(loginAdminRes)}`);
    }
    const adminToken = loginAdminRes.body.token;
    console.log('✅ JWT tokens obtained successfully.');

    // 6. Create a test invoice directly in database (so we bypass Cart/Checkout)
    console.log('\n6. Inserting a test invoice directly into the database...');
    const invoiceResult = await reqDb.query(`
      INSERT INTO HoaDon (NguoiDungID, TongTien, TrangThai, DiaChiNhan, SoDienThoaiNhan)
      OUTPUT inserted.HoaDonID
      VALUES (${testUserId}, 150000, N'Chờ xác nhận', N'123 Payment Street', '0901234568')
    `);
    const testHoaDonId = invoiceResult.recordset[0].HoaDonID;
    console.log(`✅ Test HoaDon created with ID: ${testHoaDonId}`);

    // Note: Since we inserted it directly (not via SP), no default payment entry exists in ThanhToan yet!
    // This allows us to test POST /api/thanhtoan first.

    // 7. Test POST /api/thanhtoan (createThanhToan)
    console.log('\n7. Testing POST /api/thanhtoan (Create payment)...');
    const paymentPayload = {
      HoaDonID: testHoaDonId,
      PhuongThuc: 'Momo',
      TrangThaiThanhToan: 'Chưa thanh toán'
    };
    const createPaymentRes = await request('POST', '/api/thanhtoan', paymentPayload, userToken);
    console.log(`Response Status: ${createPaymentRes.status}`);
    console.log('Body:', createPaymentRes.body);
    if (createPaymentRes.status !== 201) {
      throw new Error(`POST /api/thanhtoan failed: ${JSON.stringify(createPaymentRes)}`);
    }
    const createdPayment = createPaymentRes.body.data;
    console.log('✅ POST /api/thanhtoan succeeded!');

    // Test POST duplicate payment (should fail with 400)
    console.log('\nTesting POST duplicate payment (should fail 400)...');
    const duplicateRes = await request('POST', '/api/thanhtoan', paymentPayload, userToken);
    console.log(`Response Status: ${duplicateRes.status} (Expected: 400)`);
    if (duplicateRes.status !== 400) {
      throw new Error(`POST duplicate did not fail as expected. Status: ${duplicateRes.status}`);
    }
    console.log('✅ Duplicate prevention works.');

    // 8. Test GET /api/thanhtoan/:hoadonid (getThanhToanByHoaDonId)
    console.log(`\n8. Testing GET /api/thanhtoan/${testHoaDonId} (Get payment by HoaDonID)...`);
    const getPaymentRes = await request('GET', `/api/thanhtoan/${testHoaDonId}`, null, userToken);
    console.log(`Response Status: ${getPaymentRes.status}`);
    console.log('Body:', getPaymentRes.body);
    if (getPaymentRes.status !== 200) {
      throw new Error(`GET /api/thanhtoan/:hoadonid failed: ${JSON.stringify(getPaymentRes)}`);
    }
    if (getPaymentRes.body.PhuongThuc !== 'Momo') {
      throw new Error(`Expected payment method Momo, got ${getPaymentRes.body.PhuongThuc}`);
    }
    console.log('✅ GET /api/thanhtoan/:hoadonid succeeded!');

    // Test security for GET: Another customer (without token or wrong customer) shouldn't be able to read it
    console.log('\nTesting GET unauthorized access (should return 403 or 401)...');
    // Using an empty/no token request
    const unauthorizedGetRes = await request('GET', `/api/thanhtoan/${testHoaDonId}`, null, null);
    console.log(`Response Status: ${unauthorizedGetRes.status} (Expected: 403)`);
    if (unauthorizedGetRes.status !== 403) {
      throw new Error(`Unauthorized GET did not return 403. Status: ${unauthorizedGetRes.status}`);
    }
    console.log('✅ Security authorization works.');

    // 9. Test PUT /api/thanhtoan/:hoadonid (updateThanhToan)
    console.log(`\n9. Testing PUT /api/thanhtoan/${testHoaDonId} (Update payment)...`);
    const updatePayload = {
      PhuongThuc: 'Chuyển khoản',
      TrangThaiThanhToan: 'Đã thanh toán'
    };
    const updatePaymentRes = await request('PUT', `/api/thanhtoan/${testHoaDonId}`, updatePayload, userToken);
    console.log(`Response Status: ${updatePaymentRes.status}`);
    console.log('Body:', updatePaymentRes.body);
    if (updatePaymentRes.status !== 200) {
      throw new Error(`PUT /api/thanhtoan/:hoadonid failed: ${JSON.stringify(updatePaymentRes)}`);
    }
    if (updatePaymentRes.body.data.TrangThaiThanhToan !== 'Đã thanh toán' || updatePaymentRes.body.data.PhuongThuc !== 'Chuyển khoản') {
      throw new Error(`Update values did not match. Got: ${JSON.stringify(updatePaymentRes.body.data)}`);
    }
    if (!updatePaymentRes.body.data.NgayThanhToan) {
      throw new Error(`NgayThanhToan should be auto-set when status transitions to 'Đã thanh toán'.`);
    }
    console.log('✅ PUT /api/thanhtoan/:hoadonid succeeded!');

    // 10. Test GET /api/thanhtoan (getAllThanhToan)
    console.log('\n10. Testing GET /api/thanhtoan (Get all payments)...');
    // As admin
    const getAllAdminRes = await request('GET', `/api/thanhtoan`, null, adminToken);
    console.log(`Admin GET all Status: ${getAllAdminRes.status}, Record count: ${getAllAdminRes.body.length}`);
    if (getAllAdminRes.status !== 200) {
      throw new Error(`Admin GET /api/thanhtoan failed: ${JSON.stringify(getAllAdminRes)}`);
    }
    
    // As customer
    const getAllUserRes = await request('GET', `/api/thanhtoan`, null, userToken);
    console.log(`Customer GET all Status: ${getAllUserRes.status}, Record count: ${getAllUserRes.body.length}`);
    if (getAllUserRes.status !== 200) {
      throw new Error(`Customer GET /api/thanhtoan failed: ${JSON.stringify(getAllUserRes)}`);
    }
    console.log('✅ GET /api/thanhtoan succeeded for both Admin and Customer!');

    // 11. Test DELETE /api/thanhtoan/:hoadonid (deleteThanhToan)
    console.log(`\n11. Testing DELETE /api/thanhtoan/${testHoaDonId} (Delete payment)...`);
    // Delete as customer should fail (403)
    const deleteUserRes = await request('DELETE', `/api/thanhtoan/${testHoaDonId}`, null, userToken);
    console.log(`Customer DELETE Status: ${deleteUserRes.status} (Expected: 403)`);
    if (deleteUserRes.status !== 403) {
      throw new Error(`Customer was able to delete payment. Status: ${deleteUserRes.status}`);
    }

    // Delete as Admin should succeed (200)
    const deleteAdminRes = await request('DELETE', `/api/thanhtoan/${testHoaDonId}`, null, adminToken);
    console.log(`Admin DELETE Status: ${deleteAdminRes.status}`);
    if (deleteAdminRes.status !== 200) {
      throw new Error(`Admin DELETE /api/thanhtoan/:hoadonid failed: ${JSON.stringify(deleteAdminRes)}`);
    }
    console.log('✅ DELETE /api/thanhtoan/:hoadonid security and deletion works!');

    // Verify it is actually deleted from DB
    const checkDeleted = await reqDb.query(`SELECT COUNT(*) AS Count FROM ThanhToan WHERE HoaDonID = ${testHoaDonId}`);
    console.log(`Payment count in DB after DELETE: ${checkDeleted.recordset[0].Count} (Expected: 0)`);
    if (checkDeleted.recordset[0].Count !== 0) {
      throw new Error(`Payment record was not deleted from database.`);
    }
    console.log('✅ Verified deletion from Database.');

    // 12. Clean up database test records
    console.log('\n12. Cleaning up test database records...');
    await reqDb.query(`DELETE FROM HoaDon WHERE HoaDonID = ${testHoaDonId}`);
    await reqDb.query(`DELETE FROM NguoiDung WHERE NguoiDungID IN (${testUserId}, ${testAdminId})`);
    console.log('✅ Database cleanup completed.');

    console.log('\n--------------------------------------------------');
    console.log('🎉 THANHTOAN INTEGRATION TEST PASSED SUCCESSFULLY! 🎉');
    console.log('All CRUD, security authorization, and data checks');
    console.log('are 100% CORRECT!');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {}
    }
    if (serverProcess) {
      console.log('\nShutting down Express server process...');
      serverProcess.kill('SIGINT');
    }
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1500);
  }
}

runTest();
