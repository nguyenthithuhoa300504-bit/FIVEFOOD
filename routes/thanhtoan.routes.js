const express = require('express');
const router = express.Router();
const thanhtoanController = require('../controllers/thanhtoan.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: ThanhToan
 *   description: API Quản lý thông tin Thanh toán (Payments)
 */

/**
 * @swagger
 * /api/thanhtoan:
 *   get:
 *     summary: Lấy danh sách tất cả các bản ghi thanh toán
 *     description: |
 *       Tải thông tin thanh toán:
 *       - **Admin**: Lấy tất cả thông tin thanh toán của tất cả hóa đơn trong hệ thống.
 *       - **Khách hàng**: Lấy danh sách các thông tin thanh toán cho hóa đơn của chính mình.
 *     tags: [ThanhToan]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ThanhToanID:
 *                     type: integer
 *                     example: 1
 *                   HoaDonID:
 *                     type: integer
 *                     example: 5
 *                   PhuongThuc:
 *                     type: string
 *                     example: "Tiền mặt"
 *                   TrangThaiThanhToan:
 *                     type: string
 *                     example: "Chưa thanh toán"
 *                   NgayThanhToan:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: null
 *                   NguoiDungID:
 *                     type: integer
 *                     example: 2
 *                   TongTien:
 *                     type: number
 *                     example: 85000
 *       401:
 *         description: Chưa xác thực token
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', verifyToken, thanhtoanController.getAllThanhToan);

/**
 * @swagger
 * /api/thanhtoan/{hoadonid}:
 *   get:
 *     summary: Lấy thông tin thanh toán theo HoaDonID
 *     description: |
 *       Lấy chi tiết bản ghi thanh toán của một hóa đơn cụ thể.
 *       Bảo mật: Chỉ cho phép Admin hoặc chính chủ nhân hóa đơn được truy cập.
 *     tags: [ThanhToan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hoadonid
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần xem thông tin thanh toán
 *     responses:
 *       200:
 *         description: Lấy thông tin thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ThanhToanID:
 *                   type: integer
 *                   example: 1
 *                 HoaDonID:
 *                   type: integer
 *                   example: 5
 *                 PhuongThuc:
 *                   type: string
 *                   example: "Tiền mặt"
 *                 TrangThaiThanhToan:
 *                   type: string
 *                   example: "Chưa thanh toán"
 *                 NgayThanhToan:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền truy cập thông tin thanh toán này
 *       404:
 *         description: Không tìm thấy thông tin thanh toán cho hóa đơn này
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:hoadonid', verifyToken, thanhtoanController.getThanhToanByHoaDonId);

/**
 * @swagger
 * /api/thanhtoan:
 *   post:
 *     summary: Tạo mới thông tin thanh toán cho một hóa đơn
 *     description: |
 *       Tạo một bản ghi thanh toán mới cho hóa đơn. 
 *       Mỗi hóa đơn chỉ có duy nhất một bản ghi thanh toán (quan hệ 1-1). 
 *       (Lưu ý: Hóa đơn được tạo tự động kèm bản ghi thanh toán mặc định qua procedure `sp_TaoHoaDon`. API này dùng để khởi tạo thủ công nếu chưa có).
 *       Bảo mật: Chỉ Admin hoặc chủ hóa đơn được phép tạo.
 *     tags: [ThanhToan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - HoaDonID
 *             properties:
 *               HoaDonID:
 *                 type: integer
 *                 description: ID của hóa đơn cần tạo thanh toán
 *                 example: 5
 *               PhuongThuc:
 *                 type: string
 *                 description: Phương thức thanh toán (Tiền mặt, Chuyển khoản, Momo)
 *                 enum: [Tiền mặt, Chuyển khoản, Momo]
 *                 default: Tiền mặt
 *                 example: "Tiền mặt"
 *               TrangThaiThanhToan:
 *                 type: string
 *                 description: Trạng thái thanh toán (Chưa thanh toán, Đã thanh toán)
 *                 enum: [Chưa thanh toán, Đã thanh toán]
 *                 default: Chưa thanh toán
 *                 example: "Chưa thanh toán"
 *               NgayThanhToan:
 *                 type: string
 *                 format: date-time
 *                 description: Thời điểm thanh toán (sẽ tự động lấy thời gian hiện tại nếu TrangThaiThanhToan là Đã thanh toán)
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Tạo thông tin thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tạo thông tin thanh toán thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ThanhToanID:
 *                       type: integer
 *                       example: 6
 *                     HoaDonID:
 *                       type: integer
 *                       example: 5
 *                     PhuongThuc:
 *                       type: string
 *                       example: "Tiền mặt"
 *                     TrangThaiThanhToan:
 *                       type: string
 *                       example: "Chưa thanh toán"
 *                     NgayThanhToan:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc hóa đơn đã có thông tin thanh toán
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền tạo thanh toán cho hóa đơn này
 *       404:
 *         description: Không tìm thấy hóa đơn tương ứng
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, thanhtoanController.createThanhToan);

/**
 * @swagger
 * /api/thanhtoan/{hoadonid}:
 *   put:
 *     summary: Cập nhật thông tin thanh toán theo HoaDonID
 *     description: |
 *       Cập nhật phương thức thanh toán, trạng thái hoặc ngày thanh toán cho hóa đơn cụ thể.
 *       Bảo mật: Chỉ Admin hoặc chủ hóa đơn mới được thực hiện.
 *     tags: [ThanhToan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hoadonid
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần cập nhật thông tin thanh toán
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               PhuongThuc:
 *                 type: string
 *                 description: Phương thức thanh toán mới
 *                 enum: [Tiền mặt, Chuyển khoản, Momo]
 *                 example: "Chuyển khoản"
 *               TrangThaiThanhToan:
 *                 type: string
 *                 description: Trạng thái thanh toán mới
 *                 enum: [Chưa thanh toán, Đã thanh toán]
 *                 example: "Đã thanh toán"
 *               NgayThanhToan:
 *                 type: string
 *                 format: date-time
 *                 description: Cập nhật thời điểm thanh toán
 *                 nullable: true
 *                 example: null
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thông tin thanh toán thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ThanhToanID:
 *                       type: integer
 *                       example: 1
 *                     HoaDonID:
 *                       type: integer
 *                       example: 5
 *                     PhuongThuc:
 *                       type: string
 *                       example: "Chuyển khoản"
 *                     TrangThaiThanhToan:
 *                       type: string
 *                       example: "Đã thanh toán"
 *                     NgayThanhToan:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-28T12:00:00.000Z"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền cập nhật thông tin thanh toán này
 *       404:
 *         description: Không tìm thấy thông tin thanh toán cho hóa đơn tương ứng
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:hoadonid', verifyToken, thanhtoanController.updateThanhToan);

/**
 * @swagger
 * /api/thanhtoan/{hoadonid}:
 *   delete:
 *     summary: Xóa bản ghi thanh toán theo HoaDonID (Yêu cầu quyền Admin)
 *     description: |
 *       Xóa thông tin thanh toán của một hóa đơn cụ thể.
 *       Bảo mật: Chỉ có Admin mới có quyền thực hiện hành động xóa này.
 *     tags: [ThanhToan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hoadonid
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần xóa thông tin thanh toán
 *     responses:
 *       200:
 *         description: Xóa thông tin thanh toán thành công
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền Quản trị viên)
 *       404:
 *         description: Không tìm thấy bản ghi thanh toán của hóa đơn này
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:hoadonid', verifyToken, isAdmin, thanhtoanController.deleteThanhToan);

module.exports = router;
