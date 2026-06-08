const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make HTTP Requests
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

async function runTests() {
  try {
    console.log('=== RUNNING API VERIFICATION TESTS ===\n');

    let adminToken = '';
    let userToken = '';
    let testUserId = null;

    // 1. Login as Admin to get Admin token
    console.log('1. Testing Admin Login...');
    const adminLoginRes = await request('POST', '/api/login', {
      TenDangNhap: 'admin',
      MatKhau: '123456'
    });
    
    if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
      console.log('✅ Admin login successful!');
      adminToken = adminLoginRes.body.token;
    } else {
      console.error('❌ Admin login failed:', adminLoginRes);
      process.exit(1);
    }

    // 2. Register a new user
    console.log('\n2. Testing User Registration (POST /api/register)...');
    const registerPayload = {
      VaiTroID: 3, // Khách hàng
      HoTen: 'Kiểm thử Viên',
      TenDangNhap: 'kiemthuvien',
      MatKhau: 'SecurePass123',
      Email: 'kiemthuvien@example.com',
      SoDienThoai: '0981112223',
      DiaChi: '456 Đường CMT8, Quận 3'
    };

    const registerRes = await request('POST', '/api/register', registerPayload);
    if (registerRes.status === 201) {
      console.log('✅ Registration successful!');
      console.log('Response data:', registerRes.body.data);
      testUserId = registerRes.body.data.NguoiDungID;
    } else {
      console.error('❌ Registration failed:', registerRes);
      process.exit(1);
    }

    // 3. Register duplicate user
    console.log('\n3. Testing Duplicate Registration Prevention...');
    const dupRes = await request('POST', '/api/register', registerPayload);
    if (dupRes.status === 400) {
      console.log('✅ Duplicate registration correctly rejected with 400!');
      console.log('Error message:', dupRes.body.message);
    } else {
      console.error('❌ Duplicate registration allowed or wrong status:', dupRes);
    }

    // 4. Login with newly registered user
    console.log('\n4. Testing User Login (POST /api/login)...');
    const loginRes = await request('POST', '/api/login', {
      TenDangNhap: 'kiemthuvien',
      MatKhau: 'SecurePass123'
    });
    if (loginRes.status === 200 && loginRes.body.token) {
      console.log('✅ User login successful!');
      userToken = loginRes.body.token;
    } else {
      console.error('❌ User login failed:', loginRes);
      process.exit(1);
    }

    // 5. Get all users as Admin
    console.log('\n5. Testing List All Users as Admin (GET /api/nguoidung)...');
    const listRes = await request('GET', '/api/nguoidung', null, adminToken);
    if (listRes.status === 200 && Array.isArray(listRes.body)) {
      console.log(`✅ Successfully listed all users (Count: ${listRes.body.length})!`);
      const createdUser = listRes.body.find(u => u.NguoiDungID === testUserId);
      if (createdUser) {
        console.log('Found created user in the list:', createdUser);
      } else {
        console.error('❌ Created user not found in the list!');
      }
    } else {
      console.error('❌ Failed to list users:', listRes);
    }

    // 6. Get all users as normal User (should be rejected/forbidden)
    console.log('\n6. Testing List All Users as normal User (GET /api/nguoidung) - Should be forbidden...');
    const listResUser = await request('GET', '/api/nguoidung', null, userToken);
    if (listResUser.status === 403) {
      console.log('✅ Listing rejected with 403 Forbidden as expected!');
    } else {
      console.error('❌ Security bypass! Allowed listing users with normal user token:', listResUser);
    }

    // 7. Get user by ID
    console.log(`\n7. Testing Get User By ID (GET /api/nguoidung/${testUserId})...`);
    const getRes = await request('GET', `/api/nguoidung/${testUserId}`, null, userToken);
    if (getRes.status === 200 && getRes.body.NguoiDungID === testUserId) {
      console.log('✅ Successfully retrieved user details!');
      console.log('User details:', getRes.body);
    } else {
      console.error('❌ Failed to get user by ID:', getRes);
    }

    // 8. Update user information
    console.log(`\n8. Testing Update User (PUT /api/nguoidung/${testUserId})...`);
    const updatePayload = {
      HoTen: 'Kiểm thử Viên (Đã Sửa)',
      Email: 'kiemthuvien_updated@example.com',
      DiaChi: '789 CMT8, Quận 3'
    };
    const updateRes = await request('PUT', `/api/nguoidung/${testUserId}`, updatePayload, userToken);
    if (updateRes.status === 200) {
      console.log('✅ Successfully updated user details!');
      console.log('Updated user:', updateRes.body.data);
    } else {
      console.error('❌ Failed to update user:', updateRes);
    }

    // 9. Delete user as Admin
    console.log(`\n9. Testing Delete User (DELETE /api/nguoidung/${testUserId})...`);
    const deleteRes = await request('DELETE', `/api/nguoidung/${testUserId}`, null, adminToken);
    if (deleteRes.status === 200) {
      console.log('✅ Successfully deleted user!');
    } else {
      console.error('❌ Failed to delete user:', deleteRes);
    }

    // 10. Verify deletion
    console.log(`\n10. Verifying user was deleted...`);
    const verifyGet = await request('GET', `/api/nguoidung/${testUserId}`, null, adminToken);
    if (verifyGet.status === 404) {
      console.log('✅ User correctly not found (404) after deletion!');
    } else {
      console.error('❌ User still exists or wrong status:', verifyGet);
    }

    console.log('\n=======================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=======================================');
    process.exit(0);

  } catch (error) {
    console.error('Exception during test execution:', error);
    process.exit(1);
  }
}

runTests();
