const express = require('express');
const router = express.Router();
const hoadonController = require('../controllers/hoadon.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: HoaDon
 *   description: API Quản lý Hóa đơn & Đặt hàng (Checkout, Order Flow)
 */

/**
 * @swagger
 * /api/hoadon:
 *   post:
 *     summary: Tạo hóa đơn mới từ giỏ hàng hiện tại (Checkout)
 *     description: |
 *       Thực hiện quy trình thanh toán và đặt hàng:
 *       1. Lấy toàn bộ sản phẩm trong giỏ hàng.
 *       2. Tính tổng tiền hàng.
 *       3. Áp dụng mã khuyến mãi (nếu có, kiểm tra hiệu lực, điều kiện tối thiểu, số lượng còn lại).
 *       4. Tạo hóa đơn mới.
 *       5. Chuyển sản phẩm giỏ hàng sang chi tiết hóa đơn.
 *       6. Trừ số lượng tồn kho của các sản phẩm tương ứng (thông qua Database Trigger).
 *       7. Xóa sạch giỏ hàng của người dùng.
 *       8. Tạo bản ghi thông tin thanh toán mặc định.
 *       Toàn bộ chuỗi thao tác được bảo vệ trong một Giao dịch cơ sở dữ liệu (Transaction) để đảm bảo tính toàn vẹn.
 *     tags: [HoaDon]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DiaChiNhan
 *               - SoDienThoaiNhan
 *             properties:
 *               NguoiDungID:
 *                 type: integer
 *                 description: ID của khách hàng đặt đơn (Nếu bỏ trống sẽ tự động lấy từ Token giải mã)
 *                 example: 2
 *               MaKhuyenMai:
 *                 type: string
 *                 description: Mã voucher khuyến mãi cần áp dụng cho đơn hàng
 *                 example: "GIAMGIA10"
 *               DiaChiNhan:
 *                 type: string
 *                 description: Địa chỉ giao nhận hàng
 *                 example: "123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh"
 *               SoDienThoaiNhan:
 *                 type: string
 *                 description: Số điện thoại người nhận hàng
 *                 example: "0987654321"
 *               GhiChu:
 *                 type: string
 *                 description: Lưu ý thêm cho đơn hàng
 *                 example: "Giao giờ hành chính, không cay"
 *               PhuongThucThanhToan:
 *                 type: string
 *                 description: Phương thức thanh toán (Tiền mặt, Chuyển khoản, Momo)
 *                 enum: [Tiền mặt, Chuyển khoản, Momo]
 *                 default: Tiền mặt
 *                 example: "Tiền mặt"
 *     responses:
 *       201:
 *         description: Đặt hàng và tạo hóa đơn thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đặt hàng và tạo hóa đơn thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     HoaDonID:
 *                       type: integer
 *                       example: 5
 *                     NguoiDungID:
 *                       type: integer
 *                       example: 2
 *                     TongTien:
 *                       type: number
 *                       example: 85000
 *                     TrangThai:
 *                       type: string
 *                       example: "Chờ xác nhận"
 *                     DiaChiNhan:
 *                       type: string
 *                       example: "123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh"
 *                     SoDienThoaiNhan:
 *                       type: string
 *                       example: "0987654321"
 *                     GhiChu:
 *                       type: string
 *                       example: "Giao giờ hành chính, không cay"
 *                     NgayDat:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-28T11:45:58.000Z"
 *                     PhuongThuc:
 *                       type: string
 *                       example: "Tiền mặt"
 *                     TrangThaiThanhToan:
 *                       type: string
 *                       example: "Chưa thanh toán"
 *                     MaKhuyenMai:
 *                       type: string
 *                       example: "GIAMGIA10"
 *                     TenKhuyenMai:
 *                       type: string
 *                       example: "Giảm 10% tổng hóa đơn"
 *       400:
 *         description: Giỏ hàng trống, hết tồn kho, khuyến mãi không hợp lệ, hoặc lỗi xử lý transaction
 *       401:
 *         description: Chưa xác thực token hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, hoadonController.createHoaDon);

/**
 * @swagger
 * /api/hoadon:
 *   get:
 *     summary: Lấy danh sách lịch sử hóa đơn
 *     description: |
 *       Tải danh sách các hóa đơn:
 *       - Đối với tài khoản **Khách hàng**: Trả về danh sách hóa đơn mua hàng của chính tài khoản đó.
 *       - Đối với tài khoản **Quản trị viên (Admin)**: Trả về toàn bộ hóa đơn của tất cả người dùng trong hệ thống.
 *     tags: [HoaDon]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách hóa đơn thành công
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
 *                     example: 2
 *                   TenKhachHang:
 *                     type: string
 *                     example: "Nguyễn Văn A"
 *                   TongTien:
 *                     type: number
 *                     example: 85000
 *                   TrangThai:
 *                     type: string
 *                     example: "Chờ xác nhận"
 *                   DiaChiNhan:
 *                     type: string
 *                     example: "123 Đường Nguyễn Trãi, Quận 1"
 *                   SoDienThoaiNhan:
 *                     type: string
 *                     example: "0987654321"
 *                   NgayDat:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-05-28T11:45:58.000Z"
 *                   PhuongThuc:
 *                     type: string
 *                     example: "Tiền mặt"
 *                   TrangThaiThanhToan:
 *                     type: string
 *                     example: "Chưa thanh toán"
 *                   MaKhuyenMai:
 *                     type: string
 *                     example: "GIAMGIA10"
 *       401:
 *         description: Chưa xác thực token
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', verifyToken, hoadonController.getAllHoaDon);

/**
 * @swagger
 * /api/hoadon/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một hóa đơn theo ID
 *     description: |
 *       Lấy thông tin đầy đủ về một hóa đơn bao gồm thông tin thanh toán, thông tin giao hàng,
 *       voucher đã dùng và danh sách chi tiết các món ăn/sản phẩm đã đặt.
 *       Bảo mật: Chỉ cho phép Admin hoặc chính khách hàng là chủ đơn hàng được phép truy cập.
 *     tags: [HoaDon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần xem chi tiết
 *     responses:
 *       200:
 *         description: Lấy chi tiết hóa đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 HoaDonID:
 *                   type: integer
 *                   example: 5
 *                 NguoiDungID:
 *                   type: integer
 *                   example: 2
 *                 TenKhachHang:
 *                   type: string
 *                   example: "Nguyễn Văn A"
 *                 EmailKhachHang:
 *                   type: string
 *                   example: "customer@example.com"
 *                 TongTien:
 *                   type: number
 *                   example: 85000
 *                 TrangThai:
 *                   type: string
 *                   example: "Chờ xác nhận"
 *                 DiaChiNhan:
 *                   type: string
 *                   example: "123 Đường Nguyễn Trãi, Quận 1"
 *                 SoDienThoaiNhan:
 *                   type: string
 *                   example: "0987654321"
 *                 GhiChu:
 *                   type: string
 *                   example: "Không cay"
 *                 NgayDat:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-05-28T11:45:58.000Z"
 *                 MaKhuyenMai:
 *                   type: string
 *                   example: "GIAMGIA10"
 *                 TenKhuyenMai:
 *                   type: string
 *                   example: "Giảm 10% tổng hóa đơn"
 *                 PhanTramGiam:
 *                   type: integer
 *                   example: 10
 *                 SoTienGiam:
 *                   type: number
 *                   example: 8500
 *                 ChiTiet:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ChiTietHoaDonID:
 *                         type: integer
 *                         example: 12
 *                       SanPhamID:
 *                         type: integer
 *                         example: 3
 *                       TenSanPham:
 *                         type: string
 *                         example: "Cơm gà Hải Nam"
 *                       HinhAnh:
 *                         type: string
 *                         example: "http://localhost:3000/images/comga.jpg"
 *                       SoLuong:
 *                         type: integer
 *                         example: 2
 *                       DonGia:
 *                         type: number
 *                         example: 45000
 *                       ThanhTien:
 *                         type: number
 *                         example: 90000
 *                 ThanhToan:
 *                   type: object
 *                   properties:
 *                     ThanhToanID:
 *                       type: integer
 *                       example: 4
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
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền truy cập (không phải chủ nhân hóa đơn hoặc admin)
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', verifyToken, hoadonController.getHoaDonById);

/**
 * @swagger
 * /api/hoadon/{id}/trangthai:
 *   put:
 *     summary: Cập nhật trạng thái của hóa đơn
 *     description: |
 *       Cập nhật tiến độ của đơn hàng.
 *       Phân quyền & Ràng buộc:
 *       - **Admin (Quản trị viên)**: Có quyền đổi sang bất kỳ trạng thái nào trong danh sách: `Chờ xác nhận`, `Đang giao`, `Hoàn thành`, `Đã hủy`.
 *       - **Khách hàng (Customer)**: Chỉ có quyền Hủy đơn hàng của chính mình (chuyển sang trạng thái `Đã hủy`) và CHỈ KHI đơn hàng hiện tại đang ở trạng thái ban đầu `Chờ xác nhận`.
 *       
 *       *Lưu ý hệ thống*: Khi đơn hàng được hủy (`Đã hủy`), Database Trigger (`trg_HoaDon_UpdateStatus`) sẽ tự động kích hoạt để:
 *       1. Hoàn lại số lượng tồn kho (`SoLuongTon`) cho tất cả các sản phẩm có trong hóa đơn đó.
 *       2. Hoàn lại số lượng voucher (`SoLuong`) của mã khuyến mãi đã sử dụng về lại bảng KhuyenMai.
 *       3. Khi đơn chuyển sang `Hoàn thành`, thông tin thanh toán sẽ được cập nhật tự động thành `Đã thanh toán`.
 *     tags: [HoaDon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần cập nhật trạng thái
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TrangThai
 *             properties:
 *               TrangThai:
 *                 type: string
 *                 enum: [Chờ xác nhận, Đang giao, Hoàn thành, Đã hủy]
 *                 description: Trạng thái mới của đơn hàng
 *                 example: "Đã hủy"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật trạng thái hóa đơn thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     HoaDonID:
 *                       type: integer
 *                       example: 5
 *                     TrangThai:
 *                       type: string
 *                       example: "Đã hủy"
 *       400:
 *         description: Trạng thái không hợp lệ hoặc không đủ điều kiện cập nhật (đơn hàng đã kết thúc hoặc không ở trạng thái Chờ xác nhận khi khách tự hủy)
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Không có quyền cập nhật trạng thái này
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id/trangthai', verifyToken, hoadonController.updateTrangThai);

/**
 * @swagger
 * /api/hoadon/{id}/diachi:
 *   put:
 *     summary: Cập nhật địa chỉ giao hàng của đơn hàng
 *     description: |
 *       Cho phép khách hàng cập nhật địa chỉ và số điện thoại giao hàng khi đơn hàng còn ở trạng thái "Chờ xác nhận".
 *       Khi đơn hàng đã chuyển sang "Đang giao" hoặc "Hoàn thành", địa chỉ sẽ bị khóa.
 *     tags: [HoaDon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của hóa đơn cần cập nhật địa chỉ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - DiaChiNhan
 *             properties:
 *               DiaChiNhan:
 *                 type: string
 *                 description: Địa chỉ giao hàng mới
 *                 example: "45 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh"
 *               SoDienThoaiNhan:
 *                 type: string
 *                 description: Số điện thoại người nhận mới (tùy chọn)
 *                 example: "0912345678"
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *       400:
 *         description: Đơn hàng không còn ở trạng thái Chờ xác nhận hoặc địa chỉ trống
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy hóa đơn
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id/diachi', verifyToken, hoadonController.updateDiaChiNhan);

module.exports = router;
