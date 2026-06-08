const express = require('express');
const router = express.Router();
const danhmucController = require('../controllers/danhmuc.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: DanhMuc
 *   description: API Quản lý danh mục sản phẩm (Categories)
 */

/**
 * @swagger
 * /api/danhmuc:
 *   get:
 *     summary: Lấy danh sách tất cả các danh mục
 *     tags: [DanhMuc]
 *     responses:
 *       200:
 *         description: Danh sách danh mục đã được tải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   DanhMucID:
 *                     type: integer
 *                     example: 1
 *                   TenDanhMuc:
 *                     type: string
 *                     example: Đồ ăn nhanh
 *                   MoTa:
 *                     type: string
 *                     example: Các món ăn nhanh chế biến trong ngày
 *       500:
 *         description: Lỗi hệ thống khi tải danh sách danh mục
 */
router.get('/', danhmucController.getAllDanhMuc);

/**
 * @swagger
 * /api/danhmuc/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một danh mục theo ID
 *     tags: [DanhMuc]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục cần lấy
 *     responses:
 *       200:
 *         description: Lấy thông tin danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 DanhMucID:
 *                   type: integer
 *                   example: 1
 *                 TenDanhMuc:
 *                   type: string
 *                   example: Đồ ăn nhanh
 *                 MoTa:
 *                   type: string
 *                   example: Các món ăn nhanh chế biến trong ngày
 *       404:
 *         description: Không tìm thấy danh mục với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi lấy thông tin danh mục
 */
router.get('/:id', danhmucController.getDanhMucById);

/**
 * @swagger
 * /api/danhmuc:
 *   post:
 *     summary: Tạo mới một danh mục (Yêu cầu quyền Admin)
 *     tags: [DanhMuc]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TenDanhMuc
 *             properties:
 *               TenDanhMuc:
 *                 type: string
 *                 example: Đồ uống
 *               MoTa:
 *                 type: string
 *                 example: Các loại nước ngọt, cà phê, trà sữa
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo danh mục thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     DanhMucID:
 *                       type: integer
 *                       example: 2
 *                     TenDanhMuc:
 *                       type: string
 *                       example: Đồ uống
 *                     MoTa:
 *                       type: string
 *                       example: Các loại nước ngọt, cà phê, trà sữa
 *       400:
 *         description: Tên danh mục trống hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi tạo danh mục
 */
router.post('/', verifyToken, isAdmin, danhmucController.createDanhMuc);

/**
 * @swagger
 * /api/danhmuc/{id}:
 *   put:
 *     summary: Cập nhật thông tin danh mục theo ID (Yêu cầu quyền Admin)
 *     tags: [DanhMuc]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TenDanhMuc
 *             properties:
 *               TenDanhMuc:
 *                 type: string
 *                 example: Đồ uống giải khát
 *               MoTa:
 *                 type: string
 *                 example: Trà sữa, nước ép, cà phê và nước đóng chai
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật danh mục thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     DanhMucID:
 *                       type: integer
 *                       example: 2
 *                     TenDanhMuc:
 *                       type: string
 *                       example: Đồ uống giải khát
 *                     MoTa:
 *                       type: string
 *                       example: Trà sữa, nước ép, cà phê và nước đóng chai
 *       400:
 *         description: Tên danh mục trống hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy danh mục với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi cập nhật danh mục
 */
router.put('/:id', verifyToken, isAdmin, danhmucController.updateDanhMuc);

/**
 * @swagger
 * /api/danhmuc/{id}:
 *   delete:
 *     summary: Xóa một danh mục theo ID (Yêu cầu quyền Admin)
 *     tags: [DanhMuc]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục cần xóa
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *       400:
 *         description: Không thể xóa do đang có ràng buộc dữ liệu khác
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy danh mục với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi xóa danh mục
 */
router.delete('/:id', verifyToken, isAdmin, danhmucController.deleteDanhMuc);

module.exports = router;
