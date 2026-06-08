const express = require('express');
const router = express.Router();
const nguoiDungController = require('../controllers/nguoidung.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: NguoiDung
 *   description: API Quản lý người dùng (Users) & Xác thực
 */

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Đăng ký tài khoản người dùng mới
 *     tags: [NguoiDung]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - VaiTroID
 *               - HoTen
 *               - TenDangNhap
 *               - MatKhau
 *             properties:
 *               VaiTroID:
 *                 type: integer
 *                 example: 2
 *                 description: ID của vai trò (Ví dụ 1 cho Admin, 2 cho Khách hàng)
 *               HoTen:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               TenDangNhap:
 *                 type: string
 *                 example: "nguyenvana"
 *               MatKhau:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               Email:
 *                 type: string
 *                 format: email
 *                 example: "vana@example.com"
 *               SoDienThoai:
 *                 type: string
 *                 example: "0912345678"
 *               DiaChi:
 *                 type: string
 *                 example: "123 Đường ABC, Quận 1, TP. HCM"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đăng ký người dùng thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     NguoiDungID:
 *                       type: integer
 *                       example: 10
 *                     VaiTroID:
 *                       type: integer
 *                       example: 2
 *                     HoTen:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     TenDangNhap:
 *                       type: string
 *                       example: "nguyenvana"
 *                     Email:
 *                       type: string
 *                       example: "vana@example.com"
 *                     SoDienThoai:
 *                       type: string
 *                       example: "0912345678"
 *                     DiaChi:
 *                       type: string
 *                       example: "123 Đường ABC, Quận 1, TP. HCM"
 *                     NgayTao:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Thiếu dữ liệu bắt buộc hoặc trùng tên đăng nhập/email
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/register', nguoiDungController.register);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Đăng nhập hệ thống (NguoiDung Controller)
 *     tags: [NguoiDung]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TenDangNhap
 *               - MatKhau
 *             properties:
 *               TenDangNhap:
 *                 type: string
 *                 example: "admin"
 *               MatKhau:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đăng nhập thành công."
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     NguoiDungID:
 *                       type: integer
 *                       example: 1
 *                     VaiTroID:
 *                       type: integer
 *                       example: 1
 *                     HoTen:
 *                       type: string
 *                       example: "Quản trị viên"
 *                     TenDangNhap:
 *                       type: string
 *                       example: "admin"
 *                     Email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     SoDienThoai:
 *                       type: string
 *                       example: "0987654321"
 *                     DiaChi:
 *                       type: string
 *                       example: "Trung tâm Quận 1"
 *                     NgayTao:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Thiếu thông tin đầu vào
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/login', nguoiDungController.login);

/**
 * @swagger
 * /api/nguoidung:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (Yêu cầu quyền Admin)
 *     tags: [NguoiDung]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   NguoiDungID:
 *                     type: integer
 *                     example: 1
 *                   VaiTroID:
 *                     type: integer
 *                     example: 2
 *                   HoTen:
 *                     type: string
 *                     example: "Nguyễn Văn A"
 *                   TenDangNhap:
 *                     type: string
 *                     example: "nguyenvana"
 *                   Email:
 *                     type: string
 *                     example: "vana@example.com"
 *                   SoDienThoai:
 *                     type: string
 *                     example: "0912345678"
 *                   DiaChi:
 *                     type: string
 *                     example: "123 Đường ABC"
 *                   NgayTao:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Admin)
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/nguoidung', verifyToken, isAdmin, nguoiDungController.getAllNguoiDung);

/**
 * @swagger
 * /api/nguoidung/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của người dùng theo ID (Yêu cầu Token)
 *     tags: [NguoiDung]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần lấy
 *     responses:
 *       200:
 *         description: Tìm thấy thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 NguoiDungID:
 *                   type: integer
 *                   example: 1
 *                 VaiTroID:
 *                   type: integer
 *                   example: 2
 *                 HoTen:
 *                   type: string
 *                   example: "Nguyễn Văn A"
 *                 TenDangNhap:
 *                   type: string
 *                   example: "nguyenvana"
 *                 Email:
 *                   type: string
 *                   example: "vana@example.com"
 *                 SoDienThoai:
 *                   type: string
 *                   example: "0912345678"
 *                 DiaChi:
 *                   type: string
 *                   example: "123 Đường ABC"
 *                 NgayTao:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/nguoidung/:id', verifyToken, nguoiDungController.getNguoiDungById);

/**
 * @swagger
 * /api/nguoidung/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng theo ID (Yêu cầu Token)
 *     tags: [NguoiDung]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               VaiTroID:
 *                 type: integer
 *                 example: 2
 *               HoTen:
 *                 type: string
 *                 example: "Nguyễn Văn A (Đã Sửa)"
 *               MatKhau:
 *                 type: string
 *                 format: password
 *                 example: "newpassword456"
 *               Email:
 *                 type: string
 *                 format: email
 *                 example: "vansua@example.com"
 *               SoDienThoai:
 *                 type: string
 *                 example: "0999888777"
 *               DiaChi:
 *                 type: string
 *                 example: "456 Đường XYZ"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thông tin người dùng thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     NguoiDungID:
 *                       type: integer
 *                       example: 1
 *                     VaiTroID:
 *                       type: integer
 *                       example: 2
 *                     HoTen:
 *                       type: string
 *                       example: "Nguyễn Văn A (Đã Sửa)"
 *                     TenDangNhap:
 *                       type: string
 *                       example: "nguyenvana"
 *                     Email:
 *                       type: string
 *                       example: "vansua@example.com"
 *                     SoDienThoai:
 *                       type: string
 *                       example: "0999888777"
 *                     DiaChi:
 *                       type: string
 *                       example: "456 Đường XYZ"
 *                     NgayTao:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Lỗi trùng email hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/nguoidung/:id', verifyToken, nguoiDungController.updateNguoiDung);

/**
 * @swagger
 * /api/nguoidung/{id}:
 *   delete:
 *     summary: Xóa một người dùng theo ID (Yêu cầu quyền Admin)
 *     tags: [NguoiDung]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       400:
 *         description: Không thể xóa do có dữ liệu liên quan khác
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Admin)
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/nguoidung/:id', verifyToken, isAdmin, nguoiDungController.deleteNguoiDung);

module.exports = router;
