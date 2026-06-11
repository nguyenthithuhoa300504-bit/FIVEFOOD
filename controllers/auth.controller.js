const { sql } = require('../config/db.config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Đăng nhập người dùng
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, MatKhauHash } = req.body;
    const passwordInput = MatKhau || MatKhauHash;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!TenDangNhap || !passwordInput) {
      return res.status(400).json({
        message: 'Tên đăng nhập và mật khẩu không được để trống'
      });
    }

    // 2. Gọi Stored Procedure để lấy thông tin người dùng theo tên đăng nhập
    const request = new sql.Request();
    request.input('TenDangNhap', sql.VarChar(50), TenDangNhap);

    const result = await request.execute('sp_KiemTraDangNhap');

    // 3. Nếu không tìm thấy người dùng, trả về lỗi 401
    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    const user = result.recordset[0];

    // 4. So sánh mật khẩu người dùng nhập vào với mật khẩu hash trong CSDL
    const isPasswordMatch = await bcrypt.compare(passwordInput, user.MatKhauHash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    // 5. Tạo JWT Token nếu mật khẩu chính xác
    // Payload gồm NguoiDungID và VaiTroID
    const payload = {
      NguoiDungID: user.NguoiDungID,
      VaiTroID: user.VaiTroID
    };

    // Secret key lấy từ process.env.JWT_SECRET, hết hạn sau 24 giờ
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // 6. Trả về kết quả JSON gồm message thành công, token và thông tin user
    // (bỏ MatKhauHash ra khỏi response để bảo mật)
    const { MatKhauHash: userPasswordHash, ...userInfo } = user;
    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token: token,
      user: userInfo
    });

  } catch (error) {
    console.error('Lỗi trong hàm login:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xử lý đăng nhập',
      error: error.message
    });
  }
};

module.exports = {
  login
};
