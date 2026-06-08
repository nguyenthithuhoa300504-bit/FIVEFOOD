const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function run() {
  try {
    console.log('Đang kết nối tới database...');
    const pool = await sql.connect(config);
    console.log('Kết nối thành công!');

    // 1. Thêm cột ViDo, KinhDo vào bảng HoaDon
    console.log('Đang kiểm tra và thêm cột ViDo, KinhDo vào bảng HoaDon...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HoaDon') AND name = 'ViDo')
        BEGIN
          ALTER TABLE HoaDon ADD ViDo DECIMAL(10, 8) NULL;
          PRINT 'Đã thêm cột ViDo';
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('HoaDon') AND name = 'KinhDo')
        BEGIN
          ALTER TABLE HoaDon ADD KinhDo DECIMAL(11, 8) NULL;
          PRINT 'Đã thêm cột KinhDo';
        END
      `);
      console.log('=> Cột ViDo và KinhDo trong bảng HoaDon đã sẵn sàng.');
    } catch (err) {
      console.error('Lỗi khi thêm cột tọa độ:', err.message);
    }

    // 2. Tạo bảng DanhGia
    console.log('Đang kiểm tra và tạo bảng DanhGia...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('DanhGia') AND type = 'U')
        BEGIN
          CREATE TABLE DanhGia (
              DanhGiaID INT PRIMARY KEY IDENTITY(1,1),
              SanPhamID INT NOT NULL,
              NguoiDungID INT NOT NULL,
              HoaDonID INT NOT NULL,
              SoSao INT NOT NULL CHECK (SoSao BETWEEN 1 AND 5),
              BinhLuan NVARCHAR(500),
              NgayTao DATETIME DEFAULT GETDATE(),
              
              CONSTRAINT FK_DanhGia_SanPham FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
              CONSTRAINT FK_DanhGia_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID),
              CONSTRAINT FK_DanhGia_HoaDon FOREIGN KEY (HoaDonID) REFERENCES HoaDon(HoaDonID)
          );
          PRINT 'Đã tạo bảng DanhGia thành công';
        END
      `);
      console.log('=> Bảng DanhGia đã sẵn sàng.');
    } catch (err) {
      console.error('Lỗi khi tạo bảng DanhGia:', err.message);
    }

    // 3. Cập nhật Stored Procedure sp_TaoHoaDon
    console.log('Đang cập nhật Stored Procedure sp_TaoHoaDon...');
    try {
      // Xóa sp cũ nếu tồn tại
      await pool.request().query(`
        IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_TaoHoaDon')
        BEGIN
          DROP PROCEDURE sp_TaoHoaDon;
        END
      `);

      // Tạo sp mới hỗ trợ ViDo, KinhDo
      await pool.request().query(`
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
                    @SoTienGiam = CASE 
                        WHEN @TongTienGoc < DieuKienToiThieu THEN -1
                        WHEN GETDATE() NOT BETWEEN NgayBatDau AND NgayKetThuc THEN -2
                        WHEN SoLuong <= 0 THEN -3
                        WHEN TrangThai = 0 THEN -4
                        ELSE CASE 
                            WHEN PhanTramGiam > 0 THEN CASE WHEN (@TongTienGoc * PhanTramGiam / 100.0) > @TongTienGoc THEN @TongTienGoc ELSE (@TongTienGoc * PhanTramGiam / 100.0) END
                            ELSE CASE WHEN SoTienGiam > @TongTienGoc THEN @TongTienGoc ELSE SoTienGiam END
                        END
                    END
                FROM KhuyenMai
                WHERE MaKhuyenMai = TRIM(UPPER(@MaKhuyenMai));

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

            -- Bắt đầu TRANSACTION
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

                -- c. Tạo chi tiết hóa đơn
                INSERT INTO ChiTietHoaDon (HoaDonID, SanPhamID, SoLuong, DonGia)
                SELECT @NewHoaDonID, ct.SanPhamID, ct.SoLuong, sp.Gia
                FROM ChiTietGioHang ct
                INNER JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
                WHERE ct.GioHangID = @GioHangID;

                -- d. Xóa giỏ hàng
                DELETE FROM ChiTietGioHang WHERE GioHangID = @GioHangID;

                -- e. Khởi tạo thông tin thanh toán mặc định
                INSERT INTO ThanhToan (HoaDonID, PhuongThuc, TrangThaiThanhToan, NgayThanhToan)
                VALUES (@NewHoaDonID, @PhuongThucThanhToan, N'Chưa thanh toán', NULL);

                COMMIT TRANSACTION;
            END TRY
            BEGIN CATCH
                IF @@TRANCOUNT > 0
                    ROLLBACK TRANSACTION;

                DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
                DECLARE @ErrSeverity INT = ERROR_SEVERITY();
                DECLARE @ErrState INT = ERROR_STATE();
                RAISERROR(@ErrMsg, @ErrSeverity, @ErrState);
            END CATCH
        END
      `);
      console.log('=> Stored Procedure sp_TaoHoaDon đã cập nhật thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật Stored Procedure:', err.message);
    }

    await sql.close();
    console.log('Hoàn thành cập nhật database!');
  } catch (err) {
    console.error('Lỗi kết nối hoặc thực thi:', err.message);
  }
}

run();
