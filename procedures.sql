USE WebBanDoAn;
GO

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- 1. Lấy thông tin người dùng bằng Tên đăng nhập để xác thực đăng nhập
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_KiemTraDangNhap')
BEGIN
    DROP PROCEDURE sp_KiemTraDangNhap;
END
GO

CREATE PROCEDURE sp_KiemTraDangNhap
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        NguoiDungID, 
        VaiTroID, 
        HoTen, 
        TenDangNhap, 
        MatKhauHash, 
        Email, 
        SoDienThoai, 
        DiaChi, 
        NgayTao
    FROM NguoiDung
    WHERE TenDangNhap = @TenDangNhap;
END
GO

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 1. Trigger trừ tồn kho khi thêm sản phẩm vào hóa đơn chi tiết
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_ChiTietHoaDon_Insert')
BEGIN
    DROP TRIGGER trg_ChiTietHoaDon_Insert;
END
GO

CREATE TRIGGER trg_ChiTietHoaDon_Insert
ON ChiTietHoaDon
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Trừ tồn kho trong bảng SanPham
    UPDATE sp
    SET sp.SoLuongTon = sp.SoLuongTon - i.SoLuong
    FROM SanPham sp
    INNER JOIN inserted i ON sp.SanPhamID = i.SanPhamID;
END;
GO

-- 2. Trigger tự động hoàn lại tồn kho và số lượng voucher khi hủy hóa đơn
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_HoaDon_UpdateStatus')
BEGIN
    DROP TRIGGER trg_HoaDon_UpdateStatus;
END
GO

CREATE TRIGGER trg_HoaDon_UpdateStatus
ON HoaDon
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Nếu trạng thái đổi từ khác 'Đã hủy' sang 'Đã hủy'
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.HoaDonID = d.HoaDonID
        WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy'
    )
    BEGIN
        -- Hoàn lại tồn kho cho các sản phẩm trong chi tiết hóa đơn
        UPDATE sp
        SET sp.SoLuongTon = sp.SoLuongTon + cthd.SoLuong
        FROM SanPham sp
        INNER JOIN ChiTietHoaDon cthd ON sp.SanPhamID = cthd.SanPhamID
        INNER JOIN inserted i ON cthd.HoaDonID = i.HoaDonID
        INNER JOIN deleted d ON i.HoaDonID = d.HoaDonID
        WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy';
        
        -- Hoàn lại số lượng mã khuyến mãi nếu hóa đơn đó có áp dụng khuyến mãi
        UPDATE km
        SET km.SoLuong = km.SoLuong + 1
        FROM KhuyenMai km
        INNER JOIN inserted i ON km.KhuyenMaiID = i.KhuyenMaiID
        INNER JOIN deleted d ON i.HoaDonID = d.HoaDonID
        WHERE i.TrangThai = N'Đã hủy' AND d.TrangThai <> N'Đã hủy' AND i.KhuyenMaiID IS NOT NULL;
    END
END;
GO

-- =====================================================
-- STORED PROCEDURE TẠO HÓA ĐƠN
-- =====================================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_TaoHoaDon')
BEGIN
    DROP PROCEDURE sp_TaoHoaDon;
END
GO

CREATE PROCEDURE sp_TaoHoaDon
    @NguoiDungID INT,
    @MaKhuyenMai VARCHAR(50) = NULL,
    @DiaChiNhan NVARCHAR(255),
    @SoDienThoaiNhan VARCHAR(15),
    @GhiChu NVARCHAR(500) = NULL,
    @PhuongThucThanhToan NVARCHAR(50) = N'Tiền mặt',
    @ViDo DECIMAL(10,8) = NULL,
    @KinhDo DECIMAL(11,8) = NULL,
    @NewHoaDonID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @GioHangID INT;
    DECLARE @TongTienGoc DECIMAL(18,2) = 0;
    DECLARE @KhuyenMaiID INT = NULL;
    DECLARE @SoTienGiam DECIMAL(18,2) = 0;
    DECLARE @TongTienSauGiam DECIMAL(18,2) = 0;
    
    -- 1. Lấy giỏ hàng của người dùng
    SELECT @GioHangID = GioHangID FROM GioHang WHERE NguoiDungID = @NguoiDungID;
    
    IF @GioHangID IS NULL OR NOT EXISTS (SELECT 1 FROM ChiTietGioHang WHERE GioHangID = @GioHangID)
    BEGIN
        RAISERROR(N'Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.', 16, 1);
        RETURN;
    END

    -- 2. Kiểm tra các sản phẩm trong giỏ có bị ngừng kinh doanh hay không
    IF EXISTS (
        SELECT 1 
        FROM ChiTietGioHang ct
        INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
        WHERE ct.GioHangID = @GioHangID AND sp.TrangThai = 0
    )
    BEGIN
        RAISERROR(N'Có sản phẩm trong giỏ hàng đã ngừng kinh doanh. Vui lòng kiểm tra lại.', 16, 1);
        RETURN;
    END

    -- 3. Kiểm tra xem số lượng mua có vượt quá số lượng tồn kho hay không
    IF EXISTS (
        SELECT 1 
        FROM ChiTietGioHang ct
        INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
        WHERE ct.GioHangID = @GioHangID AND ct.SoLuong > sp.SoLuongTon
    )
    BEGIN
        RAISERROR(N'Một hoặc nhiều sản phẩm trong giỏ hàng vượt quá số lượng tồn kho khả dụng.', 16, 1);
        RETURN;
    END

    -- 4. Tính tổng tiền gốc
    SELECT @TongTienGoc = SUM(ct.SoLuong * sp.Gia)
    FROM ChiTietGioHang ct
    INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
    WHERE ct.GioHangID = @GioHangID;

    -- 5. Áp dụng mã khuyến mãi (nếu có)
    IF @MaKhuyenMai IS NOT NULL AND TRIM(@MaKhuyenMai) <> ''
    BEGIN
        SELECT TOP 1
            @KhuyenMaiID = KhuyenMaiID,
            @SoTienGiam = CASE 
                WHEN PhanTramGiam > 0 THEN (@TongTienGoc * PhanTramGiam / 100.0)
                ELSE SoTienGiam
            END,
            -- Đánh dấu mã lỗi vào SoTienGiam để kiểm tra
            @SoTienGiam = CASE 
                WHEN @TongTienGoc < DieuKienToiThieu THEN -1 -- Không đủ điều kiện đơn hàng tối thiểu
                WHEN GETDATE() NOT BETWEEN NgayBatDau AND NgayKetThuc THEN -2 -- Hết hạn hoặc chưa bắt đầu
                WHEN SoLuong <= 0 THEN -3 -- Hết lượt sử dụng
                WHEN TrangThai = 0 THEN -4 -- Mã khuyến mãi bị khóa
                ELSE CASE 
                    -- Đảm bảo tiền giảm không vượt quá tổng tiền
                    WHEN PhanTramGiam > 0 THEN CASE WHEN (@TongTienGoc * PhanTramGiam / 100.0) > @TongTienGoc THEN @TongTienGoc ELSE (@TongTienGoc * PhanTramGiam / 100.0) END
                    ELSE CASE WHEN SoTienGiam > @TongTienGoc THEN @TongTienGoc ELSE SoTienGiam END
                END
            END
        FROM KhuyenMai
        WHERE MaKhuyenMai = TRIM(UPPER(@MaKhuyenMai));

        -- Kiểm tra các trường hợp lỗi khuyến mãi
        IF @KhuyenMaiID IS NULL
        BEGIN
            RAISERROR(N'Mã khuyến mãi không tồn tại.', 16, 1);
            RETURN;
        END

        IF @SoTienGiam = -1
        BEGIN
            RAISERROR(N'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã khuyến mãi này.', 16, 1);
            RETURN;
        END

        IF @SoTienGiam = -2
        BEGIN
            RAISERROR(N'Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng.', 16, 1);
            RETURN;
        END

        IF @SoTienGiam = -3
        BEGIN
            RAISERROR(N'Mã khuyến mãi đã hết lượt sử dụng.', 16, 1);
            RETURN;
        END

        IF @SoTienGiam = -4
        BEGIN
            RAISERROR(N'Mã khuyến mãi đã bị vô hiệu hóa.', 16, 1);
            RETURN;
        END
    END

    -- Tính tổng tiền sau khi giảm giá
    SET @TongTienSauGiam = @TongTienGoc - @SoTienGiam;
    IF @TongTienSauGiam < 0 SET @TongTienSauGiam = 0;

    -- Bắt đầu TRANSACTION để đảm bảo tính toàn vẹn dữ liệu
    BEGIN TRY
        BEGIN TRANSACTION;

        -- a. Giảm số lượng của mã khuyến mãi
        IF @KhuyenMaiID IS NOT NULL
        BEGIN
            UPDATE KhuyenMai
            SET SoLuong = SoLuong - 1
            WHERE KhuyenMaiID = @KhuyenMaiID;
        END

        -- b. Tạo hóa đơn kèm ViDo, KinhDo
        INSERT INTO HoaDon (NguoiDungID, KhuyenMaiID, NgayDat, TongTien, TrangThai, DiaChiNhan, SoDienThoaiNhan, GhiChu, ViDo, KinhDo)
        VALUES (@NguoiDungID, @KhuyenMaiID, GETDATE(), @TongTienSauGiam, N'Chờ xác nhận', @DiaChiNhan, @SoDienThoaiNhan, @GhiChu, @ViDo, @KinhDo);

        SET @NewHoaDonID = SCOPE_IDENTITY();

        -- c. Tạo chi tiết hóa đơn (Trigger trg_ChiTietHoaDon_Insert sẽ tự động chạy để trừ tồn kho trong SanPham)
        INSERT INTO ChiTietHoaDon (HoaDonID, SanPhamID, SoLuong, DonGia)
        SELECT @NewHoaDonID, ct.SanPhamID, ct.SoLuong, sp.Gia
        FROM ChiTietGioHang ct
        INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
        WHERE ct.GioHangID = @GioHangID;

        -- d. Xóa toàn bộ sản phẩm trong giỏ hàng hiện tại của người dùng
        DELETE FROM ChiTietGioHang WHERE GioHangID = @GioHangID;

        -- e. Khởi tạo thông tin thanh toán mặc định
        INSERT INTO ThanhToan (HoaDonID, PhuongThuc, TrangThaiThanhToan, NgayThanhToan)
        VALUES (@NewHoaDonID, @PhuongThucThanhToan, N'Chưa thanh toán', NULL);

        -- Hoàn thành transaction thành công
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Hủy bỏ transaction nếu xảy ra bất cứ lỗi nào
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrState INT = ERROR_STATE();
        RAISERROR(@ErrMsg, @ErrSeverity, @ErrState);
    END CATCH
END
GO

