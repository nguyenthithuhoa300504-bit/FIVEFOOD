const { sql, connectDB } = require('../config/db.config');

async function check() {
  await connectDB();
  const request = new sql.Request();
  
  const vaitro = await request.query('SELECT * FROM VaiTro');
  console.log('VaiTro:', vaitro.recordset);

  const nguoidung = await request.query('SELECT NguoiDungID, VaiTroID, TenDangNhap, MatKhauHash FROM NguoiDung');
  console.log('NguoiDung:', nguoidung.recordset);
  
  process.exit(0);
}

check();
