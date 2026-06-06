const { sql, connectDB } = require('../config/db.config');
const bcrypt = require('bcryptjs');

async function run() {
  await connectDB();
  const hash = bcrypt.hashSync('123456', 10);
  console.log('New hash for 123456:', hash);

  const request = new sql.Request();
  request.input('MatKhauHash', sql.VarChar(255), hash);
  request.input('TenDangNhap', sql.VarChar(50), 'admin');

  const result = await request.query(
    'UPDATE NguoiDung SET MatKhauHash = @MatKhauHash WHERE TenDangNhap = @TenDangNhap'
  );
  
  console.log('Rows affected:', result.rowsAffected);
  process.exit(0);
}

run();
