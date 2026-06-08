const { sql } = require('../config/db.config');

/**
 * Lấy thời điểm hiện tại theo giờ Việt Nam (UTC+7) dưới dạng Date object.
 * Dùng cho các trường NgayThanhToan, tránh sai lệch khi server không set timezone VN.
 */
function getNowVN() {
  // Tạo ISO string với offset +07:00 rồi parse lại thành Date
  // Date object luôn lưu UTC bên trong, nhưng việc tạo từ +07:00 đảm bảo timestamp đúng
  const now = new Date();
  return now; // new Date() đã là UTC, SQL Server sẽ nhận đúng timestamp
  // Lưu ý: GETDATE() trong SQL Server trả về giờ server, còn khi Node.js truyền
  // Date object qua mssql driver thì driver tự chuyển sang UTC rồi SQL Server lưu đúng.
}

/**
 * GET /api/thanhtoan
 * Lấy danh sách tất cả thông tin thanh toán (Admin xem được hết, Khách hàng chỉ xem được của mình hoặc lọc theo hoadon)
 */
const getAllThanhToan = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.RoleId === 1;
    const currentUserId = req.user ? req.user.NguoiDungID : null;

    const request = new sql.Request();
    let queryStr = `
      SELECT 
        tt.ThanhToanID,
        tt.HoaDonID,
        tt.PhuongThuc,
        tt.TrangThaiThanhToan,
        tt.NgayThanhToan,
        hd.NguoiDungID,
        hd.TongTien
      FROM ThanhToan tt
      INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID
    `;

    // Nếu không phải admin, chỉ cho phép xem thanh toán của chính mình
    if (!isAdmin) {
      if (!currentUserId) {
        return res.status(401).json({
          message: 'Bạn cần đăng nhập để truy cập thông tin thanh toán.'
        });
      }
      request.input('NguoiDungID', sql.Int, currentUserId);
      queryStr += ` WHERE hd.NguoiDungID = @NguoiDungID`;
    }

    queryStr += ` ORDER BY tt.ThanhToanID DESC`;

    const result = await request.query(queryStr);
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getAllThanhToan:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách thanh toán.',
      error: error.message
    });
  }
};

/**
 * GET /api/thanhtoan/:hoadonid
 * Lấy thông tin thanh toán chi tiết của một hóa đơn theo HoaDonID
 */
const getThanhToanByHoaDonId = async (req, res) => {
  try {
    const { hoadonid } = req.params;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    const request = new sql.Request();
    request.input('HoaDonID', sql.Int, hoadonid);

    // Truy vấn thông tin thanh toán cùng thông tin sở hữu hóa đơn để xác thực
    const result = await request.query(`
      SELECT 
        tt.ThanhToanID,
        tt.HoaDonID,
        tt.PhuongThuc,
        tt.TrangThaiThanhToan,
        tt.NgayThanhToan,
        hd.NguoiDungID
      FROM ThanhToan tt
      INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID
      WHERE tt.HoaDonID = @HoaDonID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin thanh toán cho hóa đơn này.'
      });
    }

    const thanhToan = result.recordset[0];

    // Kiểm tra quyền sở hữu (Chỉ Admin hoặc chính chủ đơn hàng được xem)
    if (!isAdmin && thanhToan.NguoiDungID !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập thông tin thanh toán của hóa đơn này.'
      });
    }

    // Loại bỏ NguoiDungID khỏi kết quả trả về để sạch sẽ
    delete thanhToan.NguoiDungID;

    return res.status(200).json(thanhToan);
  } catch (error) {
    console.error('Lỗi trong getThanhToanByHoaDonId:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin thanh toán.',
      error: error.message
    });
  }
};

/**
 * POST /api/thanhtoan
 * Tạo mới thông tin thanh toán cho một hóa đơn
 */
const createThanhToan = async (req, res) => {
  try {
    const { HoaDonID, PhuongThuc, TrangThaiThanhToan, NgayThanhToan } = req.body;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    // 1. Validate bắt buộc
    if (!HoaDonID) {
      return res.status(400).json({
        message: 'HoaDonID không được để trống.'
      });
    }

    // 2. Validate phương thức thanh toán
    const validPhuongThuc = ['Tiền mặt', 'Chuyển khoản', 'Momo'];
    if (PhuongThuc && !validPhuongThuc.includes(PhuongThuc)) {
      return res.status(400).json({
        message: `Phương thức thanh toán không hợp lệ. Vui lòng chọn một trong: ${validPhuongThuc.join(', ')}`
      });
    }

    // 3. Validate trạng thái thanh toán
    const validTrangThai = ['Chưa thanh toán', 'Đã thanh toán'];
    const status = TrangThaiThanhToan || 'Chưa thanh toán';
    if (!validTrangThai.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái thanh toán không hợp lệ. Vui lòng chọn một trong: ${validTrangThai.join(', ')}`
      });
    }

    // 4. Kiểm tra xem hóa đơn có tồn tại không
    const checkInvoiceRequest = new sql.Request();
    checkInvoiceRequest.input('HoaDonID', sql.Int, HoaDonID);
    const invoiceResult = await checkInvoiceRequest.query(`
      SELECT NguoiDungID FROM HoaDon WHERE HoaDonID = @HoaDonID
    `);

    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Hóa đơn không tồn tại.'
      });
    }

    const invoice = invoiceResult.recordset[0];

    // Quyền sở hữu: Chỉ Admin hoặc chính chủ hóa đơn được phép tạo thanh toán
    if (!isAdmin && invoice.NguoiDungID !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn không có quyền tạo thông tin thanh toán cho hóa đơn này.'
      });
    }

    // 5. Kiểm tra xem đã có bản ghi thanh toán cho hóa đơn này chưa (vì là quan hệ 1-1 UNIQUE)
    const checkPaymentRequest = new sql.Request();
    checkPaymentRequest.input('HoaDonID', sql.Int, HoaDonID);
    const paymentResult = await checkPaymentRequest.query(`
      SELECT ThanhToanID FROM ThanhToan WHERE HoaDonID = @HoaDonID
    `);

    if (paymentResult.recordset.length > 0) {
      return res.status(400).json({
        message: 'Hóa đơn này đã có thông tin thanh toán. Vui lòng sử dụng phương thức cập nhật (PUT).'
      });
    }

    // Xác định Ngày thanh toán
    let finalNgayThanhToan = null;
    if (status === 'Đã thanh toán') {
      finalNgayThanhToan = NgayThanhToan ? new Date(NgayThanhToan) : getNowVN();
    }

    // 6. Tiến hành chèn dữ liệu
    const insertRequest = new sql.Request();
    insertRequest.input('HoaDonID', sql.Int, HoaDonID);
    insertRequest.input('PhuongThuc', sql.NVarChar(50), PhuongThuc || 'Tiền mặt');
    insertRequest.input('TrangThaiThanhToan', sql.NVarChar(50), status);
    insertRequest.input('NgayThanhToan', sql.DateTime, finalNgayThanhToan);

    const result = await insertRequest.query(`
      INSERT INTO ThanhToan (HoaDonID, PhuongThuc, TrangThaiThanhToan, NgayThanhToan)
      OUTPUT inserted.ThanhToanID, inserted.HoaDonID, inserted.PhuongThuc, inserted.TrangThaiThanhToan, inserted.NgayThanhToan
      VALUES (@HoaDonID, @PhuongThuc, @TrangThaiThanhToan, @NgayThanhToan)
    `);

    return res.status(201).json({
      message: 'Tạo thông tin thanh toán thành công.',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong createThanhToan:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo thông tin thanh toán.',
      error: error.message
    });
  }
};

/**
 * PUT /api/thanhtoan/:hoadonid
 * Cập nhật thông tin thanh toán cho một hóa đơn
 */
const updateThanhToan = async (req, res) => {
  try {
    const { hoadonid } = req.params;
    const { PhuongThuc, TrangThaiThanhToan, NgayThanhToan } = req.body;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    // 1. Kiểm tra sự tồn tại của bản ghi thanh toán và quyền sở hữu
    const checkRequest = new sql.Request();
    checkRequest.input('HoaDonID', sql.Int, hoadonid);
    const checkResult = await checkRequest.query(`
      SELECT 
        tt.ThanhToanID,
        tt.HoaDonID,
        tt.PhuongThuc,
        tt.TrangThaiThanhToan,
        tt.NgayThanhToan,
        hd.NguoiDungID
      FROM ThanhToan tt
      INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID
      WHERE tt.HoaDonID = @HoaDonID
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin thanh toán của hóa đơn này để cập nhật.'
      });
    }

    const existingPayment = checkResult.recordset[0];

    // Quyền sở hữu: Chỉ Admin hoặc chủ hóa đơn mới được sửa thông tin thanh toán
    if (!isAdmin && existingPayment.NguoiDungID !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn không có quyền cập nhật thông tin thanh toán của hóa đơn này.'
      });
    }

    // 2. Validate phương thức thanh toán mới nếu có truyền lên
    const validPhuongThuc = ['Tiền mặt', 'Chuyển khoản', 'Momo'];
    if (PhuongThuc && !validPhuongThuc.includes(PhuongThuc)) {
      return res.status(400).json({
        message: `Phương thức thanh toán không hợp lệ. Vui lòng chọn một trong: ${validPhuongThuc.join(', ')}`
      });
    }

    // 3. Validate trạng thái thanh toán mới nếu có truyền lên
    const validTrangThai = ['Chưa thanh toán', 'Đã thanh toán'];
    if (TrangThaiThanhToan && !validTrangThai.includes(TrangThaiThanhToan)) {
      return res.status(400).json({
        message: `Trạng thái thanh toán không hợp lệ. Vui lòng chọn một trong: ${validTrangThai.join(', ')}`
      });
    }

    // 4. Chuẩn bị giá trị cập nhật
    const finalPhuongThuc = PhuongThuc || existingPayment.PhuongThuc;
    const finalTrangThai = TrangThaiThanhToan || existingPayment.TrangThaiThanhToan;
    
    let finalNgayThanhToan = existingPayment.NgayThanhToan;
    if (TrangThaiThanhToan !== undefined) {
      if (finalTrangThai === 'Đã thanh toán') {
        // Nếu chuyển sang Đã thanh toán, lấy NgayThanhToan mới hoặc hiện tại (hoặc mặc định GETDATE() nếu cũ null)
        finalNgayThanhToan = NgayThanhToan ? new Date(NgayThanhToan) : (existingPayment.NgayThanhToan || getNowVN());
      } else {
        // Nếu chuyển về Chưa thanh toán, xóa ngày thanh toán
        finalNgayThanhToan = null;
      }
    } else if (NgayThanhToan !== undefined) {
      finalNgayThanhToan = NgayThanhToan ? new Date(NgayThanhToan) : null;
    }

    // 5. Tiến hành cập nhật
    const updateRequest = new sql.Request();
    updateRequest.input('HoaDonID', sql.Int, hoadonid);
    updateRequest.input('PhuongThuc', sql.NVarChar(50), finalPhuongThuc);
    updateRequest.input('TrangThaiThanhToan', sql.NVarChar(50), finalTrangThai);
    updateRequest.input('NgayThanhToan', sql.DateTime, finalNgayThanhToan);

    const result = await updateRequest.query(`
      UPDATE ThanhToan
      SET PhuongThuc = @PhuongThuc,
          TrangThaiThanhToan = @TrangThaiThanhToan,
          NgayThanhToan = @NgayThanhToan
      OUTPUT inserted.ThanhToanID, inserted.HoaDonID, inserted.PhuongThuc, inserted.TrangThaiThanhToan, inserted.NgayThanhToan
      WHERE HoaDonID = @HoaDonID
    `);

    return res.status(200).json({
      message: 'Cập nhật thông tin thanh toán thành công.',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong updateThanhToan:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật thông tin thanh toán.',
      error: error.message
    });
  }
};

/**
 * DELETE /api/thanhtoan/:hoadonid
 * Xóa thông tin thanh toán của một hóa đơn
 */
const deleteThanhToan = async (req, res) => {
  try {
    const { hoadonid } = req.params;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    // 1. Kiểm tra sự tồn tại và lấy chủ sở hữu hóa đơn
    const checkRequest = new sql.Request();
    checkRequest.input('HoaDonID', sql.Int, hoadonid);
    const checkResult = await checkRequest.query(`
      SELECT tt.ThanhToanID, hd.NguoiDungID
      FROM ThanhToan tt
      INNER JOIN HoaDon hd ON tt.HoaDonID = hd.HoaDonID
      WHERE tt.HoaDonID = @HoaDonID
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin thanh toán của hóa đơn này để xóa.'
      });
    }

    const payment = checkResult.recordset[0];

    // Quyền sở hữu: Chỉ Admin mới được quyền xóa thông tin thanh toán (hoặc tùy quy định dự án)
    if (!isAdmin) {
      return res.status(403).json({
        message: 'Chỉ Quản trị viên mới được phép xóa bản ghi thanh toán.'
      });
    }

    // 2. Thực thi xóa
    const deleteRequest = new sql.Request();
    deleteRequest.input('HoaDonID', sql.Int, hoadonid);
    await deleteRequest.query(`
      DELETE FROM ThanhToan WHERE HoaDonID = @HoaDonID
    `);

    return res.status(200).json({
      message: 'Xóa thông tin thanh toán thành công.'
    });

  } catch (error) {
    console.error('Lỗi trong deleteThanhToan:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa thông tin thanh toán.',
      error: error.message
    });
  }
};

module.exports = {
  getAllThanhToan,
  getThanhToanByHoaDonId,
  createThanhToan,
  updateThanhToan,
  deleteThanhToan
};
