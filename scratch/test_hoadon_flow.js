const { sql } = require('../config/db.config');
const http = require('http');
const path = require('path');
const { fork } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

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
    console.log('  STARTING INTEGRATION TEST FOR HOADON FLOW');
    console.log('--------------------------------------------------');

    // 1. Start Server automatically in background
    console.log('1. Starting Express server in the background...');
    serverProcess = fork(path.join(__dirname, '../app.js'), [], { silent: true });
    
    // Log server stdout to terminal
    serverProcess.stdout.on('data', (data) => {
      // Quietly consume logs or print them if needed
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

    // Ensure role "Khách hàng" (VaiTroID = 3) exists
    const rolesResult = await reqDb.query("SELECT VaiTroID FROM VaiTro WHERE TenVaiTro = N'Khách hàng' OR VaiTroID = 3");
    let customerRoleId = 3;
    if (rolesResult.recordset.length > 0) {
      customerRoleId = rolesResult.recordset[0].VaiTroID;
    }

    // Clean up any old test data in reverse order of foreign keys
    console.log('\n3. Cleaning up old test data (if any)...');
    await reqDb.query("DELETE cthd FROM ChiTietHoaDon cthd INNER JOIN HoaDon hd ON cthd.HoaDonID = hd.HoaDonID INNER JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID WHERE nd.TenDangNhap = 'testhoadon'");
    await reqDb.query("DELETE tt FROM ThanhToan tt INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID INNER JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID WHERE nd.TenDangNhap = 'testhoadon'");
    await reqDb.query("DELETE hd FROM HoaDon hd INNER JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID WHERE nd.TenDangNhap = 'testhoadon'");
    await reqDb.query("DELETE FROM NguoiDung WHERE TenDangNhap = 'testhoadon'");
    await reqDb.query("DELETE FROM SanPham WHERE TenSanPham = N'Món Ăn Thử Nghiệm'");
    await reqDb.query("DELETE FROM KhuyenMai WHERE MaKhuyenMai = 'TESTVOUCHER'");

    // Create a Test Product with 10 units in stock
    const prodResult = await reqDb.query(`
      INSERT INTO SanPham (DanhMucID, TenSanPham, Gia, SoLuongTon, TrangThai, MoTa)
      OUTPUT inserted.SanPhamID, inserted.SoLuongTon
      VALUES (1, N'Món Ăn Thử Nghiệm', 50000, 10, 1, N'Mô tả món ăn thử nghiệm')
    `);
    const testProductId = prodResult.recordset[0].SanPhamID;
    const initialProductStock = prodResult.recordset[0].SoLuongTon;
    console.log(`✅ Test product created: ID ${testProductId}, Stock: ${initialProductStock}`);

    // Create a Test Promotion Voucher
    const kmResult = await reqDb.query(`
      INSERT INTO KhuyenMai (MaKhuyenMai, TenKhuyenMai, PhanTramGiam, DieuKienToiThieu, NgayBatDau, NgayKetThuc, SoLuong, TrangThai)
      OUTPUT inserted.KhuyenMaiID, inserted.SoLuong
      VALUES ('TESTVOUCHER', N'Giảm giá thử nghiệm', 10, 30000, '2020-01-01', '2030-12-31', 5, 1)
    `);
    const testVoucherId = kmResult.recordset[0].KhuyenMaiID;
    const initialVoucherQty = kmResult.recordset[0].SoLuong;
    console.log(`✅ Test voucher created: ID ${testVoucherId}, Qty: ${initialVoucherQty}`);

    // Create a Test User via Registration API
    console.log('\n4. Registering test user via API...');
    const registerRes = await request('POST', '/api/register', {
      VaiTroID: customerRoleId,
      HoTen: 'Khách Hàng Thử Nghiệm',
      TenDangNhap: 'testhoadon',
      MatKhau: 'SecurePass123',
      Email: 'testhoadon@example.com',
      SoDienThoai: '0901234567',
      DiaChi: '123 Test Street'
    });
    
    if (registerRes.status !== 201) {
      throw new Error(`Failed to register test user: ${JSON.stringify(registerRes)}`);
    }
    const testUserId = registerRes.body.data.NguoiDungID;
    console.log(`✅ Test user registered: NguoiDungID = ${testUserId}`);

    // Login via API to get token
    console.log('\n5. Logging in to retrieve JWT token...');
    const loginRes = await request('POST', '/api/login', {
      TenDangNhap: 'testhoadon',
      MatKhau: 'SecurePass123'
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Failed to login: ${JSON.stringify(loginRes)}`);
    }
    const userToken = loginRes.body.token;
    console.log('✅ Logged in successfully! JWT obtained.');

    // Add items to user's shopping cart
    console.log('\n6. Adding products to the shopping cart...');
    const cartRes = await request('POST', '/api/giohang/them', {
      NguoiDungID: testUserId,
      SanPhamID: testProductId,
      SoLuong: 2 // Order 2 items
    }, userToken);

    if (cartRes.status !== 200) {
      throw new Error(`Failed to add product to cart: ${JSON.stringify(cartRes)}`);
    }
    console.log('✅ Successfully added 2 items to the cart!');

    // Checkout - Creating Invoice applying "TESTVOUCHER"
    console.log('\n7. Creating Invoice (POST /api/hoadon) with promotion...');
    const invoicePayload = {
      DiaChiNhan: '456 Đường CMT8, Quận 3, TPHCM',
      SoDienThoaiNhan: '0909090909',
      GhiChu: 'Giao nhanh, đồ ăn ít cay',
      MaKhuyenMai: 'TESTVOUCHER',
      PhuongThucThanhToan: 'Momo'
    };

    const createInvoiceRes = await request('POST', '/api/hoadon', invoicePayload, userToken);
    if (createInvoiceRes.status !== 201) {
      throw new Error(`Checkout failed: ${JSON.stringify(createInvoiceRes)}`);
    }
    const invoice = createInvoiceRes.body.data;
    console.log('✅ Checkout succeeded!');
    console.log('Created Invoice details:', {
      HoaDonID: invoice.HoaDonID,
      TongTienGoc: 100000,
      TongTienSauGiam: invoice.TongTien,
      TrangThai: invoice.TrangThai,
      MaKhuyenMai: invoice.MaKhuyenMai,
      PhuongThucThanhToan: invoice.PhuongThuc,
      TrangThaiThanhToan: invoice.TrangThaiThanhToan
    });

    if (parseFloat(invoice.TongTien) !== 90000) {
      throw new Error(`Incorrect discount calculation. Expected 90000, got ${invoice.TongTien}`);
    }
    console.log('✅ Discount calculated correctly (100k - 10% discount = 90k)!');

    // Verify Database Effects
    console.log('\n8. Checking database side effects (Triggers & SP)...');
    
    // Check product stock (Initial: 10, ordered: 2. Expected stock: 8)
    const checkProduct = await reqDb.query(`SELECT SoLuongTon FROM SanPham WHERE SanPhamID = ${testProductId}`);
    const currentProductStock = checkProduct.recordset[0].SoLuongTon;
    console.log(`Product Stock -> Initial: 10, Current: ${currentProductStock} (Expected: 8)`);
    if (currentProductStock !== 8) {
      throw new Error(`Trigger trg_ChiTietHoaDon_Insert failed! Expected stock 8, got ${currentProductStock}`);
    }
    console.log('✅ Trigger 1 (trg_ChiTietHoaDon_Insert) successfully reduced product stock!');

    // Check voucher quantity (Initial: 5, used: 1. Expected remaining: 4)
    const checkVoucher = await reqDb.query(`SELECT SoLuong FROM KhuyenMai WHERE KhuyenMaiID = ${testVoucherId}`);
    const currentVoucherQty = checkVoucher.recordset[0].SoLuong;
    console.log(`Voucher Remaining -> Initial: 5, Current: ${currentVoucherQty} (Expected: 4)`);
    if (currentVoucherQty !== 4) {
      throw new Error(`Stored procedure failed to decrement voucher quantity. Expected 4, got ${currentVoucherQty}`);
    }
    console.log('✅ Stored Procedure successfully decremented promotion quantity!');

    // Check that user's cart is now empty
    const checkCartItems = await reqDb.query(`
      SELECT COUNT(*) AS Count 
      FROM ChiTietGioHang ct
      JOIN GioHang gh ON ct.GioHangID = gh.GioHangID
      WHERE gh.NguoiDungID = ${testUserId}
    `);
    const remainingCartItems = checkCartItems.recordset[0].Count;
    console.log(`Remaining Cart Items -> Expected: 0, Current: ${remainingCartItems}`);
    if (remainingCartItems !== 0) {
      throw new Error(`Checkout failed to empty cart. Remaining items: ${remainingCartItems}`);
    }
    console.log('✅ Checkout successfully cleared the shopping cart!');

    // Verify Cancel Order (PUT /api/hoadon/:id/trangthai) & Trigger Restoration
    console.log('\n9. Testing Invoice cancellation and stock/voucher restoration...');
    const cancelRes = await request('PUT', `/api/hoadon/${invoice.HoaDonID}/trangthai`, {
      TrangThai: 'Đã hủy'
    }, userToken);

    if (cancelRes.status !== 200) {
      throw new Error(`Failed to cancel invoice: ${JSON.stringify(cancelRes)}`);
    }
    console.log('✅ Invoice cancelled successfully!');

    // Verify trigger trg_HoaDon_UpdateStatus restored stock (Expected: 10)
    const checkProductRestored = await reqDb.query(`SELECT SoLuongTon FROM SanPham WHERE SanPhamID = ${testProductId}`);
    const restoredProductStock = checkProductRestored.recordset[0].SoLuongTon;
    console.log(`Product Stock after cancellation -> Expected: 10, Current: ${restoredProductStock}`);
    if (restoredProductStock !== 10) {
      throw new Error(`Trigger trg_HoaDon_UpdateStatus failed to restore product stock! Expected 10, got ${restoredProductStock}`);
    }
    console.log('✅ Trigger 2 (trg_HoaDon_UpdateStatus) successfully restored product stock!');

    // Verify trigger trg_HoaDon_UpdateStatus restored voucher (Expected: 5)
    const checkVoucherRestored = await reqDb.query(`SELECT SoLuong FROM KhuyenMai WHERE KhuyenMaiID = ${testVoucherId}`);
    const restoredVoucherQty = checkVoucherRestored.recordset[0].SoLuong;
    console.log(`Voucher Qty after cancellation -> Expected: 5, Current: ${restoredVoucherQty}`);
    if (restoredVoucherQty !== 5) {
      throw new Error(`Trigger trg_HoaDon_UpdateStatus failed to restore voucher quantity! Expected 5, got ${restoredVoucherQty}`);
    }
    console.log('✅ Trigger 2 (trg_HoaDon_UpdateStatus) successfully restored promotion availability!');

    // Clean up test records from DB
    console.log('\n10. Cleaning up test database records...');
    await reqDb.query(`DELETE FROM ChiTietHoaDon WHERE HoaDonID = ${invoice.HoaDonID}`);
    await reqDb.query(`DELETE FROM ThanhToan WHERE HoaDonID = ${invoice.HoaDonID}`);
    await reqDb.query(`DELETE FROM HoaDon WHERE HoaDonID = ${invoice.HoaDonID}`);
    await reqDb.query(`DELETE FROM NguoiDung WHERE NguoiDungID = ${testUserId}`);
    await reqDb.query(`DELETE FROM SanPham WHERE SanPhamID = ${testProductId}`);
    await reqDb.query(`DELETE FROM KhuyenMai WHERE KhuyenMaiID = ${testVoucherId}`);
    console.log('✅ All test records cleaned up from database.');

    console.log('\n--------------------------------------------------');
    console.log('🎉 INTEGRATION TEST PASSED SUCCESSFULLY! 🎉');
    console.log('All checkout transactions, procedures, triggers,');
    console.log('and status update validations are 100% CORRECT!');
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
    // Delay slightly to print termination log cleanly
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1500);
  }
}

runTest();
