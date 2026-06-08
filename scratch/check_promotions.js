const { sql, connectDB } = require('../config/db.config');

async function run() {
  await connectDB();
  const request = new sql.Request();
  const res = await request.query('SELECT * FROM KhuyenMai');
  console.log('Promotions:', res.recordset);
  process.exit(0);
}

run();
