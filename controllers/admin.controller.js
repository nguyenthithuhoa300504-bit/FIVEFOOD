const { sql } = require('../config/db.config');

/**
 * 1. GET /admin/thongke
 * Hàm thống kê số lượng: tổng người dùng, tổng sản phẩm và tổng hóa đơn.
 * Sử dụng các câu lệnh COUNT() trong SQL và gộp chung vào một truy vấn duy nhất để tối ưu hóa hiệu năng, tránh truy vấn database nhiều lần.
 */
const getThongKe = async (req, res) => {
  try {
    const request = new sql.Request();
    
    // Gộp cả 3 câu truy vấn đếm số lượng bản ghi vào làm một để giảm số lần gọi tới Database
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM NguoiDung) AS TongNguoiDung,
        (SELECT COUNT(*) FROM SanPham) AS TongSanPham,
        (SELECT COUNT(*) FROM HoaDon) AS TongHoaDon
    `;
    
    const result = await request.query(query);
    
    // Trả về dữ liệu dạng JSON của dòng đầu tiên tìm được (result.recordset[0])
    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getThongKe:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy dữ liệu thống kê',
      error: error.message
    });
  }
};

/**
 * 2. GET /admin/doanhthu
 * Hàm tính tổng doanh thu từ tất cả các hóa đơn đã hoàn thành.
 * Trạng thái hóa đơn được lọc theo giá trị 'Hoàn thành'.
 */
const getDoanhThu = async (req, res) => {
  try {
    const request = new sql.Request();
    
    // Tính tổng doanh thu thực tế từ các hóa đơn đã thanh toán (TrangThaiThanhToan = 'Đã thanh toán') và không bị hủy (TrangThai != 'Đã hủy')
    // Sử dụng hàm COALESCE(..., 0) để nếu chưa có doanh thu nào (NULL) thì kết quả trả về sẽ mặc định là 0
    const query = `
      SELECT COALESCE(SUM(hd.TongTien), 0) AS TongDoanhThu 
      FROM HoaDon hd
      INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
      WHERE tt.TrangThaiThanhToan = N'Đã thanh toán'
        AND hd.TrangThai <> N'Đã hủy'
    `;
    
    const result = await request.query(query);
    
    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getDoanhThu:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tính toán doanh thu',
      error: error.message
    });
  }
};

/**
 * 3. GET /admin/donhang
 * Hàm lấy danh sách tất cả các hóa đơn (đơn hàng).
 * Kết quả được sắp xếp theo thời gian đặt hàng mới nhất lên trên đầu (giảm dần).
 * Để thông tin đơn hàng hiển thị đầy đủ và rõ ràng hơn, hàm thực hiện LEFT JOIN với bảng NguoiDung để lấy thêm Họ Tên khách hàng đặt.
 */
const getDanhSachDonHang = async (req, res) => {
  try {
    const request = new sql.Request();
    
    // Lấy thông tin hóa đơn kết hợp JOIN với bảng NguoiDung theo NguoiDungID
    // Sắp xếp NgayDat giảm dần (DESC) để hiển thị đơn hàng mới nhất lên trước
    const query = `
      SELECT 
        hd.HoaDonID,
        hd.NguoiDungID,
        nd.HoTen AS TenKhachHang,
        hd.KhuyenMaiID,
        hd.NgayDat,
        hd.TongTien,
        hd.TrangThai,
        hd.DiaChiNhan,
        hd.SoDienThoaiNhan,
        hd.GhiChu
      FROM HoaDon hd
      LEFT JOIN NguoiDung nd ON hd.NguoiDungID = nd.NguoiDungID
      ORDER BY hd.NgayDat DESC, hd.HoaDonID DESC
    `;
    
    const result = await request.query(query);
    
    // Trả về toàn bộ danh sách hóa đơn dưới dạng mảng JSON
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getDanhSachDonHang:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * 4. GET /admin/sanphambanchay
 * Hàm lấy Top 5 sản phẩm bán chạy nhất dựa trên tổng số lượng sản phẩm đó đã được bán ra.
 * Thực hiện INNER JOIN giữa bảng ChiTietHoaDon và SanPham, sau đó nhóm (GROUP BY) theo thông tin sản phẩm và sắp xếp giảm dần theo tổng số lượng bán được.
 */
const getTopSanPhamBanChay = async (req, res) => {
  try {
    const request = new sql.Request();
    
    // Lấy TOP 5 bản ghi bán chạy nhất
    // Sử dụng SUM(ct.SoLuong) để cộng dồn số lượng đã bán của từng sản phẩm trong các chi tiết hóa đơn
    const query = `
      SELECT TOP 5
        sp.SanPhamID,
        sp.TenSanPham,
        sp.Gia,
        sp.HinhAnh,
        SUM(ct.SoLuong) AS TongSoLuongDaBan
      FROM ChiTietHoaDon ct
      INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      GROUP BY sp.SanPhamID, sp.TenSanPham, sp.Gia, sp.HinhAnh
      ORDER BY TongSoLuongDaBan DESC
    `;
    
    const result = await request.query(query);
    
    // Trả về danh sách top 5 sản phẩm dưới dạng JSON
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getTopSanPhamBanChay:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách sản phẩm bán chạy',
      error: error.message
    });
  }
};

/**
 * 5. GET /admin/bieudo
 * Hàm lấy dữ liệu vẽ biểu đồ thống kê doanh thu, trạng thái đơn hàng và doanh thu theo danh mục.
 */
const getBieuDo = async (req, res) => {
  try {
    const request = new sql.Request();
    
    // a. Doanh thu & số đơn hàng theo tháng (6 tháng gần nhất)
    const queryDoanhThu = `
      SELECT 
        YEAR(hd.NgayDat) AS Nam, 
        MONTH(hd.NgayDat) AS Thang, 
        SUM(hd.TongTien) AS DoanhThu,
        COUNT(hd.HoaDonID) AS SoDonHang
      FROM HoaDon hd
      INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
      WHERE tt.TrangThaiThanhToan = N'Đã thanh toán' 
        AND hd.TrangThai <> N'Đã hủy'
        AND hd.NgayDat >= DATEADD(month, -6, GETDATE())
      GROUP BY YEAR(hd.NgayDat), MONTH(hd.NgayDat)
      ORDER BY Nam ASC, Thang ASC
    `;
    
    // b. Phân loại đơn hàng theo trạng thái
    const queryTrangThai = `
      SELECT TrangThai, COUNT(*) AS SoLuong
      FROM HoaDon
      GROUP BY TrangThai
    `;
    
    // c. Doanh thu theo danh mục sản phẩm (chỉ tính đơn hoàn thành/đã thanh toán)
    const queryDanhMuc = `
      SELECT 
        dm.TenDanhMuc,
        SUM(ct.SoLuong * ct.DonGia) AS DoanhThu
      FROM ChiTietHoaDon ct
      INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      INNER JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
      INNER JOIN HoaDon hd ON ct.HoaDonID = hd.HoaDonID
      INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
      WHERE tt.TrangThaiThanhToan = N'Đã thanh toán' 
        AND hd.TrangThai <> N'Đã hủy'
      GROUP BY dm.TenDanhMuc
    `;
    
    const [resDoanhThu, resTrangThai, resDanhMuc] = await Promise.all([
      request.query(queryDoanhThu),
      request.query(queryTrangThai),
      request.query(queryDanhMuc)
    ]);
    
    return res.status(200).json({
      doanhThuThang: resDoanhThu.recordset,
      trangThaiDon: resTrangThai.recordset,
      doanhThuDanhMuc: resDanhMuc.recordset
    });
  } catch (error) {
    console.error('Lỗi trong getBieuDo:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy dữ liệu vẽ biểu đồ',
      error: error.message
    });
  }
};

// Export riêng biệt từng hàm để route import và gọi đến dễ dàng
module.exports = {
  getThongKe,
  getDoanhThu,
  getDanhSachDonHang,
  getTopSanPhamBanChay,
  getBieuDo
};

