const express = require('express');
const router = express.Router();
const vaitroController = require('../controllers/vaitro.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: VaiTro
 *   description: API Quản lý vai trò (Roles)
 */

/**
 * @swagger
 * /api/vaitro:
 *   get:
 *     summary: Lấy danh sách tất cả các vai trò
 *     tags: [VaiTro]
 *     responses:
 *       200:
 *         description: Danh sách vai trò đã được tải thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   VaiTroID:
 *                     type: integer
 *                     example: 1
 *                   TenVaiTro:
 *                     type: string
 *                     example: Admin
 *       500:
 *         description: Lỗi hệ thống khi tải danh sách vai trò
 */
router.get('/', vaitroController.getAllVaiTro);

/**
 * @swagger
 * /api/vaitro/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một vai trò theo ID
 *     tags: [VaiTro]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vai trò cần lấy
 *     responses:
 *       200:
 *         description: Lấy thông tin vai trò thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 VaiTroID:
 *                   type: integer
 *                   example: 1
 *                 TenVaiTro:
 *                   type: string
 *                   example: Admin
 *       404:
 *         description: Không tìm thấy vai trò với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi lấy thông tin vai trò
 */
router.get('/:id', vaitroController.getVaiTroById);

/**
 * @swagger
 * /api/vaitro:
 *   post:
 *     summary: Tạo mới một vai trò (Yêu cầu quyền Admin)
 *     tags: [VaiTro]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TenVaiTro
 *             properties:
 *               TenVaiTro:
 *                 type: string
 *                 example: Khách hàng
 *     responses:
 *       201:
 *         description: Tạo vai trò thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tạo vai trò thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     VaiTroID:
 *                       type: integer
 *                       example: 3
 *                     TenVaiTro:
 *                       type: string
 *                       example: Khách hàng
 *       400:
 *         description: Tên vai trò trống hoặc đã tồn tại
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống khi tạo vai trò
 */
router.post('/', verifyToken, isAdmin, vaitroController.createVaiTro);

/**
 * @swagger
 * /api/vaitro/{id}:
 *   put:
 *     summary: Cập nhật tên vai trò theo ID (Yêu cầu quyền Admin)
 *     tags: [VaiTro]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vai trò cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TenVaiTro
 *             properties:
 *               TenVaiTro:
 *                 type: string
 *                 example: Nhân viên
 *     responses:
 *       200:
 *         description: Cập nhật vai trò thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật vai trò thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     VaiTroID:
 *                       type: integer
 *                       example: 2
 *                     TenVaiTro:
 *                       type: string
 *                       example: Nhân viên
 *       400:
 *         description: Tên vai trò trống hoặc tên vai trò mới đã tồn tại
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy vai trò với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi cập nhật vai trò
 */
router.put('/:id', verifyToken, isAdmin, vaitroController.updateVaiTro);

/**
 * @swagger
 * /api/vaitro/{id}:
 *   delete:
 *     summary: Xóa một vai trò theo ID (Yêu cầu quyền Admin)
 *     tags: [VaiTro]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vai trò cần xóa
 *     responses:
 *       200:
 *         description: Xóa vai trò thành công
 *       400:
 *         description: Không thể xóa do đang có ràng buộc dữ liệu khác
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy vai trò với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống khi xóa vai trò
 */
router.delete('/:id', verifyToken, isAdmin, vaitroController.deleteVaiTro);

module.exports = router;
