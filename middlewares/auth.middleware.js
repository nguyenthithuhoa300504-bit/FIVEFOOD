const jwt = require('jsonwebtoken');

/**
 * Middleware verifyToken: Xác thực token người dùng
 * - Lấy token từ header Authorization (theo chuẩn Bearer)
 * - Giải mã bằng process.env.JWT_SECRET
 * - Trả về 403 nếu không có token, 401 nếu token sai/hết hạn
 * - Nếu thành công, gán payload vào req.user và gọi next()
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // Nếu không có token trả về 403
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      message: 'Không tìm thấy token xác thực.'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({
      message: 'Không tìm thấy token xác thực.'
    });
  }

  try {
    // Giải mã token bằng JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán payload giải mã được vào biến req.user
    req.user = decoded;

    // Ánh xạ thêm RoleId từ VaiTroID nếu cần để đảm bảo tính nhất quán
    if (req.user && req.user.VaiTroID !== undefined && req.user.RoleId === undefined) {
      req.user.RoleId = req.user.VaiTroID;
    }

    next();
  } catch (error) {
    // Nếu token sai/hết hạn trả về 401
    return res.status(401).json({
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }
};

/**
 * Middleware isAdmin: Kiểm tra quyền quản trị viên
 * - Kiểm tra xem req.user.RoleId có bằng 1 (Admin) không
 * - Nếu không phải Admin, trả về 403 kèm thông báo 'Yêu cầu quyền Quản trị viên'
 * - Gọi next() nếu hợp lệ
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.RoleId !== 1) {
    return res.status(403).json({
      message: 'Yêu cầu quyền Quản trị viên'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};
