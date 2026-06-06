const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Các API thống kê và quản trị dành cho Quản trị viên (Admin)
 */

/**
 * @swagger
 * /api/admin/thongke:
 *   get:
 *     summary: Thống kê số lượng (Tổng người dùng, Tổng sản phẩm, Tổng hóa đơn)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 TongNguoiDung:
 *                   type: integer
 *                   example: 10
 *                 TongSanPham:
 *                   type: integer
 *                   example: 25
 *                 TongHoaDon:
 *                   type: integer
 *                   example: 15
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi lấy dữ liệu thống kê
 */
router.get('/thongke', verifyToken, isAdmin, adminController.getThongKe);

/**
 * @swagger
 * /api/admin/doanhthu:
 *   get:
 *     summary: Tính tổng doanh thu thực tế từ các hóa đơn đã thanh toán (không bao gồm đơn đã hủy)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tính toán doanh thu thực tế thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 TongDoanhThu:
 *                   type: number
 *                   format: float
 *                   example: 1250000.00
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi tính doanh thu
 */
router.get('/doanhthu', verifyToken, isAdmin, adminController.getDoanhThu);

/**
 * @swagger
 * /api/admin/donhang:
 *   get:
 *     summary: Lấy danh sách tất cả các đơn hàng (Hóa đơn), sắp xếp mới nhất trước
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tải danh sách đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   HoaDonID:
 *                     type: integer
 *                     example: 5
 *                   NguoiDungID:
 *                     type: integer
 *                     example: 3
 *                   TenKhachHang:
 *                     type: string
 *                     example: Nguyễn Văn A
 *                   KhuyenMaiID:
 *                     type: integer
 *                     example: 1
 *                   NgayDat:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-05-28T07:15:00.000Z
 *                   TongTien:
 *                     type: number
 *                     format: float
 *                     example: 150000.00
 *                   TrangThai:
 *                     type: string
 *                     example: Chờ xác nhận
 *                   DiaChiNhan:
 *                     type: string
 *                     example: 123 Đường ABC, Quận 1
 *                   SoDienThoaiNhan:
 *                     type: string
 *                     example: 0987654321
 *                   GhiChu:
 *                     type: string
 *                     example: Giao giờ hành chính
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi lấy danh sách đơn hàng
 */
router.get('/donhang', verifyToken, isAdmin, adminController.getDanhSachDonHang);

/**
 * @swagger
 * /api/admin/sanphambanchay:
 *   get:
 *     summary: Lấy Top 5 sản phẩm bán chạy nhất
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm bán chạy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   SanPhamID:
 *                     type: integer
 *                     example: 2
 *                   TenSanPham:
 *                     type: string
 *                     example: Gà Rán KFC
 *                   Gia:
 *                     type: number
 *                     format: float
 *                     example: 35000.00
 *                   HinhAnh:
 *                     type: string
 *                     example: garan.jpg
 *                   TongSoLuongDaBan:
 *                     type: integer
 *                     example: 45
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi lấy danh sách sản phẩm bán chạy
 */
router.get('/sanphambanchay', verifyToken, isAdmin, adminController.getTopSanPhamBanChay);

/**
 * @swagger
 * /api/admin/bieudo:
 *   get:
 *     summary: Lấy dữ liệu vẽ biểu đồ thống kê doanh thu và đơn hàng
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tải dữ liệu biểu đồ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 doanhThuThang:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Nam:
 *                         type: integer
 *                         example: 2026
 *                       Thang:
 *                         type: integer
 *                         example: 6
 *                       DoanhThu:
 *                         type: number
 *                         example: 1520000.00
 *                       SoDonHang:
 *                         type: integer
 *                         example: 12
 *                 trangThaiDon:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       TrangThai:
 *                         type: string
 *                         example: "Hoàn thành"
 *                       SoLuong:
 *                         type: integer
 *                         example: 28
 *                 doanhThuDanhMuc:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       TenDanhMuc:
 *                         type: string
 *                         example: "Cơm"
 *                       DoanhThu:
 *                         type: number
 *                         example: 850000.00
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/bieudo', verifyToken, isAdmin, adminController.getBieuDo);

module.exports = router;

