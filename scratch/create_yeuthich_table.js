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

    console.log('Đang kiểm tra và tạo bảng YeuThich...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('YeuThich') AND type = 'U')
      BEGIN
        CREATE TABLE YeuThich (
          YeuThichID INT PRIMARY KEY IDENTITY(1,1),
          NguoiDungID INT NOT NULL,
          SanPhamID INT NOT NULL,
          NgayThem DATETIME DEFAULT GETDATE(),
          
          CONSTRAINT FK_YeuThich_NguoiDung FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID) ON DELETE CASCADE,
          CONSTRAINT FK_YeuThich_SanPham FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
          CONSTRAINT UC_YeuThich_NguoiDung_SanPham UNIQUE (NguoiDungID, SanPhamID)
        );
        PRINT 'Đã tạo bảng YeuThich thành công';
      END
      ELSE
      BEGIN
        PRINT 'Bảng YeuThich đã tồn tại';
      END
    `);
    console.log('=> Bảng YeuThich đã sẵn sàng.');
    await sql.close();
  } catch (err) {
    console.error('Lỗi khi thiết lập bảng YeuThich:', err.message);
  }
}

run();
