const sql = require('mssql');

/**
 * GET /api/yeuthich
 * Lấy danh sách tất cả sản phẩm yêu thích của người dùng hiện tại (kèm đầy đủ thông tin sản phẩm).
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.NguoiDungID;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, userId);

    const result = await request.query(`
      SELECT
        yt.YeuThichID, yt.NgayThem,
        s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao,
        d.TenDanhMuc,
        COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
        COUNT(dg.DanhGiaID) AS TongDanhGia
      FROM YeuThich yt
      JOIN SanPham s ON yt.SanPhamID = s.SanPhamID
      LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
      LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
      WHERE yt.NguoiDungID = @NguoiDungID
      GROUP BY yt.YeuThichID, yt.NgayThem, s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
      ORDER BY yt.NgayThem DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi getFavorites:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * POST /api/yeuthich
 * Thêm một sản phẩm vào danh sách yêu thích. Nếu đã có thì bỏ qua (idempotent).
 * Body: { SanPhamID }
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.NguoiDungID;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    const { SanPhamID } = req.body;
    if (!SanPhamID) return res.status(400).json({ message: 'Thiếu SanPhamID.' });

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, userId);
    request.input('SanPhamID', sql.Int, SanPhamID);

    // Kiểm tra sản phẩm tồn tại
    const checkProduct = await request.query('SELECT SanPhamID FROM SanPham WHERE SanPhamID = @SanPhamID');
    if (checkProduct.recordset.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
    }

    // Thêm nếu chưa có (tránh duplicate)
    const insertResult = await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM YeuThich WHERE NguoiDungID = @NguoiDungID AND SanPhamID = @SanPhamID
      )
        INSERT INTO YeuThich (NguoiDungID, SanPhamID) VALUES (@NguoiDungID, @SanPhamID);

      SELECT YeuThichID FROM YeuThich WHERE NguoiDungID = @NguoiDungID AND SanPhamID = @SanPhamID;
    `);

    return res.status(200).json({
      message: 'Đã thêm vào danh sách yêu thích.',
      data: insertResult.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi addFavorite:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * DELETE /api/yeuthich/:sanphamid
 * Xóa một sản phẩm khỏi danh sách yêu thích của người dùng hiện tại.
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.NguoiDungID;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    const sanPhamId = parseInt(req.params.sanphamid);
    if (!sanPhamId) return res.status(400).json({ message: 'SanPhamID không hợp lệ.' });

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, userId);
    request.input('SanPhamID', sql.Int, sanPhamId);

    await request.query(`
      DELETE FROM YeuThich WHERE NguoiDungID = @NguoiDungID AND SanPhamID = @SanPhamID
    `);

    return res.status(200).json({ message: 'Đã xóa khỏi danh sách yêu thích.' });
  } catch (error) {
    console.error('Lỗi removeFavorite:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * DELETE /api/yeuthich
 * Xóa toàn bộ danh sách yêu thích của người dùng.
 */
const clearFavorites = async (req, res) => {
  try {
    const userId = req.user?.NguoiDungID;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, userId);
    await request.query('DELETE FROM YeuThich WHERE NguoiDungID = @NguoiDungID');

    return res.status(200).json({ message: 'Đã xóa toàn bộ yêu thích.' });
  } catch (error) {
    console.error('Lỗi clearFavorites:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * POST /api/yeuthich/dongbo
 * Đồng bộ danh sách yêu thích từ localStorage lên DB khi user vừa đăng nhập.
 * Body: { sanPhamIds: [1, 2, 3, ...] }
 */
const syncFavorites = async (req, res) => {
  try {
    const userId = req.user?.NguoiDungID;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    const { sanPhamIds } = req.body;
    if (!Array.isArray(sanPhamIds) || sanPhamIds.length === 0) {
      return res.status(400).json({ message: 'Danh sách sanPhamIds không hợp lệ.' });
    }

    // Chèn từng item, bỏ qua nếu đã tồn tại
    for (const id of sanPhamIds) {
      const request = new sql.Request();
      request.input('NguoiDungID', sql.Int, userId);
      request.input('SanPhamID', sql.Int, parseInt(id));
      await request.query(`
        IF NOT EXISTS (
          SELECT 1 FROM YeuThich WHERE NguoiDungID = @NguoiDungID AND SanPhamID = @SanPhamID
        )
          INSERT INTO YeuThich (NguoiDungID, SanPhamID) VALUES (@NguoiDungID, @SanPhamID);
      `);
    }

    return res.status(200).json({ message: `Đã đồng bộ ${sanPhamIds.length} món yêu thích.` });
  } catch (error) {
    console.error('Lỗi syncFavorites:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, clearFavorites, syncFavorites };
