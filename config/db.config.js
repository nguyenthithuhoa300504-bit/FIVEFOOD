const sql = require('mssql');
require('dotenv').config();

// Cấu hình kết nối đọc từ biến môi trường
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, // Cần thiết nếu chạy trên Azure hoặc môi trường đám mây
    trustServerCertificate: true, // Bỏ qua xác thực SSL khi chạy dưới Local
  },
};

// Hàm khởi tạo và kết nối cơ sở dữ liệu
async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log('--------------------------------------------------');
    console.log('Kết nối thành công tới cơ sở dữ liệu MS SQL Server!');
    console.log(`Database: ${config.database} | Server: ${config.server}`);
    console.log('--------------------------------------------------');
    return pool;
  } catch (error) {
    console.error('--------------------------------------------------');
    console.error('Kết nối cơ sở dữ liệu MS SQL Server thất bại!');
    console.error('Chi tiết lỗi:', error.message);
    console.error('--------------------------------------------------');
    process.exit(1); // Dừng ứng dụng nếu không kết nối được database
  }
}

module.exports = {
  sql,
  connectDB,
};
