-- =====================================================
-- TẠO DATABASE
-- =====================================================
CREATE DATABASE WebBanDoAn;
GO

USE WebBanDoAn;
GO

-- =====================================================
-- 1. BẢNG VAITRO
-- =====================================================
CREATE TABLE VaiTro (
    VaiTroID INT PRIMARY KEY IDENTITY(1,1),
    TenVaiTro NVARCHAR(50) UNIQUE NOT NULL
);

-- =====================================================
-- 2. BẢNG NGUOIDUNG
-- =====================================================
CREATE TABLE NguoiDung (
    NguoiDungID INT PRIMARY KEY IDENTITY(1,1),
    VaiTroID INT NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    TenDangNhap VARCHAR(50) UNIQUE NOT NULL,
    MatKhauHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) UNIQUE,
    SoDienThoai VARCHAR(15),
    DiaChi NVARCHAR(255),
    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_NguoiDung_VaiTro
        FOREIGN KEY (VaiTroID)
        REFERENCES VaiTro(VaiTroID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

-- =====================================================
-- 3. BẢNG DANHMUC
-- =====================================================
CREATE TABLE DanhMuc (
    DanhMucID INT PRIMARY KEY IDENTITY(1,1),
    TenDanhMuc NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255)
);

-- =====================================================
-- 4. BẢNG SANPHAM
-- =====================================================
CREATE TABLE SanPham (
    SanPhamID INT PRIMARY KEY IDENTITY(1,1),
    DanhMucID INT NOT NULL,
    TenSanPham NVARCHAR(150) NOT NULL,
    Gia DECIMAL(18,2) NOT NULL
        CHECK (Gia >= 0),
    SoLuongTon INT DEFAULT 0
        CHECK (SoLuongTon >= 0),
    HinhAnh NVARCHAR(MAX), -- Cột lưu trữ link hình ảnh sản phẩm (có thể dùng Unsplash URL hoặc Base64)
    MoTa NVARCHAR(500),
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_SanPham_DanhMuc
        FOREIGN KEY (DanhMucID)
        REFERENCES DanhMuc(DanhMucID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- 5. BẢNG GIOHANG
-- =====================================================
CREATE TABLE GioHang (
    GioHangID INT PRIMARY KEY IDENTITY(1,1),
    NguoiDungID INT UNIQUE NOT NULL,
    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_GioHang_NguoiDung
        FOREIGN KEY (NguoiDungID)
        REFERENCES NguoiDung(NguoiDungID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- 6. BẢNG CHITIETGIOHANG
-- =====================================================
CREATE TABLE ChiTietGioHang (
    ChiTietGioHangID INT PRIMARY KEY IDENTITY(1,1),
    GioHangID INT NOT NULL,
    SanPhamID INT NOT NULL,
    SoLuong INT NOT NULL
        CHECK (SoLuong > 0),

    CONSTRAINT FK_CTGH_GioHang
        FOREIGN KEY (GioHangID)
        REFERENCES GioHang(GioHangID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT FK_CTGH_SanPham
        FOREIGN KEY (SanPhamID)
        REFERENCES SanPham(SanPhamID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- 7. BẢNG KHUYENMAI
-- =====================================================
CREATE TABLE KhuyenMai (
    KhuyenMaiID INT PRIMARY KEY IDENTITY(1,1),
    MaKhuyenMai VARCHAR(50) UNIQUE NOT NULL,
    TenKhuyenMai NVARCHAR(100) NOT NULL,
    PhanTramGiam INT
        DEFAULT 0
        CHECK (PhanTramGiam >= 0 AND PhanTramGiam <= 100),
    SoTienGiam DECIMAL(18,2)
        DEFAULT 0
        CHECK (SoTienGiam >= 0),
    DieuKienToiThieu DECIMAL(18,2)
        DEFAULT 0
        CHECK (DieuKienToiThieu >= 0),
    NgayBatDau DATETIME NOT NULL,
    NgayKetThuc DATETIME NOT NULL,
    SoLuong INT DEFAULT 0
        CHECK (SoLuong >= 0),
    TrangThai BIT DEFAULT 1
);

-- =====================================================
-- 8. BẢNG HOADON
-- =====================================================
CREATE TABLE HoaDon (
    HoaDonID INT PRIMARY KEY IDENTITY(1,1),
    NguoiDungID INT NOT NULL,
    KhuyenMaiID INT NULL,
    NgayDat DATETIME DEFAULT GETDATE(),
    TongTien DECIMAL(18,2)
        DEFAULT 0
        CHECK (TongTien >= 0),
    TrangThai NVARCHAR(50)
        DEFAULT N'Chờ xác nhận'
        CHECK (TrangThai IN (
            N'Chờ xác nhận',
            N'Đang giao',
            N'Hoàn thành',
            N'Đã hủy'
        )),
    DiaChiNhan NVARCHAR(255),
    SoDienThoaiNhan VARCHAR(15),
    GhiChu NVARCHAR(500),
    ViDo DECIMAL(10,8) NULL,
    KinhDo DECIMAL(11,8) NULL,

    CONSTRAINT FK_HoaDon_NguoiDung
        FOREIGN KEY (NguoiDungID)
        REFERENCES NguoiDung(NguoiDungID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,

    CONSTRAINT FK_HoaDon_KhuyenMai
        FOREIGN KEY (KhuyenMaiID)
        REFERENCES KhuyenMai(KhuyenMaiID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =====================================================
-- 9. BẢNG CHITIETHOADON
-- =====================================================
CREATE TABLE ChiTietHoaDon (
    ChiTietHoaDonID INT PRIMARY KEY IDENTITY(1,1),
    HoaDonID INT NOT NULL,
    SanPhamID INT NOT NULL,
    SoLuong INT NOT NULL
        CHECK (SoLuong > 0),
    DonGia DECIMAL(18,2) NOT NULL
        CHECK (DonGia >= 0),
    ThanhTien AS (SoLuong * DonGia),

    CONSTRAINT FK_CTHD_HoaDon
        FOREIGN KEY (HoaDonID)
        REFERENCES HoaDon(HoaDonID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT FK_CTHD_SanPham
        FOREIGN KEY (SanPhamID)
        REFERENCES SanPham(SanPhamID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

-- =====================================================
-- 10. BẢNG THANHTOAN
-- =====================================================
CREATE TABLE ThanhToan (
    ThanhToanID INT PRIMARY KEY IDENTITY(1,1),
    HoaDonID INT UNIQUE NOT NULL,
    PhuongThuc NVARCHAR(50)
        CHECK (PhuongThuc IN (
            N'Tiền mặt',
            N'Chuyển khoản',
            N'Momo'
        )),
    TrangThaiThanhToan NVARCHAR(50)
        DEFAULT N'Chưa thanh toán'
        CHECK (TrangThaiThanhToan IN (
            N'Chưa thanh toán',
            N'Đã thanh toán'
        )),
    NgayThanhToan DATETIME,

    CONSTRAINT FK_ThanhToan_HoaDon
        FOREIGN KEY (HoaDonID)
        REFERENCES HoaDon(HoaDonID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
-- 11. BẢNG DANHGIA
-- =====================================================
CREATE TABLE DanhGia (
    DanhGiaID INT PRIMARY KEY IDENTITY(1,1),
    SanPhamID INT NOT NULL,
    NguoiDungID INT NOT NULL,
    HoaDonID INT NOT NULL,
    SoSao INT NOT NULL 
        CHECK (SoSao BETWEEN 1 AND 5),
    BinhLuan NVARCHAR(500),
    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_DanhGia_SanPham 
        FOREIGN KEY (SanPhamID) 
        REFERENCES SanPham(SanPhamID) 
        ON DELETE CASCADE,
    CONSTRAINT FK_DanhGia_NguoiDung 
        FOREIGN KEY (NguoiDungID) 
        REFERENCES NguoiDung(NguoiDungID) 
        ON DELETE NO ACTION,
    CONSTRAINT FK_DanhGia_HoaDon 
        FOREIGN KEY (HoaDonID) 
        REFERENCES HoaDon(HoaDonID) 
        ON DELETE NO ACTION
);

-- =====================================================
-- 12. BẢNG YEUTHICH
-- =====================================================
CREATE TABLE YeuThich (
    YeuThichID INT PRIMARY KEY IDENTITY(1,1),
    NguoiDungID INT NOT NULL,
    SanPhamID INT NOT NULL,
    NgayThem DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_YeuThich_NguoiDung 
        FOREIGN KEY (NguoiDungID) 
        REFERENCES NguoiDung(NguoiDungID) 
        ON DELETE CASCADE,
    CONSTRAINT FK_YeuThich_SanPham 
        FOREIGN KEY (SanPhamID) 
        REFERENCES SanPham(SanPhamID) 
        ON DELETE CASCADE,
    CONSTRAINT UC_YeuThich_NguoiDung_SanPham 
        UNIQUE (NguoiDungID, SanPhamID)
);
GO

-- =====================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =====================================================

-- 1. Chèn dữ liệu VaiTro
SET IDENTITY_INSERT VaiTro ON;
INSERT INTO VaiTro (VaiTroID, TenVaiTro) VALUES 
(1, N'Admin'),
(2, N'KhachHang'),
(3, N'Khách hàng');
SET IDENTITY_INSERT VaiTro OFF;
GO

-- 2. Chèn dữ liệu NguoiDung
-- Mật khẩu mặc định của các tài khoản mẫu dưới đây đều là: 123456
SET IDENTITY_INSERT NguoiDung ON;
INSERT INTO NguoiDung (NguoiDungID, VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi) VALUES 
(4, 1, N'Quản trị viên FoodExpress', 'admin', '$2b$10$SdmskjyfrAj1liZFO.wudeSytR111rzcxLx.RuTi943jVwC0tFOWi', 'admin@webdoan.com', '0987654321', NULL),
(5, 3, N'Người dùng Thử nghiệm', 'testuser', '$2b$10$glJWkz97odGukNRmtjPIWuFcmY.5RwCS7EQIPKw12jZP/Ex13WG8C', 'testuser@webdoan.com', '0912345678', N'Hồ Chí Minh'),
(25, 2, N'Nguyễn Thị Thu Hoa', 'user', '$2b$10$d6aC/keGobrAlTcPPgSWou/Jmjbz.5M6yR1oSVZfBiDOqgJjBcVb6', 'nguyenthithuhoa300504@gmail.com', '0837736659', N'123 Đường Xuân Thủy, Cầu Giấy, Hà Nội');
SET IDENTITY_INSERT NguoiDung OFF;
GO

-- 3. Chèn dữ liệu DanhMuc
SET IDENTITY_INSERT DanhMuc ON;
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa) VALUES 
(1, N'Cơm', N'Cơm các loại'),
(2, N'Trà sữa', N'Nước uống trà sữa các loại'),
(3, N'Pizza', N'Pizza các loại'),
(4, N'Đồ uống', N'Các loại nước ngọt, cà phê, trà sữa'),
(5, N'Bánh', N'Các loại bánh ngọt và mặn');
SET IDENTITY_INSERT DanhMuc OFF;
GO

-- 4. Chèn dữ liệu SanPham với đường link ảnh đẹp (Unsplash) phù hợp với tên sản phẩm
SET IDENTITY_INSERT SanPham ON;
INSERT INTO SanPham (SanPhamID, DanhMucID, TenSanPham, Gia, SoLuongTon, HinhAnh, MoTa, TrangThai) VALUES 
(1, 1, N'Cơm chiên hải sản đặc biệt', 55000, 30, N'https://images.unsplash.com/photo-1603133872878-6966b45880ac?w=600', N'Cơm chiên đặc biệt bổ sung nhiều hải sản tươi ngon như tôm, mực và rau củ', 1),
(2, 2, N'Trà sữa trân châu', 35000, 168, N'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600', N'Trà sữa thơm ngon đậm vị trà, kết hợp trân châu đen dai giòn sần sật', 1),
(3, 3, N'Pizza hải sản', 150000, 46, N'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', N'Pizza hải sản size vừa ngập tràn phô mai mozzarella kéo sợi béo ngậy', 1),
(4, 1, N'Cơm chiên hải sản', 45000, 40, N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', N'Cơm chiên giòn rụm thơm ngon cùng tôm tươi, mực và trứng', 1),
(13, 5, N'Bánh Mì Kẹp Thịt Nướng', 25000, 96, N'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600', N'Bánh mì kẹp thịt nướng thơm phức, giòn rụm kết hợp nước sốt gia truyền đặc biệt', 1);
SET IDENTITY_INSERT SanPham OFF;
GO

-- 5. Chèn dữ liệu KhuyenMai mẫu
SET IDENTITY_INSERT KhuyenMai ON;
INSERT INTO KhuyenMai (KhuyenMaiID, MaKhuyenMai, TenKhuyenMai, PhanTramGiam, SoTienGiam, DieuKienToiThieu, NgayBatDau, NgayKetThuc, SoLuong, TrangThai) VALUES
(1, 'GIAM10', N'Giảm giá 10% đơn hàng', 10, 0, 100000, '2026-06-01 00:00:00', '2026-12-31 23:59:59', 100, 1),
(2, 'FREESHIP', N'Giảm giá 20,000 VND phí vận chuyển', 0, 20000, 50000, '2026-05-26 00:00:00', '2026-12-31 23:59:59', 50, 1);
SET IDENTITY_INSERT KhuyenMai OFF;
GO