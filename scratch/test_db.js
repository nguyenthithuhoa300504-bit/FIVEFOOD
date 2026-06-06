const { sql, connectDB } = require('../config/db.config');

async function test() {
  try {
    await connectDB();
    console.log('Successfully connected to database.');

    const request = new sql.Request();
    
    console.log('\n--- LIST OF ROLES ---');
    const roles = await request.query('SELECT * FROM VaiTro');
    console.log(roles.recordset);

    console.log('\n--- LIST OF USERS ---');
    const users = await request.query('SELECT NguoiDungID, VaiTroID, HoTen, TenDangNhap, Email, SoDienThoai FROM NguoiDung');
    console.log(users.recordset);

    process.exit(0);
  } catch (error) {
    console.error('Error running test script:', error);
    process.exit(1);
  }
}

test();
