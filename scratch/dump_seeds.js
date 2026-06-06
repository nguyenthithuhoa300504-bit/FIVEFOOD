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
    const pool = await sql.connect(config);
    console.log('Connected to database!');

    const tables = ['VaiTro', 'NguoiDung', 'DanhMuc', 'SanPham', 'KhuyenMai'];
    for (const table of tables) {
      const result = await pool.request().query(`SELECT * FROM ${table}`);
      console.log(`\n--- TABLE ${table} ---`);
      console.log(JSON.stringify(result.recordset, null, 2));
    }

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
