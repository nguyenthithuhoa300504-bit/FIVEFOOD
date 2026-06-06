const { sql, connectDB } = require('../config/db.config');
const http = require('http');

const PORT = 3000;

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
  try {
    await connectDB();
    const reqDb = new sql.Request();

    console.log('1. Logging in as admin...');
    const loginRes = await request('POST', '/api/login', {
      TenDangNhap: 'admin',
      MatKhau: '123456'
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      console.error('Login failed:', loginRes.body);
      process.exit(1);
    }
    const token = loginRes.body.token;
    const userId = loginRes.body.user.NguoiDungID;
    console.log('Login success! UserID:', userId);

    console.log('2. Adding product ID 13 to admin cart...');
    // Ensure product 13 exists and has stock
    await reqDb.query("UPDATE SanPham SET SoLuongTon = 100, TrangThai = 1 WHERE SanPhamID = 13");
    
    const addCartRes = await request('POST', '/api/giohang/them', {
      NguoiDungID: userId,
      SanPhamID: 13,
      SoLuong: 1
    }, token);
    console.log('Add to cart response status:', addCartRes.status);

    console.log('3. Trying to checkout with "Ví MoMo" payment method...');
    const checkoutRes = await request('POST', '/api/hoadon', {
      NguoiDungID: userId,
      DiaChiNhan: '123 Test Momo Street',
      SoDienThoaiNhan: '0901234567',
      GhiChu: 'Test Momo Checkout',
      PhuongThucThanhToan: 'Ví MoMo'
    }, token);

    console.log('Checkout Response Status:', checkoutRes.status);
    console.log('Checkout Response Body:', JSON.stringify(checkoutRes.body, null, 2));

    if (checkoutRes.status === 201) {
      console.log('SUCCESS: Momo checkout succeeded with mapped payment method!');
      const newHoaDonId = checkoutRes.body.data.HoaDonID;
      
      console.log('Checking database table ThanhToan...');
      const checkPt = await reqDb.query(`SELECT * FROM ThanhToan WHERE HoaDonID = ${newHoaDonId}`);
      console.log('ThanhToan record in database:', checkPt.recordset);

      console.log('Cleaning up test invoice...');
      await reqDb.query(`DELETE FROM ChiTietHoaDon WHERE HoaDonID = ${newHoaDonId}`);
      await reqDb.query(`DELETE FROM ThanhToan WHERE HoaDonID = ${newHoaDonId}`);
      await reqDb.query(`DELETE FROM HoaDon WHERE HoaDonID = ${newHoaDonId}`);
      console.log('Cleanup complete.');
    } else {
      console.error('FAILURE: Momo checkout failed!');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
