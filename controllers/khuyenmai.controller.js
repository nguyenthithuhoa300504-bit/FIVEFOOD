const { sql } = require('../config/db.config');

/**
 * GET /api/khuyenmai
 * Lấy danh sách tất cả các khuyến mãi
 */
const getAllKhuyenMai = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query('SELECT * FROM KhuyenMai ORDER BY KhuyenMaiID DESC');
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getAllKhuyenMai:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
};

/**
 * GET /api/khuyenmai/:id
 * Lấy thông tin chi tiết một khuyến mãi theo ID
 */
const getKhuyenMaiById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('KhuyenMaiID', sql.Int, id);
    const result = await request.query('SELECT * FROM KhuyenMai WHERE KhuyenMaiID = @KhuyenMaiID');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy chương trình khuyến mãi với ID đã cung cấp'
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getKhuyenMaiById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin chi tiết khuyến mãi',
      error: error.message
    });
  }
};

/**
 * POST /api/khuyenmai
 * Tạo mới một khuyến mãi (Yêu cầu quyền Admin)
 */
const createKhuyenMai = async (req, res) => {
  try {
    const {
      MaKhuyenMai,
      TenKhuyenMai,
      PhanTramGiam,
      SoTienGiam,
      DieuKienToiThieu,
      NgayBatDau,
      NgayKetThuc,
      SoLuong,
      TrangThai
    } = req.body;

    // 1. Validations cơ bản
    if (!MaKhuyenMai || MaKhuyenMai.trim() === '') {
      return res.status(400).json({ message: 'Mã khuyến mãi không được để trống' });
    }
    if (!TenKhuyenMai || TenKhuyenMai.trim() === '') {
      return res.status(400).json({ message: 'Tên khuyến mãi không được để trống' });
    }
    if (!NgayBatDau || !NgayKetThuc) {
      return res.status(400).json({ message: 'Ngày bắt đầu và ngày kết thúc không được để trống' });
    }

    const start = new Date(NgayBatDau);
    const end = new Date(NgayKetThuc);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ' });
    }
    if (start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' });
    }

    const qty = parseInt(SoLuong);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn hoặc bằng 0' });
    }

    const phanTram = parseInt(PhanTramGiam || 0);
    if (isNaN(phanTram) || phanTram < 0 || phanTram > 100) {
      return res.status(400).json({ message: 'Phần trăm giảm phải từ 0 đến 100' });
    }

    const soTien = parseFloat(SoTienGiam || 0);
    if (isNaN(soTien) || soTien < 0) {
      return res.status(400).json({ message: 'Số tiền giảm phải lớn hơn hoặc bằng 0' });
    }

    const dieuKien = parseFloat(DieuKienToiThieu || 0);
    if (isNaN(dieuKien) || dieuKien < 0) {
      return res.status(400).json({ message: 'Điều kiện tối thiểu phải lớn hơn hoặc bằng 0' });
    }

    if (phanTram === 0 && soTien === 0) {
      return res.status(400).json({ message: 'Phải thiết lập Phần trăm giảm hoặc Số tiền giảm lớn hơn 0' });
    }

    // 2. Kiểm tra trùng mã khuyến mãi
    const checkRequest = new sql.Request();
    checkRequest.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai.trim().toUpperCase());
    const checkResult = await checkRequest.query('SELECT COUNT(*) AS Count FROM KhuyenMai WHERE MaKhuyenMai = @MaKhuyenMai');
    if (checkResult.recordset[0].Count > 0) {
      return res.status(400).json({
        message: 'Mã khuyến mãi này đã tồn tại trong hệ thống'
      });
    }

    // 3. Thực hiện thêm mới
    const request = new sql.Request();
    request.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai.trim().toUpperCase());
    request.input('TenKhuyenMai', sql.NVarChar(100), TenKhuyenMai.trim());
    request.input('PhanTramGiam', sql.Int, phanTram);
    request.input('SoTienGiam', sql.Decimal(18, 2), soTien);
    request.input('DieuKienToiThieu', sql.Decimal(18, 2), dieuKien);
    request.input('NgayBatDau', sql.DateTime, start);
    request.input('NgayKetThuc', sql.DateTime, end);
    request.input('SoLuong', sql.Int, qty);
    request.input('TrangThai', sql.Bit, TrangThai !== undefined ? TrangThai : 1);

    const result = await request.query(`
      INSERT INTO KhuyenMai (
        MaKhuyenMai, TenKhuyenMai, PhanTramGiam, SoTienGiam, DieuKienToiThieu, NgayBatDau, NgayKetThuc, SoLuong, TrangThai
      )
      OUTPUT inserted.*
      VALUES (
        @MaKhuyenMai, @TenKhuyenMai, @PhanTramGiam, @SoTienGiam, @DieuKienToiThieu, @NgayBatDau, @NgayKetThuc, @SoLuong, @TrangThai
      )
    `);

    return res.status(201).json({
      message: 'Tạo mã khuyến mãi thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong createKhuyenMai:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo khuyến mãi',
      error: error.message
    });
  }
};

/**
 * PUT /api/khuyenmai/:id
 * Cập nhật thông tin khuyến mãi theo ID (Yêu cầu quyền Admin)
 */
const updateKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      MaKhuyenMai,
      TenKhuyenMai,
      PhanTramGiam,
      SoTienGiam,
      DieuKienToiThieu,
      NgayBatDau,
      NgayKetThuc,
      SoLuong,
      TrangThai
    } = req.body;

    // 1. Validations cơ bản
    if (!MaKhuyenMai || MaKhuyenMai.trim() === '') {
      return res.status(400).json({ message: 'Mã khuyến mãi không được để trống' });
    }
    if (!TenKhuyenMai || TenKhuyenMai.trim() === '') {
      return res.status(400).json({ message: 'Tên khuyến mãi không được để trống' });
    }
    if (!NgayBatDau || !NgayKetThuc) {
      return res.status(400).json({ message: 'Ngày bắt đầu và ngày kết thúc không được để trống' });
    }

    const start = new Date(NgayBatDau);
    const end = new Date(NgayKetThuc);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ' });
    }
    if (start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' });
    }

    const qty = parseInt(SoLuong);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn hoặc bằng 0' });
    }

    const phanTram = parseInt(PhanTramGiam || 0);
    if (isNaN(phanTram) || phanTram < 0 || phanTram > 100) {
      return res.status(400).json({ message: 'Phần trăm giảm phải từ 0 đến 100' });
    }

    const soTien = parseFloat(SoTienGiam || 0);
    if (isNaN(soTien) || soTien < 0) {
      return res.status(400).json({ message: 'Số tiền giảm phải lớn hơn hoặc bằng 0' });
    }

    const dieuKien = parseFloat(DieuKienToiThieu || 0);
    if (isNaN(dieuKien) || dieuKien < 0) {
      return res.status(400).json({ message: 'Điều kiện tối thiểu phải lớn hơn hoặc bằng 0' });
    }

    if (phanTram === 0 && soTien === 0) {
      return res.status(400).json({ message: 'Phải thiết lập Phần trăm giảm hoặc Số tiền giảm lớn hơn 0' });
    }

    // 2. Kiểm tra trùng mã với bản ghi khác
    const checkRequest = new sql.Request();
    checkRequest.input('KhuyenMaiID', sql.Int, id);
    checkRequest.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai.trim().toUpperCase());
    const checkResult = await checkRequest.query('SELECT COUNT(*) AS Count FROM KhuyenMai WHERE MaKhuyenMai = @MaKhuyenMai AND KhuyenMaiID <> @KhuyenMaiID');
    if (checkResult.recordset[0].Count > 0) {
      return res.status(400).json({
        message: 'Mã khuyến mãi này đã được sử dụng bởi chương trình khuyến mãi khác'
      });
    }

    // 3. Thực hiện cập nhật
    const request = new sql.Request();
    request.input('KhuyenMaiID', sql.Int, id);
    request.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai.trim().toUpperCase());
    request.input('TenKhuyenMai', sql.NVarChar(100), TenKhuyenMai.trim());
    request.input('PhanTramGiam', sql.Int, phanTram);
    request.input('SoTienGiam', sql.Decimal(18, 2), soTien);
    request.input('DieuKienToiThieu', sql.Decimal(18, 2), dieuKien);
    request.input('NgayBatDau', sql.DateTime, start);
    request.input('NgayKetThuc', sql.DateTime, end);
    request.input('SoLuong', sql.Int, qty);
    request.input('TrangThai', sql.Bit, TrangThai !== undefined ? TrangThai : 1);

    const result = await request.query(`
      UPDATE KhuyenMai
      SET MaKhuyenMai = @MaKhuyenMai,
          TenKhuyenMai = @TenKhuyenMai,
          PhanTramGiam = @PhanTramGiam,
          SoTienGiam = @SoTienGiam,
          DieuKienToiThieu = @DieuKienToiThieu,
          NgayBatDau = @NgayBatDau,
          NgayKetThuc = @NgayKetThuc,
          SoLuong = @SoLuong,
          TrangThai = @TrangThai
      OUTPUT inserted.*
      WHERE KhuyenMaiID = @KhuyenMaiID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy chương trình khuyến mãi để cập nhật'
      });
    }

    return res.status(200).json({
      message: 'Cập nhật khuyến mãi thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong updateKhuyenMai:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật khuyến mãi',
      error: error.message
    });
  }
};

/**
 * DELETE /api/khuyenmai/:id
 * Xóa khuyến mãi theo ID (Yêu cầu quyền Admin)
 */
const deleteKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('KhuyenMaiID', sql.Int, id);

    const result = await request.query('DELETE FROM KhuyenMai OUTPUT deleted.KhuyenMaiID WHERE KhuyenMaiID = @KhuyenMaiID');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy chương trình khuyến mãi để xóa'
      });
    }

    return res.status(200).json({
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Lỗi trong deleteKhuyenMai:', error);
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Không thể xóa mã khuyến mãi này vì đã được áp dụng trong hóa đơn trước đó. Bạn có thể vô hiệu hóa mã này bằng cách đặt TrangThai = false.'
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa khuyến mãi',
      error: error.message
    });
  }
};

/**
 * POST /api/khuyenmai/ap-dung
 * Kiểm tra và tính toán giảm giá của voucher cho đơn hàng
 */
const apDungKhuyenMai = async (req, res) => {
  try {
    const { MaKhuyenMai, TongTien } = req.body;

    // Kiểm tra đầu vào cơ bản
    if (!MaKhuyenMai || MaKhuyenMai.trim() === '') {
      return res.status(400).json({
        message: 'Mã khuyến mãi không được bỏ trống.'
      });
    }

    const orderTotal = parseFloat(TongTien);
    if (isNaN(orderTotal) || orderTotal < 0) {
      return res.status(400).json({
        message: 'Tổng tiền đơn hàng không hợp lệ (phải là số và lớn hơn hoặc bằng 0).'
      });
    }

    // 1. Kiểm tra mã
    const request = new sql.Request();
    request.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai.trim().toUpperCase());
    const result = await request.query('SELECT * FROM KhuyenMai WHERE MaKhuyenMai = @MaKhuyenMai');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Mã khuyến mãi không tồn tại trong hệ thống.'
      });
    }

    const km = result.recordset[0];

    if (!km.TrangThai) {
      return res.status(400).json({
        message: 'Mã khuyến mãi đã bị vô hiệu hóa hoặc ngưng áp dụng.'
      });
    }

    // 2. Kiểm tra hạn dùng
    const now = new Date();
    const start = new Date(km.NgayBatDau);
    const end = new Date(km.NgayKetThuc);

    if (now < start) {
      return res.status(400).json({
        message: 'Chương trình khuyến mãi này chưa chính thức bắt đầu.'
      });
    }

    if (now > end) {
      return res.status(400).json({
        message: 'Mã khuyến mãi này đã hết hạn sử dụng.'
      });
    }

    // 3. Kiểm tra số lượng
    if (km.SoLuong <= 0) {
      return res.status(400).json({
        message: 'Mã khuyến mãi này đã hết lượt sử dụng.'
      });
    }

    // 4. Kiểm tra điều kiện tối thiểu
    if (orderTotal < km.DieuKienToiThieu) {
      return res.status(400).json({
        message: `Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này (Yêu cầu tối thiểu từ ${parseFloat(km.DieuKienToiThieu).toLocaleString('vi-VN')}đ, đơn hiện tại là ${orderTotal.toLocaleString('vi-VN')}đ).`
      });
    }

    // 5. Tính giảm giá
    let SoTienDuocGiam = 0;
    if (km.PhanTramGiam > 0) {
      SoTienDuocGiam = (orderTotal * km.PhanTramGiam) / 100;
    } else if (km.SoTienGiam > 0) {
      SoTienDuocGiam = parseFloat(km.SoTienGiam);
    }

    // Giới hạn giảm giá tối đa không vượt quá tổng giá trị đơn hàng
    if (SoTienDuocGiam > orderTotal) {
      SoTienDuocGiam = orderTotal;
    }

    const TongTienSauGiam = orderTotal - SoTienDuocGiam;

    return res.status(200).json({
      message: 'Áp dụng mã khuyến mãi thành công.',
      data: {
        KhuyenMaiID: km.KhuyenMaiID,
        MaKhuyenMai: km.MaKhuyenMai,
        TenKhuyenMai: km.TenKhuyenMai,
        PhanTramGiam: km.PhanTramGiam,
        SoTienGiam: km.SoTienGiam,
        DieuKienToiThieu: km.DieuKienToiThieu,
        TongTienGoc: orderTotal,
        SoTienDuocGiam: SoTienDuocGiam,
        TongTienSauGiam: TongTienSauGiam
      }
    });

  } catch (error) {
    console.error('Lỗi trong apDungKhuyenMai:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi áp dụng mã khuyến mãi.',
      error: error.message
    });
  }
};

module.exports = {
  getAllKhuyenMai,
  getKhuyenMaiById,
  createKhuyenMai,
  updateKhuyenMai,
  deleteKhuyenMai,
  apDungKhuyenMai
};
