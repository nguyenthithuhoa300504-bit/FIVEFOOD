const { sql } = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Đăng ký người dùng mới
 * POST /api/register
 */
const register = async (req, res) => {
  try {
    const { VaiTroID, HoTen, TenDangNhap, MatKhau, Email, SoDienThoai, DiaChi } = req.body;

    // 1. Kiểm tra các trường bắt buộc
    if (!TenDangNhap || !MatKhau || !HoTen || VaiTroID === undefined) {
      return res.status(400).json({
        message: 'Các trường bắt buộc (TenDangNhap, MatKhau, HoTen, VaiTroID) không được để trống.'
      });
    }

    if (TenDangNhap.trim().includes(' ')) {
      return res.status(400).json({
        message: 'Tên đăng nhập không được chứa khoảng trắng.'
      });
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const MatKhauHash = await bcrypt.hash(MatKhau, salt);

    // 3. Thực hiện thêm người dùng vào cơ sở dữ liệu
    const request = new sql.Request();
    request.input('VaiTroID', sql.Int, VaiTroID);
    request.input('HoTen', sql.NVarChar(100), HoTen.trim());
    request.input('TenDangNhap', sql.VarChar(50), TenDangNhap.trim());
    request.input('MatKhauHash', sql.VarChar(255), MatKhauHash);
    request.input('Email', sql.VarChar(100), Email ? Email.trim() : null);
    request.input('SoDienThoai', sql.VarChar(15), SoDienThoai ? SoDienThoai.trim() : null);
    request.input('DiaChi', sql.NVarChar(255), DiaChi ? DiaChi.trim() : null);

    const result = await request.query(`
      INSERT INTO NguoiDung (VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi)
      OUTPUT inserted.NguoiDungID, inserted.VaiTroID, inserted.HoTen, inserted.TenDangNhap, inserted.Email, inserted.SoDienThoai, inserted.DiaChi, inserted.NgayTao
      VALUES (@VaiTroID, @HoTen, @TenDangNhap, @MatKhauHash, @Email, @SoDienThoai, @DiaChi)
    `);

    return res.status(201).json({
      message: 'Đăng ký người dùng thành công.',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong hàm register:', error);

    // Xử lý lỗi trùng UNIQUE KEY (TenDangNhap hoặc Email)
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        message: 'Tên đăng nhập hoặc Email đã tồn tại trong hệ thống.'
      });
    }

    // Xử lý lỗi ràng buộc khóa ngoại (ví dụ: VaiTroID không tồn tại)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Vai trò (VaiTroID) không hợp lệ.'
      });
    }

    return res.status(500).json({
      message: 'Lỗi hệ thống khi đăng ký người dùng.',
      error: error.message
    });
  }
};

/**
 * Đăng nhập hệ thống
 * POST /api/login
 */
const login = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({
        message: 'Tên đăng nhập và mật khẩu không được để trống.'
      });
    }

    // Tìm người dùng trong CSDL bằng TenDangNhap
    const request = new sql.Request();
    request.input('TenDangNhap', sql.VarChar(50), TenDangNhap.trim());
    
    const result = await request.query(`
      SELECT NguoiDungID, VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi, NgayTao
      FROM NguoiDung
      WHERE TenDangNhap = @TenDangNhap
    `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: 'Sai tài khoản hoặc mật khẩu.'
      });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu
    const isPasswordMatch = await bcrypt.compare(MatKhau, user.MatKhauHash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Sai tài khoản hoặc mật khẩu.'
      });
    }

    // Tạo JWT Token
    const payload = {
      NguoiDungID: user.NguoiDungID,
      VaiTroID: user.VaiTroID
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // Trả về kết quả (loại bỏ MatKhauHash để bảo mật)
    const { MatKhauHash, ...userInfo } = user;
    return res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: userInfo
    });

  } catch (error) {
    console.error('Lỗi trong hàm login:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xử lý đăng nhập.',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách tất cả người dùng
 * GET /api/nguoidung
 */
const getAllNguoiDung = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT NguoiDungID, VaiTroID, HoTen, TenDangNhap, Email, SoDienThoai, DiaChi, NgayTao
      FROM NguoiDung
      ORDER BY NgayTao DESC
    `);
    
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getAllNguoiDung:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách người dùng.',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin chi tiết một người dùng theo ID
 * GET /api/nguoidung/:id
 */
const getNguoiDungById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, id);

    const result = await request.query(`
      SELECT NguoiDungID, VaiTroID, HoTen, TenDangNhap, Email, SoDienThoai, DiaChi, NgayTao
      FROM NguoiDung
      WHERE NguoiDungID = @NguoiDungID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng với ID đã cung cấp.'
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getNguoiDungById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin người dùng.',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin người dùng
 * PUT /api/nguoidung/:id
 */
const updateNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const { VaiTroID, HoTen, Email, SoDienThoai, DiaChi, MatKhau } = req.body;

    // 1. Kiểm tra xem người dùng có tồn tại không
    const checkRequest = new sql.Request();
    checkRequest.input('NguoiDungID', sql.Int, id);
    const checkResult = await checkRequest.query(`
      SELECT NguoiDungID, VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi
      FROM NguoiDung
      WHERE NguoiDungID = @NguoiDungID
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng để cập nhật.'
      });
    }

    const existingUser = checkResult.recordset[0];

    // 2. Chuẩn bị giá trị cập nhật (nếu không cung cấp thì giữ nguyên giá trị cũ)
    const updatedHoTen = HoTen !== undefined ? HoTen.trim() : existingUser.HoTen;
    const updatedVaiTroID = VaiTroID !== undefined ? VaiTroID : existingUser.VaiTroID;
    const updatedEmail = Email !== undefined ? (Email ? Email.trim() : null) : existingUser.Email;
    const updatedSoDienThoai = SoDienThoai !== undefined ? (SoDienThoai ? SoDienThoai.trim() : null) : existingUser.SoDienThoai;
    const updatedDiaChi = DiaChi !== undefined ? (DiaChi ? DiaChi.trim() : null) : existingUser.DiaChi;
    
    let updatedMatKhauHash = existingUser.MatKhauHash;
    if (MatKhau) {
      const salt = await bcrypt.genSalt(10);
      updatedMatKhauHash = await bcrypt.hash(MatKhau, salt);
    }

    // Kiểm tra tính hợp lệ của HoTen
    if (!updatedHoTen) {
      return res.status(400).json({
        message: 'Họ tên không được để trống.'
      });
    }

    // 3. Thực hiện câu lệnh cập nhật
    const updateRequest = new sql.Request();
    updateRequest.input('NguoiDungID', sql.Int, id);
    updateRequest.input('VaiTroID', sql.Int, updatedVaiTroID);
    updateRequest.input('HoTen', sql.NVarChar(100), updatedHoTen);
    updateRequest.input('MatKhauHash', sql.VarChar(255), updatedMatKhauHash);
    updateRequest.input('Email', sql.VarChar(100), updatedEmail);
    updateRequest.input('SoDienThoai', sql.VarChar(15), updatedSoDienThoai);
    updateRequest.input('DiaChi', sql.NVarChar(255), updatedDiaChi);

    const updateResult = await updateRequest.query(`
      UPDATE NguoiDung
      SET VaiTroID = @VaiTroID,
          HoTen = @HoTen,
          MatKhauHash = @MatKhauHash,
          Email = @Email,
          SoDienThoai = @SoDienThoai,
          DiaChi = @DiaChi
      OUTPUT inserted.NguoiDungID, inserted.VaiTroID, inserted.HoTen, inserted.TenDangNhap, inserted.Email, inserted.SoDienThoai, inserted.DiaChi, inserted.NgayTao
      WHERE NguoiDungID = @NguoiDungID
    `);

    return res.status(200).json({
      message: 'Cập nhật thông tin người dùng thành công.',
      data: updateResult.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong hàm updateNguoiDung:', error);

    // Xử lý lỗi trùng UNIQUE KEY (Email)
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        message: 'Email này đã tồn tại trong hệ thống.'
      });
    }

    // Xử lý lỗi ràng buộc khóa ngoại (VaiTroID không tồn tại)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Vai trò (VaiTroID) không hợp lệ.'
      });
    }

    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật thông tin người dùng.',
      error: error.message
    });
  }
};

/**
 * Xóa người dùng
 * DELETE /api/nguoidung/:id
 */
const deleteNguoiDung = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, id);

    const result = await request.query(`
      DELETE FROM NguoiDung
      OUTPUT deleted.NguoiDungID
      WHERE NguoiDungID = @NguoiDungID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng để xóa.'
      });
    }

    return res.status(200).json({
      message: 'Xóa người dùng thành công.'
    });

  } catch (error) {
    console.error('Lỗi trong hàm deleteNguoiDung:', error);

    // Xử lý lỗi ràng buộc khóa ngoại (ví dụ: người dùng đang có hóa đơn, giỏ hàng, vv)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Không thể xóa người dùng này vì đang có dữ liệu liên quan khác (ví dụ: giỏ hàng, hóa đơn).'
      });
    }

    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa người dùng.',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getAllNguoiDung,
  getNguoiDungById,
  updateNguoiDung,
  deleteNguoiDung
};
