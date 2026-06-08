const express = require('express');
const router = express.Router();
const yeuthichController = require('../controllers/yeuthich.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: YeuThich
 *   description: API Quản lý danh sách sản phẩm yêu thích (Favorites)
 */

/**
 * @swagger
 * /api/yeuthich:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
 *     tags: [YeuThich]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', verifyToken, yeuthichController.getFavorites);

/**
 * @swagger
 * /api/yeuthich:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [YeuThich]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SanPhamID
 *             properties:
 *               SanPhamID:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       400:
 *         description: Thiếu thông tin
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, yeuthichController.addFavorite);

/**
 * @swagger
 * /api/yeuthich/{sanphamid}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [YeuThich]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sanphamid
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:sanphamid', verifyToken, yeuthichController.removeFavorite);

/**
 * @swagger
 * /api/yeuthich:
 *   delete:
 *     summary: Xóa toàn bộ danh sách yêu thích
 *     tags: [YeuThich]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa toàn bộ thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/', verifyToken, yeuthichController.clearFavorites);

/**
 * @swagger
 * /api/yeuthich/dongbo:
 *   post:
 *     summary: Đồng bộ danh sách yêu thích từ localStorage lên DB
 *     tags: [YeuThich]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sanPhamIds
 *             properties:
 *               sanPhamIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/dongbo', verifyToken, yeuthichController.syncFavorites);

module.exports = router;
