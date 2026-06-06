const { sql } = require('../config/db.config');

/**
 * POST /api/hoadon
 * Tạo hóa đơn mới từ giỏ hàng hiện tại của người dùng.
 * Áp dụng khuyến mãi, thực hiện giao dịch an toàn thông qua Stored Procedure sp_TaoHoaDon.
 */
const createHoaDon = async (req, res) => {
  try {
    // Ưu tiên lấy NguoiDungID từ token đã xác thực, nếu không có thì lấy từ body
    const nguoiDungId = req.user ? req.user.NguoiDungID : req.body.NguoiDungID;
    const { MaKhuyenMai, DiaChiNhan, SoDienThoaiNhan, GhiChu, PhuongThucThanhToan, ViDo, KinhDo } = req.body;

    // Validation các trường bắt buộc
    if (!nguoiDungId) {
      return res.status(400).json({
        message: 'Thiếu thông tin người dùng (NguoiDungID).'
      });
    }

    if (!DiaChiNhan || DiaChiNhan.trim() === '') {
      return res.status(400).json({
        message: 'Địa chỉ nhận hàng không được để trống.'
      });
    }

    if (!SoDienThoaiNhan || SoDienThoaiNhan.trim() === '') {
      return res.status(400).json({
        message: 'Số điện thoại nhận hàng không được để trống.'
      });
    }

    // Kiểm tra xem có sản phẩm nào trong giỏ hàng đang tạm ngưng bán hay không
    const checkCartRequest = new sql.Request();
    checkCartRequest.input('NguoiDungID', sql.Int, nguoiDungId);
    const cartProductsResult = await checkCartRequest.query(`
      SELECT sp.TenSanPham 
      FROM ChiTietGioHang ct
      JOIN GioHang gh ON ct.GioHangID = gh.GioHangID
      JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      WHERE gh.NguoiDungID = @NguoiDungID AND sp.TrangThai = 0
    `);

    if (cartProductsResult.recordset.length > 0) {
      const suspendedProductNames = cartProductsResult.recordset.map(r => `"${r.TenSanPham}"`).join(', ');
      return res.status(400).json({
        message: `Sản phẩm ${suspendedProductNames} đang tạm ngưng bán. Vui lòng loại bỏ khỏi giỏ hàng trước khi thanh toán.`
      });
    }

    // Ánh xạ phương thức thanh toán từ frontend khớp với CHECK CONSTRAINT của CSDL:
    // 'Ví MoMo' -> 'Momo', 'Chuyển khoản ngân hàng' -> 'Chuyển khoản'
    let phuongThucDb = 'Tiền mặt';
    if (PhuongThucThanhToan) {
      const trimmed = PhuongThucThanhToan.trim();
      if (trimmed === 'Ví MoMo' || trimmed === 'Momo') {
        phuongThucDb = 'Momo';
      } else if (trimmed === 'Chuyển khoản ngân hàng' || trimmed === 'Chuyển khoản') {
        phuongThucDb = 'Chuyển khoản';
      } else {
        phuongThucDb = trimmed;
      }
    }

    // Thực thi stored procedure sp_TaoHoaDon
    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, nguoiDungId);
    request.input('MaKhuyenMai', sql.VarChar(50), MaKhuyenMai ? MaKhuyenMai.trim().toUpperCase() : null);
    request.input('DiaChiNhan', sql.NVarChar(255), DiaChiNhan.trim());
    request.input('SoDienThoaiNhan', sql.VarChar(15), SoDienThoaiNhan.trim());
    request.input('GhiChu', sql.NVarChar(500), GhiChu ? GhiChu.trim() : null);
    request.input('PhuongThucThanhToan', sql.NVarChar(50), phuongThucDb);
    request.input('ViDo', sql.Decimal(10, 8), ViDo ? parseFloat(ViDo) : null);
    request.input('KinhDo', sql.Decimal(11, 8), KinhDo ? parseFloat(KinhDo) : null);
    
    // Khai báo tham số OUTPUT
    request.output('NewHoaDonID', sql.Int);

    const result = await request.execute('sp_TaoHoaDon');
    const newHoaDonId = result.output.NewHoaDonID;

    // Lấy thông tin hóa đơn vừa tạo để phản hồi cho client
    const infoRequest = new sql.Request();
    infoRequest.input('HoaDonID', sql.Int, newHoaDonId);
    const invoiceResult = await infoRequest.query(`
      SELECT 
        hd.HoaDonID,
        hd.NguoiDungID,
        hd.TongTien,
        hd.TrangThai,
        hd.DiaChiNhan,
        hd.SoDienThoaiNhan,
        hd.GhiChu,
        hd.NgayDat,
        hd.ViDo,
        hd.KinhDo,
        tt.PhuongThuc,
        tt.TrangThaiThanhToan,
        km.MaKhuyenMai,
        km.TenKhuyenMai
      FROM HoaDon hd
      LEFT JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
      LEFT JOIN KhuyenMai km ON hd.KhuyenMaiID = km.KhuyenMaiID
      WHERE hd.HoaDonID = @HoaDonID
    `);

    return res.status(201).json({
      message: 'Đặt hàng và tạo hóa đơn thành công!',
      data: invoiceResult.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong createHoaDon:', error);
    
    // Xử lý các lỗi được ném ra từ stored procedure bằng RAISERROR
    let userMessage = error.message || 'Không thể tạo hóa đơn.';
    
    // Nếu lỗi liên quan đến Khuyến mãi, trả về thông báo mã giảm giá hết hiệu lực
    if (error.message && (error.message.includes('KhuyenMai') || error.message.includes('khuyến mãi') || error.message.includes('Khuyến mãi') || error.message.includes('khuyenmai'))) {
      userMessage = 'Mã giảm giá hết hiệu lực.';
    }
    
    return res.status(400).json({
      message: userMessage,
      error: error.message
    });
  }
};

/**
 * GET /api/hoadon
 * Lấy danh sách hóa đơn.
 * - Admin: Xem được toàn bộ hóa đơn trong hệ thống.
 * - Khách hàng: Chỉ xem được danh sách hóa đơn của chính mình.
 */
const getAllHoaDon = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.RoleId === 1;
    const currentUserId = req.user ? req.user.NguoiDungID : null;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện chức năng này.'
      });
    }

    const request = new sql.Request();
    let queryStr = `
      SELECT 
        hd.HoaDonID,
        hd.NguoiDungID,
        nd.HoTen AS TenKhachHang,
        hd.TongTien,
        hd.TrangThai,
        hd.DiaChiNhan,
        hd.SoDienThoaiNhan,
        hd.NgayDat,
        tt.PhuongThuc,
        tt.TrangThaiThanhToan,
        km.MaKhuyenMai
      FROM HoaDon hd
      LEFT JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID
      LEFT JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
      LEFT JOIN KhuyenMai km ON hd.KhuyenMaiID = km.KhuyenMaiID
    `;

    // Nếu không phải admin, lọc theo NguoiDungID của chính user
    if (!isAdmin) {
      request.input('NguoiDungID', sql.Int, currentUserId);
      queryStr += ` WHERE hd.NguoiDungID = @NguoiDungID`;
    }

    queryStr += ` ORDER BY hd.HoaDonID DESC`;

    const result = await request.query(queryStr);
    return res.status(200).json(result.recordset);

  } catch (error) {
    console.error('Lỗi trong getAllHoaDon:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách hóa đơn.',
      error: error.message
    });
  }
};

/**
 * GET /api/hoadon/:id
 * Lấy chi tiết thông tin hóa đơn theo ID bao gồm: thông tin chung, danh sách sản phẩm mua, trạng thái thanh toán.
 * Kiểm tra quyền sở hữu (chỉ cho phép admin hoặc chính chủ xem).
 */
const getHoaDonById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để xem chi tiết hóa đơn.'
      });
    }

    // 1. Lấy thông tin chung của hóa đơn
    const request = new sql.Request();
    request.input('HoaDonID', sql.Int, id);
    
    const invoiceResult = await request.query(`
      SELECT 
        hd.HoaDonID,
        hd.NguoiDungID,
        nd.HoTen AS TenKhachHang,
        nd.Email AS EmailKhachHang,
        hd.TongTien,
        hd.TrangThai,
        hd.DiaChiNhan,
        hd.SoDienThoaiNhan,
        hd.GhiChu,
        hd.NgayDat,
        hd.ViDo,
        hd.KinhDo,
        km.MaKhuyenMai,
        km.TenKhuyenMai,
        km.PhanTramGiam,
        km.SoTienGiam
      FROM HoaDon hd
      LEFT JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID
      LEFT JOIN KhuyenMai km ON hd.KhuyenMaiID = km.KhuyenMaiID
      WHERE hd.HoaDonID = @HoaDonID
    `);

    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy hóa đơn với ID đã cung cấp.'
      });
    }

    const invoice = invoiceResult.recordset[0];

    // 2. Bảo mật: Khách thường chỉ được xem hóa đơn của chính mình
    if (!isAdmin && invoice.NguoiDungID !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập vào thông tin hóa đơn này.'
      });
    }

    // 3. Lấy chi tiết các sản phẩm trong hóa đơn
    const itemsResult = await request.query(`
      SELECT 
        ct.ChiTietHoaDonID,
        ct.SanPhamID,
        sp.TenSanPham,
        sp.HinhAnh,
        ct.SoLuong,
        ct.DonGia,
        ct.ThanhTien
      FROM ChiTietHoaDon ct
      JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      WHERE ct.HoaDonID = @HoaDonID
    `);

    // 4. Lấy thông tin thanh toán
    const paymentResult = await request.query(`
      SELECT 
        ThanhToanID,
        PhuongThuc,
        TrangThaiThanhToan,
        NgayThanhToan
      FROM ThanhToan
      WHERE HoaDonID = @HoaDonID
    `);

    // Gộp kết quả trả về
    return res.status(200).json({
      ...invoice,
      ChiTiet: itemsResult.recordset,
      ThanhToan: paymentResult.recordset[0] || null
    });

  } catch (error) {
    console.error('Lỗi trong getHoaDonById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy chi tiết hóa đơn.',
      error: error.message
    });
  }
};

/**
 * PUT /api/hoadon/:id/trangthai
 * Cập nhật trạng thái hóa đơn.
 * Quy định phân quyền:
 * - Admin: Có quyền thay đổi sang bất kỳ trạng thái hợp lệ nào ('Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy').
 * - Khách hàng: Chỉ có quyền Hủy đơn hàng ('Đã hủy') khi đơn hàng đang ở trạng thái 'Chờ xác nhận'.
 * 
 * Lưu ý: Khi trạng thái hóa đơn cập nhật sang 'Đã hủy', Database Triggers (trg_HoaDon_UpdateStatus) sẽ tự động kích hoạt:
 * 1. Hoàn lại tồn kho cho các sản phẩm trong chi tiết hóa đơn.
 * 2. Cộng trả lại số lượng cho mã khuyến mãi đã sử dụng.
 */
const updateTrangThai = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrangThai } = req.body;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện chức năng này.'
      });
    }

    const validStatuses = ['Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
    if (!TrangThai || !validStatuses.includes(TrangThai)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Vui lòng chọn một trong các trạng thái: ${validStatuses.join(', ')}`
      });
    }

    // 1. Kiểm tra sự tồn tại của hóa đơn
    const checkRequest = new sql.Request();
    checkRequest.input('HoaDonID', sql.Int, id);
    const checkResult = await checkRequest.query('SELECT NguoiDungID, TrangThai FROM HoaDon WHERE HoaDonID = @HoaDonID');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy hóa đơn cần cập nhật.'
      });
    }

    const currentInvoice = checkResult.recordset[0];

    // 2. Kiểm tra phân quyền cập nhật trạng thái
    if (!isAdmin) {
      // Khách hàng thông thường — chỉ được cập nhật đơn hàng của chính mình
      if (currentInvoice.NguoiDungID !== currentUserId) {
        return res.status(403).json({
          message: 'Bạn không có quyền thay đổi trạng thái của hóa đơn này.'
        });
      }

      // Khách hàng chỉ được phép:
      // - Hủy đơn (Đã hủy) khi đơn đang Chờ xác nhận
      // - Hoàn thành đơn (Hoàn thành) khi đơn đang Đang giao (hệ thống simulation tự động)
      if (TrangThai === 'Đã hủy') {
        // Cho phép hủy khi đơn đang "Chờ xác nhận" (hủy chủ động)
        // hoặc khi đơn đang "Đang giao" (trả lại hàng khi shipper đến nơi)
        if (currentInvoice.TrangThai !== 'Chờ xác nhận' && currentInvoice.TrangThai !== 'Đang giao') {
          return res.status(400).json({
            message: `Không thể hủy đơn hàng này. Trạng thái hiện tại: "${currentInvoice.TrangThai}".`
          });
        }
      } else if (TrangThai === 'Ho\u00e0n th\u00e0nh') {
        // Cho phép user hoàn thành đơn khi đang "Chờ xác nhận" hoặc "Đang giao"
        if (currentInvoice.TrangThai !== 'Chờ xác nhận' && currentInvoice.TrangThai !== 'Đang giao') {
          return res.status(400).json({
            message: `Không thể hoàn thành đơn hàng ở trạng thái hiện tại: "${currentInvoice.TrangThai}".`
          });
        }
      } else {
        return res.status(403).json({
          message: 'Bạn không có quyền thay đổi trạng thái này. Chỉ Admin mới có thể thay đổi trạng thái khác.'
        });
      }
    }

    // Không cho phép thay đổi trạng thái của đơn hàng đã hoàn thành hoặc đã hủy trước đó (Trừ Admin nếu có lý do đặc biệt, ở đây chặn cả hai để tăng tính logic)
    if (currentInvoice.TrangThai === 'Hoàn thành' || currentInvoice.TrangThai === 'Đã hủy') {
      return res.status(400).json({
        message: `Đơn hàng đã kết thúc (Trạng thái: "${currentInvoice.TrangThai}") và không thể thay đổi trạng thái được nữa.`
      });
    }

    // 3. Tiến hành cập nhật trạng thái hóa đơn
    const updateRequest = new sql.Request();
    updateRequest.input('HoaDonID', sql.Int, id);
    updateRequest.input('TrangThai', sql.NVarChar(50), TrangThai);

    await updateRequest.query(`
      UPDATE HoaDon
      SET TrangThai = @TrangThai
      WHERE HoaDonID = @HoaDonID
    `);

    const selectRequest = new sql.Request();
    selectRequest.input('HoaDonID', sql.Int, id);
    const updateResult = await selectRequest.query(`
      SELECT * FROM HoaDon WHERE HoaDonID = @HoaDonID
    `);

    // 4. Nếu đơn hàng hoàn thành, tự động cập nhật trạng thái thanh toán thành "Đã thanh toán"
    if (TrangThai === 'Hoàn thành') {
      const payRequest = new sql.Request();
      payRequest.input('HoaDonID', sql.Int, id);
      await payRequest.query(`
        UPDATE ThanhToan
        SET TrangThaiThanhToan = N'Đã thanh toán',
            NgayThanhToan = GETDATE()
        WHERE HoaDonID = @HoaDonID
      `);
    }

    return res.status(200).json({
      message: 'Cập nhật trạng thái hóa đơn thành công!',
      data: updateResult.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong updateTrangThai:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật trạng thái hóa đơn.',
      error: error.message
    });
  }
};

/**
 * PUT /api/hoadon/:id/diachi
 * Cập nhật địa chỉ giao hàng và số điện thoại của đơn hàng.
 * Chỉ được phép cập nhật khi đơn hàng đang ở trạng thái 'Chờ xác nhận'.
 * Chỉ chủ đơn hàng mới có quyền thay đổi.
 */
const updateDiaChiNhan = async (req, res) => {
  try {
    const { id } = req.params;
    const { DiaChiNhan, SoDienThoaiNhan } = req.body;
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const isAdmin = req.user && req.user.RoleId === 1;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện chức năng này.' });
    }

    if (!DiaChiNhan || DiaChiNhan.trim() === '') {
      return res.status(400).json({ message: 'Địa chỉ giao hàng không được để trống.' });
    }

    // Kiểm tra sự tồn tại của hóa đơn
    const checkRequest = new sql.Request();
    checkRequest.input('HoaDonID', sql.Int, id);
    const checkResult = await checkRequest.query('SELECT NguoiDungID, TrangThai FROM HoaDon WHERE HoaDonID = @HoaDonID');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn cần cập nhật.' });
    }

    const invoice = checkResult.recordset[0];

    // Phân quyền: chỉ chủ đơn hoặc admin
    if (!isAdmin && invoice.NguoiDungID !== currentUserId) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng này.' });
    }

    // Chỉ cho phép cập nhật địa chỉ khi đơn hàng đang chờ xác nhận
    if (invoice.TrangThai !== 'Chờ xác nhận') {
      return res.status(400).json({
        message: `Không thể cập nhật địa chỉ vì đơn hàng đã được xử lý (Trạng thái: "${invoice.TrangThai}"). Vui lòng liên hệ CSKH để được hỗ trợ.`
      });
    }

    const updateRequest = new sql.Request();
    updateRequest.input('HoaDonID', sql.Int, id);
    updateRequest.input('DiaChiNhan', sql.NVarChar(255), DiaChiNhan.trim());
    updateRequest.input('SoDienThoaiNhan', sql.VarChar(15), SoDienThoaiNhan ? SoDienThoaiNhan.trim() : null);

    await updateRequest.query(`
      UPDATE HoaDon
      SET DiaChiNhan = @DiaChiNhan
        ${SoDienThoaiNhan ? ', SoDienThoaiNhan = @SoDienThoaiNhan' : ''}
      WHERE HoaDonID = @HoaDonID
    `);

    return res.status(200).json({
      message: 'Cập nhật địa chỉ giao hàng thành công!',
      data: {
        HoaDonID: parseInt(id),
        DiaChiNhan: DiaChiNhan.trim(),
        SoDienThoaiNhan: SoDienThoaiNhan ? SoDienThoaiNhan.trim() : invoice.SoDienThoaiNhan
      }
    });

  } catch (error) {
    console.error('Lỗi trong updateDiaChiNhan:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật địa chỉ giao hàng.',
      error: error.message
    });
  }
};

module.exports = {
  createHoaDon,
  getAllHoaDon,
  getHoaDonById,
  updateTrangThai,
  updateDiaChiNhan
};
