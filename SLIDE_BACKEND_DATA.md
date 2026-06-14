# DỮ LIỆU THIẾT KẾ SLIDE BACKEND - FIVEFOOD
*(Tài liệu chứa thông tin, sơ đồ chữ và code mẫu để copy-paste trực tiếp lên Slide)*

Tài liệu này tổng hợp toàn bộ dữ liệu Backend bao gồm: kiến trúc, danh sách các API, sơ đồ bảng CSDL và các đoạn code mẫu ngắn gọn nhất để bạn đưa vào slide thuyết trình.

---

## 💻 SLIDE 1: CÔNG NGHỆ & THƯ VIỆN BACKEND
*   **Môi trường chạy (Runtime):** Node.js
*   **Framework:** Express.js (Xây dựng API RESTful)
*   **Hệ quản trị CSDL:** MS SQL Server (Kết nối dạng Connection Pool qua thư viện `mssql`)
*   **Bảo mật & Phân quyền:**
    *   `jsonwebtoken (JWT)`: Sinh và xác thực mã token đăng nhập.
    *   `bcryptjs`: Mã hóa mật khẩu thành chuỗi băm 1 chiều.
*   **Tài liệu hóa:** Swagger UI (Biên soạn tài liệu API tự động tại `/api-docs`).

---

## 🗄️ SLIDE 2: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
Hệ thống gồm **12 bảng** được chia làm 3 nhóm chính:

1.  **Nhóm Người dùng & Phân quyền:**
    *   `VaiTro` (VaiTroID, TenVaiTro)
    *   `NguoiDung` (NguoiDungID, VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi)
2.  **Nhóm Thực đơn & Khuyến mãi:**
    *   `DanhMuc` (DanhMucID, TenDanhMuc, MoTa, HinhAnh)
    *   `SanPham` (SanPhamID, DanhMucID, TenSanPham, Gia, SoLuongTon, TrangThai)
    *   `KhuyenMai` (KhuyenMaiID, MaKhuyenMai, PhanTramGiam, SoTienGiam, SoLuong, NgayKetThuc)
3.  **Nhóm Đơn hàng, Thanh toán & Tương tác:**
    *   `GioHang` (GioHangID, NguoiDungID) $\rightarrow$ `ChiTietGioHang` (ChiTietGioHangID, GioHangID, SanPhamID, SoLuong)
    *   `HoaDon` (HoaDonID, NguoiDungID, TongTien, TrangThai, ViDo, KinhDo) $\rightarrow$ `ChiTietHoaDon` (ChiTietHoaDonID, HoaDonID, SanPhamID, SoLuong, DonGia)
    *   `ThanhToan` (ThanhToanID, HoaDonID, PhuongThuc, TrangThaiThanhToan)
    *   `DanhGia` (DanhGiaID, SanPhamID, NguoiDungID, SoSao, BinhLuan)

---

## 🔗 SLIDE 3: DANH SÁCH CÁC API ENDPOINTS CHÍNH
*(Các đường dẫn kết nối Frontend với Backend)*

| Nhóm chức năng | Phương thức | API Endpoint | Mô tả nghiệp vụ |
| :--- | :---: | :--- | :--- |
| **Xác thực** | `POST` | `/api/register` | Đăng ký tài khoản (Băm mật khẩu `bcryptjs`) |
| **Xác thực** | `POST` | `/api/login` | Đăng nhập (Trả về mã xác thực JWT Token) |
| **Sản phẩm** | `GET` | `/api/sanpham` | Lấy danh sách món ăn phân trang (10 món/trang) |
| **Giỏ hàng** | `POST` | `/api/giohang/them` | Thêm món vào giỏ (Đồng bộ từ LocalStorage lên DB) |
| **Đơn hàng** | `POST` | `/api/hoadon` | Đặt hàng (Gọi Stored Procedure `sp_TaoHoaDon`) |
| **Đơn hàng** | `PUT` | `/api/hoadon/:id/trangthai` | Cập nhật trạng thái đơn (Duyệt đơn / Hủy đơn) |
| **Đánh giá** | `POST` | `/api/danhgia` | Lưu đánh giá số sao (1-5 sao) và bình luận |

---

## 🔑 SLIDE 4: CODE MẪU - XÁC THỰC NGƯỜI DÙNG (MIDDLEWARE JWT)
*(Đoạn code Backend dùng để chặn và kiểm tra token của người dùng gửi lên)*

```javascript
// Thư mục: middlewares/auth.middleware.js
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ header

  if (!token) return res.status(401).json({ message: 'Không tìm thấy token xác thực' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc hết hạn' });
    req.user = user; // Lưu thông tin người dùng vào request để dùng ở controller
    next(); // Cho phép đi tiếp
  });
};
```

---

## 🛡️ SLIDE 5: CODE MẪU - ĐẶT HÀNG AN TOÀN (SQL TRANSACTION)
*(Cấu trúc bọc Transaction trong procedure `sp_TaoHoaDon` để tránh mất mát dữ liệu)*

```sql
-- Thư mục: procedures.sql
CREATE PROCEDURE sp_TaoHoaDon ( @NguoiDungID INT, @MaKhuyenMai VARCHAR(50)... )
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION; -- Khởi động giao dịch an toàn
        
        -- 1. Trừ lượt sử dụng voucher giảm giá
        UPDATE KhuyenMai SET SoLuong = SoLuong - 1 WHERE MaKhuyenMai = @MaKhuyenMai;
        
        -- 2. Tạo hóa đơn mới
        INSERT INTO HoaDon (NguoiDungID, TongTien, TrangThai, ViDo, KinhDo...) VALUES (...);
        
        -- 3. Copy món ăn từ bảng giỏ hàng sang chi tiết hóa đơn
        INSERT INTO ChiTietHoaDon (HoaDonID, SanPhamID, SoLuong, DonGia)
        SELECT @NewHoaDonID, SanPhamID, SoLuong, Gia FROM ChiTietGioHang...;

        -- 4. Xóa sạch giỏ hàng của khách hàng
        DELETE FROM ChiTietGioHang WHERE GioHangID = @GioHangID;

        COMMIT TRANSACTION; -- Thành công hết: Lưu vĩnh viễn dữ liệu
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION; -- Lỗi bất kỳ bước nào: Khôi phục lại trạng thái cũ
        THROW; -- Báo lỗi lên Backend
    END CATCH
END;
```

---

## ⚡ SLIDE 6: CODE MẪU - TRIGGER TỰ ĐỘNG CẬP NHẬT KHO & HOÀN VOUCHER
*(Bộ kích hoạt tự động chạy ngầm dưới SQL Server giúp đồng bộ dữ liệu tức thời)*

```sql
-- 1. Trigger trừ tồn kho khi chèn món đặt mua vào hóa đơn chi tiết
CREATE TRIGGER trg_ChiTietHoaDon_Insert ON ChiTietHoaDon FOR INSERT AS
BEGIN
    UPDATE SanPham
    SET SoLuongTon = SoLuongTon - i.SoLuong
    FROM SanPham s JOIN inserted i ON s.SanPhamID = i.SanPhamID;
END;

-- 2. Trigger hoàn kho + hoàn lượt dùng voucher khi đơn hàng bị hủy
CREATE TRIGGER trg_HoaDon_UpdateStatus ON HoaDon AFTER UPDATE AS
BEGIN
    -- Kiểm tra nếu trạng thái chuyển sang N'Đã hủy'
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.HoaDonID = d.HoaDonID 
               WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy')
    BEGIN
        -- Hoàn kho sản phẩm
        UPDATE SanPham SET SoLuongTon = SoLuongTon + c.SoLuong FROM SanPham s...;
        -- Hoàn lại 1 lượt dùng mã khuyến mãi
        UPDATE KhuyenMai SET SoLuong = SoLuong + 1 FROM KhuyenMai k...;
    END
END;
```
