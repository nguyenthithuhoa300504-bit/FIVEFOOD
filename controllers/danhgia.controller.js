const { sql } = require('../config/db.config');

/**
 * POST /api/danhgia
 * Thêm đánh giá mới cho sản phẩm từ hóa đơn đã hoàn thành.
 */
const createDanhGia = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.NguoiDungID : null;
    const { SanPhamID, HoaDonID, SoSao, BinhLuan } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện đánh giá.'
      });
    }

    if (!SanPhamID || !HoaDonID || !SoSao) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc (SanPhamID, HoaDonID, SoSao).'
      });
    }

    const starCount = parseInt(SoSao);
    if (isNaN(starCount) || starCount < 1 || starCount > 5) {
      return res.status(400).json({
        message: 'Số sao đánh giá phải từ 1 đến 5 sao.'
      });
    }

    // 1. Kiểm tra hóa đơn tồn tại, thuộc về user và đã HOÀN THÀNH
    const checkInvoiceReq = new sql.Request();
    checkInvoiceReq.input('HoaDonID', sql.Int, HoaDonID);
    const invoiceRes = await checkInvoiceReq.query(`
      SELECT NguoiDungID, TrangThai 
      FROM HoaDon 
      WHERE HoaDonID = @HoaDonID
    `);

    if (invoiceRes.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy hóa đơn này.'
      });
    }

    const invoice = invoiceRes.recordset[0];
    if (invoice.NguoiDungID !== currentUserId) {
      return res.status(403).json({
        message: 'Bạn không có quyền đánh giá đơn hàng của người khác.'
      });
    }

    if (invoice.TrangThai !== 'Hoàn thành') {
      return res.status(400).json({
        message: 'Bạn chỉ có thể đánh giá món ăn sau khi đơn hàng đã hoàn thành giao nhận.'
      });
    }

    // 2. Kiểm tra sản phẩm có thực sự nằm trong hóa đơn này không
    const checkItemReq = new sql.Request();
    checkItemReq.input('HoaDonID', sql.Int, HoaDonID);
    checkItemReq.input('SanPhamID', sql.Int, SanPhamID);
    const itemRes = await checkItemReq.query(`
      SELECT 1 
      FROM ChiTietHoaDon 
      WHERE HoaDonID = @HoaDonID AND SanPhamID = @SanPhamID
    `);

    if (itemRes.recordset.length === 0) {
      return res.status(400).json({
        message: 'Món ăn này không nằm trong hóa đơn của bạn.'
      });
    }

    // 3. Kiểm tra xem người dùng đã đánh giá món ăn này trong hóa đơn này chưa
    const checkReviewedReq = new sql.Request();
    checkReviewedReq.input('HoaDonID', sql.Int, HoaDonID);
    checkReviewedReq.input('SanPhamID', sql.Int, SanPhamID);
    checkReviewedReq.input('NguoiDungID', sql.Int, currentUserId);
    const reviewedRes = await checkReviewedReq.query(`
      SELECT 1 
      FROM DanhGia 
      WHERE HoaDonID = @HoaDonID AND SanPhamID = @SanPhamID AND NguoiDungID = @NguoiDungID
    `);

    if (reviewedRes.recordset.length > 0) {
      return res.status(400).json({
        message: 'Bạn đã đánh giá món ăn này cho đơn hàng này rồi.'
      });
    }

    // 4. Lưu đánh giá mới vào CSDL
    const insertReq = new sql.Request();
    insertReq.input('SanPhamID', sql.Int, SanPhamID);
    insertReq.input('NguoiDungID', sql.Int, currentUserId);
    insertReq.input('HoaDonID', sql.Int, HoaDonID);
    insertReq.input('SoSao', sql.Int, starCount);
    insertReq.input('BinhLuan', sql.NVarChar(500), BinhLuan ? BinhLuan.trim() : null);

    const insertRes = await insertReq.query(`
      INSERT INTO DanhGia (SanPhamID, NguoiDungID, HoaDonID, SoSao, BinhLuan, NgayTao)
      OUTPUT inserted.DanhGiaID, inserted.SanPhamID, inserted.SoSao, inserted.BinhLuan, inserted.NgayTao
      VALUES (@SanPhamID, @NguoiDungID, @HoaDonID, @SoSao, @BinhLuan, GETDATE())
    `);

    return res.status(201).json({
      message: 'Đăng đánh giá của bạn thành công! Cảm ơn bạn đã đóng góp ý kiến. ❤️',
      data: insertRes.recordset[0]
    });

  } catch (error) {
    console.error('Lỗi trong createDanhGia:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo đánh giá sản phẩm.',
      error: error.message
    });
  }
};

/**
 * GET /api/danhgia/sanpham/:sanPhamId
 * Lấy danh sách toàn bộ các đánh giá của sản phẩm kèm tên người dùng.
 */
const getDanhGiaBySanPham = async (req, res) => {
  try {
    const { sanPhamId } = req.params;
    const request = new sql.Request();
    request.input('SanPhamID', sql.Int, sanPhamId);

    const result = await request.query(`
      SELECT 
        dg.DanhGiaID,
        dg.SoSao,
        dg.BinhLuan,
        dg.NgayTao,
        nd.HoTen AS TenKhachHang
      FROM DanhGia dg
      JOIN NguoiDung nd ON dg.NguoiDungID = nd.NguoiDungID
      WHERE dg.SanPhamID = @SanPhamID
      ORDER BY dg.NgayTao DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getDanhGiaBySanPham:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh giá món ăn.',
      error: error.message
    });
  }
};

/**
 * GET /api/danhgia/hoadon/:hoadonId
 * Lấy danh sách ID các sản phẩm đã được đánh giá trong hóa đơn này bởi chính người dùng.
 */
const getReviewedItemsInHoaDon = async (req, res) => {
  try {
    const { hoadonId } = req.params;
    const currentUserId = req.user ? req.user.NguoiDungID : null;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện chức năng này.'
      });
    }

    const request = new sql.Request();
    request.input('HoaDonID', sql.Int, hoadonId);
    request.input('NguoiDungID', sql.Int, currentUserId);

    const result = await request.query(`
      SELECT SanPhamID 
      FROM DanhGia 
      WHERE HoaDonID = @HoaDonID AND NguoiDungID = @NguoiDungID
    `);

    // Trả về mảng các SanPhamID đã đánh giá
    const reviewedProductIds = result.recordset.map(row => row.SanPhamID);

    return res.status(200).json({
      reviewedProductIds
    });
  } catch (error) {
    console.error('Lỗi trong getReviewedItemsInHoaDon:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách sản phẩm đã đánh giá.',
      error: error.message
    });
  }
};

module.exports = {
  createDanhGia,
  getDanhGiaBySanPham,
  getReviewedItemsInHoaDon
};
