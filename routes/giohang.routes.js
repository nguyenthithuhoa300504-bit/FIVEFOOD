const express = require('express');
const router = express.Router();
const giohangController = require('../controllers/giohang.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: GioHang
 *   description: API Quản lý giỏ hàng trực tuyến (Cart)
 */

/**
 * @swagger
 * /api/giohang/{nguoidungid}:
 *   get:
 *     summary: Lấy chi tiết giỏ hàng của người dùng theo NguoiDungID
 *     description: Tải giỏ hàng cùng danh sách sản phẩm trong giỏ hàng. Nếu chưa có giỏ hàng, hệ thống tự động khởi tạo giỏ hàng mới.
 *     tags: [GioHang]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nguoidungid
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần lấy giỏ hàng
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin giỏ hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     GioHangID:
 *                       type: integer
 *                       example: 1
 *                     NguoiDungID:
 *                       type: integer
 *                       example: 2
 *                     HoTen:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     TongTien:
 *                       type: number
 *                       example: 95000
 *                     ChiTiet:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ChiTietGioHangID:
 *                             type: integer
 *                             example: 1
 *                           GioHangID:
 *                             type: integer
 *                             example: 1
 *                           SanPhamID:
 *                             type: integer
 *                             example: 3
 *                           SoLuong:
 *                             type: integer
 *                             example: 2
 *                           TenSanPham:
 *                             type: string
 *                             example: Cơm gà Hải Nam
 *                           Gia:
 *                             type: number
 *                             example: 45000
 *                           HinhAnh:
 *                             type: string
 *                             example: https://example.com/comga.jpg
 *                           SoLuongTon:
 *                             type: integer
 *                             example: 50
 *                           ThanhTien:
 *                             type: number
 *                             example: 90000
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       403:
 *         description: Không tìm thấy token xác thực
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:nguoidungid', verifyToken, giohangController.getGioHangByNguoiDungId);

/**
 * @swagger
 * /api/giohang/them:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     description: Thêm mới hoặc cộng dồn số lượng sản phẩm trong giỏ hàng. Có kiểm tra giới hạn tồn kho.
 *     tags: [GioHang]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - NguoiDungID
 *               - SanPhamID
 *             properties:
 *               NguoiDungID:
 *                 type: integer
 *                 example: 2
 *                 description: ID của người dùng
 *               SanPhamID:
 *                 type: integer
 *                 example: 3
 *                 description: ID sản phẩm cần thêm
 *               SoLuong:
 *                 type: integer
 *                 example: 1
 *                 description: Số lượng cần thêm
 *     responses:
 *       200:
 *         description: Thêm sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thêm sản phẩm vào giỏ hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     ChiTietGioHangID:
 *                       type: integer
 *                       example: 1
 *                     GioHangID:
 *                       type: integer
 *                       example: 1
 *                     SanPhamID:
 *                       type: integer
 *                       example: 3
 *                     SoLuong:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Thiếu thông tin hoặc số lượng mua vượt quá số lượng tồn
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng hoặc sản phẩm
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/them', verifyToken, giohangController.themVaoGioHang);

/**
 * @swagger
 * /api/giohang/capnhat:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     description: Cập nhật trực tiếp số lượng sản phẩm bằng ChiTietGioHangID hoặc cặp (NguoiDungID, SanPhamID). Nếu số lượng bằng 0 hoặc nhỏ hơn, hệ thống tự động xóa sản phẩm ra khỏi giỏ hàng.
 *     tags: [GioHang]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SoLuong
 *             properties:
 *               ChiTietGioHangID:
 *                 type: integer
 *                 example: 1
 *                 description: ID chi tiết giỏ hàng cần cập nhật (Có thể truyền thay cho NguoiDungID và SanPhamID)
 *               NguoiDungID:
 *                 type: integer
 *                 example: 2
 *                 description: ID người dùng (Dùng nếu không truyền ChiTietGioHangID)
 *               SanPhamID:
 *                 type: integer
 *                 example: 3
 *                 description: ID sản phẩm (Dùng nếu không truyền ChiTietGioHangID)
 *               SoLuong:
 *                 type: integer
 *                 example: 5
 *                 description: Số lượng cập nhật mới
 *     responses:
 *       200:
 *         description: Cập nhật giỏ hàng hoặc xóa sản phẩm (khi SoLuong = 0) thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt quá số lượng tồn kho khả dụng
 *       401:
 *         description: Token không hợp lệ
 *       404:
 *         description: Không tìm thấy chi tiết giỏ hàng tương ứng
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/capnhat', verifyToken, giohangController.capNhatGioHang);

/**
 * @swagger
 * /api/giohang/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     description: Xóa một mục sản phẩm cụ thể ra khỏi giỏ hàng theo ChiTietGioHangID.
 *     tags: [GioHang]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ChiTietGioHangID của mục sản phẩm muốn xóa
 *     responses:
 *       200:
 *         description: Xóa sản phẩm khỏi giỏ hàng thành công
 *       401:
 *         description: Token không hợp lệ
 *       404:
 *         description: Không tìm thấy mục sản phẩm trong giỏ hàng để xóa
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/item/:id', verifyToken, giohangController.xoaKhoiGioHang);

module.exports = router;
