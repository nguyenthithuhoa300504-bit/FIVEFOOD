const sql = require('mssql');
require('dotenv').config();

const server = process.env.DB_SERVER || 'localhost';
const port = parseInt(process.env.DB_PORT, 10) || 1433;
const isAzureSql = /\.database\.windows\.net$/i.test(server);

// Mặc định: localhost dùng encrypt=false để tránh lỗi SSL protocol trên máy cục bộ.
// Nếu chạy Azure SQL, set DB_ENCRYPT=true trong .env.
const encrypt = process.env.DB_ENCRYPT !== undefined
  ? process.env.DB_ENCRYPT === 'true'
  : isAzureSql;

const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE !== undefined
  ? process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  : true;

// Cấu hình kết nối đọc từ biến môi trường
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server,
  database: process.env.DB_DATABASE,
  port,
  options: {
    encrypt,
    trustServerCertificate,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
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
