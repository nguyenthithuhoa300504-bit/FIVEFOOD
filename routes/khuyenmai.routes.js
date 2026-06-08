const express = require('express');
const router = express.Router();
const khuyenmaiController = require('../controllers/khuyenmai.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: KhuyenMai
 *   description: API Quản lý mã khuyến mãi và ưu đãi (Vouchers / Promotions)
 */

/**
 * @swagger
 * /api/khuyenmai:
 *   get:
 *     summary: Lấy danh sách tất cả các chương trình khuyến mãi
 *     tags: [KhuyenMai]
 *     responses:
 *       200:
 *         description: Danh sách khuyến mãi tải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   KhuyenMaiID:
 *                     type: integer
 *                     example: 1
 *                   MaKhuyenMai:
 *                     type: string
 *                     example: GIAM20K
 *                   TenKhuyenMai:
 *                     type: string
 *                     example: Giảm ngay 20k cho đơn từ 100k
 *                   PhanTramGiam:
 *                     type: integer
 *                     example: 0
 *                   SoTienGiam:
 *                     type: number
 *                     example: 20000
 *                   DieuKienToiThieu:
 *                     type: number
 *                     example: 100000
 *                   NgayBatDau:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-05-01T00:00:00.000Z
 *                   NgayKetThuc:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-06-01T00:00:00.000Z
 *                   SoLuong:
 *                     type: integer
 *                     example: 50
 *                   TrangThai:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Lỗi hệ thống khi lấy danh sách khuyến mãi
 */
router.get('/', khuyenmaiController.getAllKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một khuyến mãi theo ID
 *     tags: [KhuyenMai]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chương trình khuyến mãi cần lấy
 *     responses:
 *       200:
 *         description: Lấy thông tin chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 KhuyenMaiID:
 *                   type: integer
 *                   example: 1
 *                 MaKhuyenMai:
 *                   type: string
 *                   example: GIAM20K
 *                 TenKhuyenMai:
 *                   type: string
 *                   example: Giảm ngay 20k cho đơn từ 100k
 *                 PhanTramGiam:
 *                   type: integer
 *                   example: 0
 *                 SoTienGiam:
 *                   type: number
 *                   example: 20000
 *                 DieuKienToiThieu:
 *                   type: number
 *                   example: 100000
 *                 NgayBatDau:
 *                   type: string
 *                   format: date-time
 *                 NgayKetThuc:
 *                   type: string
 *                   format: date-time
 *                 SoLuong:
 *                   type: integer
 *                   example: 50
 *                 TrangThai:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', khuyenmaiController.getKhuyenMaiById);

/**
 * @swagger
 * /api/khuyenmai:
 *   post:
 *     summary: Tạo mới một chương trình khuyến mãi (Yêu cầu quyền Admin)
 *     tags: [KhuyenMai]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MaKhuyenMai
 *               - TenKhuyenMai
 *               - NgayBatDau
 *               - NgayKetThuc
 *               - SoLuong
 *             properties:
 *               MaKhuyenMai:
 *                 type: string
 *                 example: ANVAT20
 *               TenKhuyenMai:
 *                 type: string
 *                 example: Giảm 20% tổng đơn snack ăn vặt
 *               PhanTramGiam:
 *                 type: integer
 *                 description: Phần trăm giảm (0 - 100)
 *                 example: 20
 *               SoTienGiam:
 *                 type: number
 *                 description: Số tiền giảm cố định (đặt là 0 nếu giảm theo phần trăm)
 *                 example: 0
 *               DieuKienToiThieu:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu cần để áp dụng mã
 *                 example: 50000
 *               NgayBatDau:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-27T00:00:00.000Z"
 *               NgayKetThuc:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-30T23:59:59.000Z"
 *               SoLuong:
 *                 type: integer
 *                 description: Số lượng mã phát hành
 *                 example: 100
 *               TrangThai:
 *                 type: boolean
 *                 description: Trạng thái kích hoạt (mặc định true)
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo khuyến mãi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo mã khuyến mãi thành công
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ hoặc mã khuyến mãi đã tồn tại
 *       401:
 *         description: Chưa xác thực (thiếu/sai JWT token)
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu Admin)
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, isAdmin, khuyenmaiController.createKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   put:
 *     summary: Cập nhật chương trình khuyến mãi theo ID (Yêu cầu quyền Admin)
 *     tags: [KhuyenMai]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chương trình khuyến mãi cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MaKhuyenMai
 *               - TenKhuyenMai
 *               - NgayBatDau
 *               - NgayKetThuc
 *               - SoLuong
 *             properties:
 *               MaKhuyenMai:
 *                 type: string
 *                 example: ANVAT20
 *               TenKhuyenMai:
 *                 type: string
 *                 example: Giảm 20% tổng đơn snack ăn vặt
 *               PhanTramGiam:
 *                 type: integer
 *                 example: 20
 *               SoTienGiam:
 *                 type: number
 *                 example: 0
 *               DieuKienToiThieu:
 *                 type: number
 *                 example: 50000
 *               NgayBatDau:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-27T00:00:00.000Z"
 *               NgayKetThuc:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-30T23:59:59.000Z"
 *               SoLuong:
 *                 type: integer
 *                 example: 80
 *               TrangThai:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy mã khuyến mãi cần sửa
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id', verifyToken, isAdmin, khuyenmaiController.updateKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   delete:
 *     summary: Xóa một chương trình khuyến mãi theo ID (Yêu cầu quyền Admin)
 *     tags: [KhuyenMai]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chương trình khuyến mãi cần xóa
 *     responses:
 *       200:
 *         description: Xóa khuyến mãi thành công
 *       400:
 *         description: Khuyến mãi đã được sử dụng trong hóa đơn trước đó và không thể xóa
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy khuyến mãi cần xóa
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', verifyToken, isAdmin, khuyenmaiController.deleteKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/ap-dung:
 *   post:
 *     summary: Kiểm tra mã và tính giảm giá của voucher cho hóa đơn (5 bước xử lý nghiệp vụ)
 *     tags: [KhuyenMai]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - MaKhuyenMai
 *               - TongTien
 *             properties:
 *               MaKhuyenMai:
 *                 type: string
 *                 description: Mã voucher (ví dụ GIAM20K, ANVAT20)
 *                 example: GIAM20K
 *               TongTien:
 *                 type: number
 *                 description: Tổng giá trị hóa đơn trước giảm giá
 *                 example: 150000
 *     responses:
 *       200:
 *         description: Áp dụng mã khuyến mãi thành công và tính toán số tiền được giảm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Áp dụng mã khuyến mãi thành công.
 *                 data:
 *                   type: object
 *                   properties:
 *                     KhuyenMaiID:
 *                       type: integer
 *                       example: 1
 *                     MaKhuyenMai:
 *                       type: string
 *                       example: GIAM20K
 *                     TenKhuyenMai:
 *                       type: string
 *                       example: Giảm ngay 20k cho đơn từ 100k
 *                     PhanTramGiam:
 *                       type: integer
 *                       example: 0
 *                     SoTienGiam:
 *                       type: number
 *                       example: 20000
 *                     DieuKienToiThieu:
 *                       type: number
 *                       example: 100000
 *                     TongTienGoc:
 *                       type: number
 *                       example: 150000
 *                     SoTienDuocGiam:
 *                       type: number
 *                       example: 20000
 *                     TongTienSauGiam:
 *                       type: number
 *                       example: 130000
 *       400:
 *         description: Áp dụng thất bại (mã ngưng kích hoạt, chưa tới hạn, hết hạn, hết số lượng, hoặc không đủ điều kiện đơn tối thiểu)
 *       404:
 *         description: Không tìm thấy mã khuyến mãi trong hệ thống
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/ap-dung', khuyenmaiController.apDungKhuyenMai);

module.exports = router;
