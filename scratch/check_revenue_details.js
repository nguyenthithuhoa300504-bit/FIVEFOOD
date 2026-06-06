const { sql, connectDB } = require('../config/db.config');

async function run() {
  await connectDB();
  const request = new sql.Request();

  // 1. Current logic: Sum of TongTien where TrangThai = 'Hoàn thành'
  const currentRes = await request.query(`
    SELECT COALESCE(SUM(TongTien), 0) AS TongDoanhThuCurrent, COUNT(*) AS CountCurrent
    FROM HoaDon 
    WHERE TrangThai = N'Hoàn thành'
  `);
  console.log('Current Logic (Completed Orders):', currentRes.recordset[0]);

  // 2. Paid logic: Sum of TongTien where TrangThaiThanhToan = 'Đã thanh toán' and TrangThai != 'Đã hủy'
  const paidRes = await request.query(`
    SELECT COALESCE(SUM(hd.TongTien), 0) AS TongDoanhThuPaid, COUNT(*) AS CountPaid
    FROM HoaDon hd
    INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
    WHERE tt.TrangThaiThanhToan = N'Đã thanh toán' AND hd.TrangThai <> N'Đã hủy'
  `);
  console.log('Paid Logic (TrangThaiThanhToan = Đã thanh toán, TrangThai != Đã hủy):', paidRes.recordset[0]);

  // 3. Paid but not completed orders (Momo / Chuyển khoản in progress)
  const paidInProgressRes = await request.query(`
    SELECT hd.HoaDonID, hd.TongTien, hd.TrangThai, tt.PhuongThuc, tt.TrangThaiThanhToan
    FROM HoaDon hd
    INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
    WHERE tt.TrangThaiThanhToan = N'Đã thanh toán' AND hd.TrangThai <> N'Hoàn thành' AND hd.TrangThai <> N'Đã hủy'
  `);
  console.log('Paid but NOT completed (In progress):', paidInProgressRes.recordset);

  // 4. Completed but NOT paid (if any)
  const completedNotPaidRes = await request.query(`
    SELECT hd.HoaDonID, hd.TongTien, hd.TrangThai, tt.PhuongThuc, tt.TrangThaiThanhToan
    FROM HoaDon hd
    INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
    WHERE hd.TrangThai = N'Hoàn thành' AND tt.TrangThaiThanhToan <> N'Đã thanh toán'
  `);
  console.log('Completed but NOT paid:', completedNotPaidRes.recordset);

  // 5. Canceled but paid (if any)
  const canceledPaidRes = await request.query(`
    SELECT hd.HoaDonID, hd.TongTien, hd.TrangThai, tt.PhuongThuc, tt.TrangThaiThanhToan
    FROM HoaDon hd
    INNER JOIN ThanhToan tt ON hd.HoaDonID = tt.HoaDonID
    WHERE hd.TrangThai = N'Đã hủy' AND tt.TrangThaiThanhToan = N'Đã thanh toán'
  `);
  console.log('Canceled but paid:', canceledPaidRes.recordset);

  process.exit(0);
}

run();
