const express = require('express');
const router = express.Router();
const danhgiaController = require('../controllers/danhgia.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Gửi đánh giá mới cho món ăn (yêu cầu đăng nhập)
router.post('/', verifyToken, danhgiaController.createDanhGia);

// Lấy danh sách đánh giá của một sản phẩm (công khai)
router.get('/sanpham/:sanPhamId', danhgiaController.getDanhGiaBySanPham);

// Kiểm tra xem sản phẩm nào trong hóa đơn đã được đánh giá (yêu cầu đăng nhập)
router.get('/hoadon/:hoadonId', verifyToken, danhgiaController.getReviewedItemsInHoaDon);

module.exports = router;
