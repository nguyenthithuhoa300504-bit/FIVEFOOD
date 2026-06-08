const { sql } = require('../config/db.config');

/**
 * GET /sanpham
 * Lấy danh sách tất cả các sản phẩm
 * Hỗ trợ phân trang qua query param: ?page=1&limit=10
 */
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;

    const request = new sql.Request();

    // Nếu có tham số page, thực hiện phân trang
    if (!isNaN(page) && page > 0) {
      // 1. Đếm tổng số lượng sản phẩm
      const countResult = await request.query('SELECT COUNT(*) AS total FROM SanPham');
      const totalItems = countResult.recordset[0].total;
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;

      // 2. Lấy dữ liệu phân trang
      const paginatedRequest = new sql.Request();
      paginatedRequest.input('Offset', sql.Int, offset);
      paginatedRequest.input('Limit', sql.Int, limit);
      
      const result = await paginatedRequest.query(`
        SELECT 
          s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
          COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
          COUNT(dg.DanhGiaID) AS TongDanhGia
        FROM SanPham s
        LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
        LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
        GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
        ORDER BY s.SanPhamID
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY
      `);

      return res.status(200).json({
        currentPage: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        data: result.recordset
      });
    } else {
      // Nếu không phân trang, lấy toàn bộ sản phẩm
      const result = await request.query(`
        SELECT 
          s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
          COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
          COUNT(dg.DanhGiaID) AS TongDanhGia
        FROM SanPham s
        LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
        LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
        GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
        ORDER BY s.SanPhamID
      `);
      return res.status(200).json(result.recordset);
    }
  } catch (error) {
    console.error('Lỗi trong getAllProducts:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * GET /sanpham/:id
 * Lấy chi tiết thông tin sản phẩm theo ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('SanPhamID', sql.Int, id);

    const result = await request.query(`
      SELECT 
        s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
        COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
        COUNT(dg.DanhGiaID) AS TongDanhGia
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
      LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
      WHERE s.SanPhamID = @SanPhamID
      GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm với ID đã cung cấp'
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getProductById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

/**
 * POST /sanpham
 * Tạo mới một sản phẩm mới
 */
const createProduct = async (req, res) => {
  try {
    const { DanhMucID, TenSanPham, Gia, SoLuongTon, HinhAnh, MoTa, TrangThai } = req.body;

    // Validate các trường dữ liệu bắt buộc
    if (!DanhMucID) {
      return res.status(400).json({ message: 'DanhMucID là bắt buộc' });
    }
    if (!TenSanPham || TenSanPham.trim() === '') {
      return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    }
    if (Gia === undefined || Gia === null) {
      return res.status(400).json({ message: 'Giá sản phẩm là bắt buộc' });
    }
    if (parseFloat(Gia) < 0) {
      return res.status(400).json({ message: 'Giá sản phẩm không được nhỏ hơn 0' });
    }
    if (SoLuongTon !== undefined && parseInt(SoLuongTon) < 0) {
      return res.status(400).json({ message: 'Số lượng tồn không được nhỏ hơn 0' });
    }

    const request = new sql.Request();
    request.input('DanhMucID', sql.Int, DanhMucID);
    request.input('TenSanPham', sql.NVarChar(150), TenSanPham.trim());
    request.input('Gia', sql.Decimal(18, 2), parseFloat(Gia));
    request.input('SoLuongTon', sql.Int, SoLuongTon !== undefined ? parseInt(SoLuongTon) : 0);
    request.input('HinhAnh', sql.NVarChar(255), HinhAnh ? HinhAnh.trim() : null);
    request.input('MoTa', sql.NVarChar(500), MoTa ? MoTa.trim() : null);
    request.input('TrangThai', sql.Bit, TrangThai !== undefined ? TrangThai : 1);

    const result = await request.query(`
      INSERT INTO SanPham (DanhMucID, TenSanPham, Gia, SoLuongTon, HinhAnh, MoTa, TrangThai)
      OUTPUT inserted.SanPhamID, inserted.DanhMucID, inserted.TenSanPham, inserted.Gia, inserted.SoLuongTon, inserted.HinhAnh, inserted.MoTa, inserted.TrangThai, inserted.NgayTao
      VALUES (@DanhMucID, @TenSanPham, @Gia, @SoLuongTon, @HinhAnh, @MoTa, @TrangThai)
    `);

    return res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong createProduct:', error);
    // Xử lý lỗi ràng buộc khóa ngoại (ví dụ: DanhMucID không tồn tại)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Danh mục sản phẩm (DanhMucID) không tồn tại hoặc lỗi ràng buộc dữ liệu khác',
        error: error.message
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo sản phẩm',
      error: error.message
    });
  }
};

/**
 * PUT /sanpham/:id
 * Cập nhật thông tin sản phẩm theo ID
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { DanhMucID, TenSanPham, Gia, SoLuongTon, HinhAnh, MoTa, TrangThai } = req.body;

    // Validate các trường dữ liệu bắt buộc khi cập nhật
    if (!DanhMucID) {
      return res.status(400).json({ message: 'DanhMucID là bắt buộc' });
    }
    if (!TenSanPham || TenSanPham.trim() === '') {
      return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    }
    if (Gia === undefined || Gia === null) {
      return res.status(400).json({ message: 'Giá sản phẩm là bắt buộc' });
    }
    if (parseFloat(Gia) < 0) {
      return res.status(400).json({ message: 'Giá sản phẩm không được nhỏ hơn 0' });
    }
    if (SoLuongTon !== undefined && parseInt(SoLuongTon) < 0) {
      return res.status(400).json({ message: 'Số lượng tồn không được nhỏ hơn 0' });
    }

    const request = new sql.Request();
    request.input('SanPhamID', sql.Int, id);
    request.input('DanhMucID', sql.Int, DanhMucID);
    request.input('TenSanPham', sql.NVarChar(150), TenSanPham.trim());
    request.input('Gia', sql.Decimal(18, 2), parseFloat(Gia));
    request.input('SoLuongTon', sql.Int, SoLuongTon !== undefined ? parseInt(SoLuongTon) : 0);
    request.input('HinhAnh', sql.NVarChar(255), HinhAnh ? HinhAnh.trim() : null);
    request.input('MoTa', sql.NVarChar(500), MoTa ? MoTa.trim() : null);
    request.input('TrangThai', sql.Bit, TrangThai !== undefined ? TrangThai : 1);

    const result = await request.query(`
      UPDATE SanPham
      SET DanhMucID = @DanhMucID,
          TenSanPham = @TenSanPham,
          Gia = @Gia,
          SoLuongTon = @SoLuongTon,
          HinhAnh = @HinhAnh,
          MoTa = @MoTa,
          TrangThai = @TrangThai
      OUTPUT inserted.SanPhamID, inserted.DanhMucID, inserted.TenSanPham, inserted.Gia, inserted.SoLuongTon, inserted.HinhAnh, inserted.MoTa, inserted.TrangThai, inserted.NgayTao
      WHERE SanPhamID = @SanPhamID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm để cập nhật'
      });
    }

    return res.status(200).json({
      message: 'Cập nhật sản phẩm thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong updateProduct:', error);
    // Xử lý lỗi ràng buộc khóa ngoại (ví dụ: DanhMucID không tồn tại)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Danh mục sản phẩm (DanhMucID) không tồn tại hoặc lỗi ràng buộc dữ liệu khác',
        error: error.message
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * DELETE /sanpham/:id
 * Xóa sản phẩm theo ID
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('SanPhamID', sql.Int, id);

    const result = await request.query(`
      DELETE FROM SanPham
      OUTPUT deleted.SanPhamID
      WHERE SanPhamID = @SanPhamID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm để xóa'
      });
    }

    return res.status(200).json({
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Lỗi trong deleteProduct:', error);
    // Xử lý ràng buộc khi sản phẩm đang có trong giỏ hàng hoặc chi tiết hóa đơn
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Không thể xóa sản phẩm này vì đang nằm trong giỏ hàng hoặc hóa đơn của khách hàng',
        error: error.message
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * GET /sanpham/danhmuc/:id
 * Lọc danh sách sản phẩm theo DanhMucID
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('DanhMucID', sql.Int, id);

    const result = await request.query(`
      SELECT 
        s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
        COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
        COUNT(dg.DanhGiaID) AS TongDanhGia
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
      LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
      WHERE s.DanhMucID = @DanhMucID
      GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
      ORDER BY s.SanPhamID
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getProductsByCategory:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách sản phẩm theo danh mục',
      error: error.message
    });
  }
};

/**
 * GET /sanpham/timkiem
 * Tìm kiếm sản phẩm theo tên hoặc mô tả
 * API: /sanpham/timkiem?q=keyword
 */
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        message: 'Từ khóa tìm kiếm (q) không được để trống'
      });
    }

    const request = new sql.Request();
    request.input('Keyword', sql.NVarChar(255), `%${q.trim()}%`);

    const result = await request.query(`
      SELECT 
        s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
        COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
        COUNT(dg.DanhGiaID) AS TongDanhGia
      FROM SanPham s
      LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
      LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
      WHERE s.TenSanPham LIKE @Keyword OR s.MoTa LIKE @Keyword
      GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
      ORDER BY s.SanPhamID
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong searchProducts:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tìm kiếm sản phẩm',
      error: error.message
    });
  }
};

/**
 * GET /api/sanpham/dathang
 * Lấy danh sách các sản phẩm mà người dùng hiện tại đã từng đặt mua.
 */
const getOrderedProducts = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.NguoiDungID : null;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để sử dụng chức năng này.'
      });
    }

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, currentUserId);

    const result = await request.query(`
      SELECT DISTINCT
        s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc,
        COALESCE(AVG(CAST(dg.SoSao AS DECIMAL(10,2))), 0) AS TrungBinhSao,
        COUNT(dg.DanhGiaID) AS TongDanhGia
      FROM ChiTietHoaDon cthd
      JOIN HoaDon hd ON cthd.HoaDonID = hd.HoaDonID
      JOIN SanPham s ON cthd.SanPhamID = s.SanPhamID
      LEFT JOIN DanhMuc d ON s.DanhMucID = d.DanhMucID
      LEFT JOIN DanhGia dg ON s.SanPhamID = dg.SanPhamID
      WHERE hd.NguoiDungID = @NguoiDungID
      GROUP BY s.SanPhamID, s.DanhMucID, s.TenSanPham, s.Gia, s.SoLuongTon, s.HinhAnh, s.MoTa, s.TrangThai, s.NgayTao, d.TenDanhMuc
      ORDER BY s.SanPhamID
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getOrderedProducts:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách sản phẩm đã đặt mua',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getOrderedProducts
};
