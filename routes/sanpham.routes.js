const express = require('express');
const router = express.Router();
const sanphamController = require('../controllers/sanpham.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: SanPham
 *   description: API Quản lý sản phẩm (Products)
 */

/**
 * @swagger
 * /api/sanpham/timkiem:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo tên hoặc mô tả
 *     tags: [SanPham]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: "Từ khóa cần tìm kiếm (ví dụ ga, cơm)"
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm khớp với từ khóa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   SanPhamID:
 *                     type: integer
 *                   DanhMucID:
 *                     type: integer
 *                   TenSanPham:
 *                     type: string
 *                   Gia:
 *                     type: number
 *                   SoLuongTon:
 *                     type: integer
 *                   HinhAnh:
 *                     type: string
 *                   MoTa:
 *                     type: string
 *                   TrangThai:
 *                     type: boolean
 *                   NgayTao:
 *                     type: string
 *                   TenDanhMuc:
 *                     type: string
 *       400:
 *         description: Từ khóa tìm kiếm trống
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/timkiem', sanphamController.searchProducts);

/**
 * @swagger
 * /api/sanpham/danhmuc/{id}:
 *   get:
 *     summary: Lọc danh sách sản phẩm theo DanhMucID
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục sản phẩm
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm thuộc danh mục đó
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/danhmuc/:id', sanphamController.getProductsByCategory);

/**
 * @swagger
 * /api/sanpham:
 *   get:
 *     summary: Lấy danh sách sản phẩm (có hỗ trợ phân trang)
 *     tags: [SanPham]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: "Số trang hiện tại (ví dụ ?page=1)"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: "Số sản phẩm tối đa trên 1 trang (ví dụ ?limit=10)"
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm được tải thành công. Nếu dùng query page sẽ trả về object chứa thông tin phân trang.
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', sanphamController.getAllProducts);

/**
 * @swagger
 * /api/sanpham/dathang:
 *   get:
 *     summary: Lấy danh sách sản phẩm người dùng đã từng đặt mua
 *     tags: [SanPham]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm đã đặt mua
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/dathang', verifyToken, sanphamController.getOrderedProducts);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin một sản phẩm theo ID
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Lấy thông tin sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm với ID đã cung cấp
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', sanphamController.getProductById);

/**
 * @swagger
 * /api/sanpham:
 *   post:
 *     summary: Tạo mới một sản phẩm (Yêu cầu quyền Admin)
 *     tags: [SanPham]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DanhMucID
 *               - TenSanPham
 *               - Gia
 *             properties:
 *               DanhMucID:
 *                 type: integer
 *                 example: 1
 *               TenSanPham:
 *                 type: string
 *                 example: Cơm chiên hải sản
 *               Gia:
 *                 type: number
 *                 example: 45000
 *               SoLuongTon:
 *                 type: integer
 *                 example: 50
 *               HinhAnh:
 *                 type: string
 *                 example: "https://example.com/images/com-chien.jpg"
 *               MoTa:
 *                 type: string
 *                 example: Cơm chiên giòn rụm với tôm, mực, chả lụa và trứng
 *               TrangThai:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, isAdmin, sanphamController.createProduct);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm theo ID (Yêu cầu quyền Admin)
 *     tags: [SanPham]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DanhMucID
 *               - TenSanPham
 *               - Gia
 *             properties:
 *               DanhMucID:
 *                 type: integer
 *                 example: 1
 *               TenSanPham:
 *                 type: string
 *                 example: Cơm chiên hải sản đặc biệt
 *               Gia:
 *                 type: number
 *                 example: 55000
 *               SoLuongTon:
 *                 type: integer
 *                 example: 40
 *               HinhAnh:
 *                 type: string
 *                 example: "https://example.com/images/com-chien-special.jpg"
 *               MoTa:
 *                 type: string
 *                 example: Cơm chiên đặc biệt bổ sung nhiều hải sản tươi ngon
 *               TrangThai:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id', verifyToken, isAdmin, sanphamController.updateProduct);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   delete:
 *     summary: Xóa một sản phẩm theo ID (Yêu cầu quyền Admin)
 *     tags: [SanPham]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *       400:
 *         description: Không thể xóa do đang có ràng buộc giỏ hàng/hóa đơn
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', verifyToken, isAdmin, sanphamController.deleteProduct);

module.exports = router;
