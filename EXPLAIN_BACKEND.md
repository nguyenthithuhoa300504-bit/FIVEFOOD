# GIẢI THÍCH CHI TIẾT VỀ BACKEND DỰ ÁN FOODEXPRESS

Tài liệu này giải thích chi tiết cấu trúc, chức năng, cách tổ chức thư mục và nguyên lý hoạt động của mã nguồn **Backend** trong dự án **FoodExpress**.

---

## 1. CẤU TRÚC THƯ MỤC BACKEND

Thư mục gốc của Backend chứa các thành phần chính sau:

*   **`app.js`**: Điểm khởi đầu (Entry Point) của toàn bộ ứng dụng Backend.
*   **`config/db.config.js`**: Cấu hình kết nối tới cơ sở dữ liệu Microsoft SQL Server.
*   **`routes/`**: Định nghĩa danh sách các cổng kết nối (Endpoints) mà Frontend có thể gọi.
*   **`controllers/`**: Chứa logic xử lý nghiệp vụ thực tế của từng API (đọc/ghi database, tính toán, kiểm tra điều kiện).
*   **`middlewares/auth.middleware.js`**: Middleware xác thực người dùng bằng cơ chế JWT Token.
*   **`database.sql` & `procedures.sql`**: Kịch bản khởi tạo bảng, dữ liệu mẫu, stored procedures và triggers trong SQL Server.

---

## 2. CHI TIẾT TỪNG THÀNH PHẦN VÀ CƠ CHẾ HOẠT ĐỘNG

### 1. File Khởi Chạy Chính (`app.js`)
*   **Nhiệm vụ**: Khởi tạo ứng dụng Express, kết nối cơ sở dữ liệu (`connectDB`), cài đặt các middleware toàn cục, và kích hoạt Swagger.
*   **Các middleware cấu hình**:
    *   `cors()`: Cho phép gọi API xuyên miền (nếu sau này tách Frontend sang server khác).
    *   `express.json()` & `express.urlencoded()`: Phân tích cú pháp dữ liệu gửi lên dạng JSON hoặc Form-urlencoded thành đối tượng JS `req.body`.
    *   `express.static('public')`: Phục vụ các file giao diện tĩnh (HTML/CSS/JS) của Frontend.
*   **Tích hợp Swagger**:
    *   Đọc các chú thích API trong code (`routes/*.js`) để tự động tạo tài liệu đặc tả tại đường dẫn `/api-docs`.

### 2. Cấu Hình Cơ Sở Dữ Liệu (`config/db.config.js`)
*   Sử dụng thư viện `mssql` (driver chính thức của Microsoft dành cho Node.js).
*   Đọc các tham số kết nối từ file cấu hình môi trường `.env` (`DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE`, `DB_PORT`).
*   Khởi tạo hàm `connectDB` để mở kết nối lâu dài tới SQL Server giúp tăng hiệu năng truy vấn.

### 3. Middleware Xác Thực Người Dùng (`middlewares/auth.middleware.js`)
*   Chứa hàm `verifyToken` dùng để bảo vệ các API riêng tư (như đặt hàng, quản lý giỏ hàng, xem profile).
*   **Quy trình xác thực**:
    1.  Đọc Header `Authorization` từ request gửi lên. Header này có dạng `Bearer <chuỗi_token>`.
    2.  Sử dụng thư viện `jsonwebtoken` và mã bí mật `process.env.JWT_SECRET` để giải mã token.
    3.  Nếu token hợp lệ, lấy thông tin giải mã gồm `NguoiDungID` và `VaiTroID` gán vào đối tượng `req.user`, sau đó cho phép request đi tiếp tới Controller.
    4.  Nếu token không hợp lệ hoặc hết hạn, trả về mã lỗi `401 Unauthorized` hoặc `403 Forbidden`.

### 4. Định Tuyến (`routes/`) và Bộ Điều Khiển (`controllers/`)
Backend chia nhỏ các nghiệp vụ thành các cặp file Route và Controller tương ứng:

*   **Xác thực (`auth.routes.js` / `auth.controller.js`)**:
    *   API `POST /api/auth/login`: Nhận tên đăng nhập và mật khẩu, kiểm tra qua database và sinh JWT Token trả về cho client.
*   **Sản phẩm (`sanpham.routes.js` / `sanpham.controller.js`)**:
    *   API `GET /api/sanpham`: Lấy toàn bộ sản phẩm (có hỗ trợ phân trang).
    *   API `GET /api/sanpham/:id`: Lấy chi tiết một sản phẩm kèm trung bình số sao và tổng số đánh giá.
    *   API `GET /api/sanpham/danhmuc/:id`: Lọc sản phẩm theo danh mục.
    *   API `GET /api/sanpham/timkiem?q=...`: Tìm sản phẩm theo từ khóa.
    *   API `POST`, `PUT`, `DELETE` cho các thao tác thêm, sửa, xóa sản phẩm (chỉ dành cho Admin).
*   **Giỏ hàng (`giohang.routes.js` / `giohang.controller.js`)**:
    *   API `GET /api/giohang/:nguoidungid`: Lấy giỏ hàng của người dùng. Nếu chưa có, Backend tự động tạo giỏ hàng mới trong database.
    *   API `POST /api/giohang/them`: Thêm sản phẩm vào giỏ hoặc cộng dồn số lượng. Có kiểm tra tồn kho.
    *   API `PUT /api/giohang/capnhat`: Thay đổi số lượng món ăn trực tiếp. Nếu số lượng nhập bằng 0, tự động xóa món khỏi giỏ.
    *   API `DELETE /api/giohang/item/:id`: Xóa một món ăn khỏi giỏ hàng.
*   **Hóa đơn / Đơn hàng (`hoadon.routes.js` / `hoadon.controller.js`)**:
    *   API `POST /api/hoadon`: Tạo hóa đơn từ giỏ hàng hiện tại thông qua Stored Procedure `sp_TaoHoaDon`.
    *   API `GET /api/hoadon`: Lấy danh sách đơn hàng (Khách hàng chỉ xem được đơn của mình, Admin xem được toàn bộ hệ thống).
    *   API `GET /api/hoadon/:id`: Xem chi tiết 1 đơn hàng bao gồm thông tin giao nhận, danh sách món ăn đã mua và thông tin thanh toán.
    *   API `PUT /api/hoadon/:id/trangthai`: Cập nhật trạng thái đơn hàng (Chờ xác nhận, Đang giao, Hoàn thành, Đã hủy).
*   **Khuyến mãi (`khuyenmai.routes.js` / `khuyenmai.controller.js`)**:
    *   Quản lý danh sách voucher giảm giá, áp dụng voucher (`POST /api/khuyenmai/ap-dung`) để kiểm tra điều kiện giảm giá của đơn hàng.
*   **Đánh giá & Yêu thích (`danhgia.controller.js` / `yeuthich.controller.js`)**:
    *   Xử lý lưu trữ bình luận đánh giá sao cho sản phẩm và quản lý danh sách sản phẩm yêu thích của từng tài khoản khách hàng.

---

## 3. CƠ CHẾ GIAO DỊCH VÀ CƠ SỞ DỮ LIỆU ĐẶC BIỆT

Backend không chỉ chạy các câu truy vấn SELECT/INSERT đơn giản mà còn tận dụng tối đa sức mạnh xử lý của SQL Server thông qua:

### A. Stored Procedure `sp_TaoHoaDon`
Để tránh việc dữ liệu bị lỗi nửa chừng khi đặt hàng (ví dụ: tạo được hóa đơn nhưng không trừ được kho hoặc không xóa được giỏ hàng), Backend gọi thủ tục `sp_TaoHoaDon` được bọc trong một **TRANSACTION**:
1.  **Kiểm tra điều kiện**: Kiểm tra sản phẩm có bị ngưng bán (`TrangThai = 0`) hoặc vượt quá số lượng tồn kho hay không.
2.  **Áp dụng Voucher**: Kiểm tra ngày bắt đầu/kết thúc, số lượt sử dụng còn lại, giá trị đơn hàng tối thiểu. Nếu hợp lệ, giảm trừ 1 lượt sử dụng của voucher trong bảng `KhuyenMai`.
3.  **Tạo Hóa đơn**: Chèn 1 dòng mới vào bảng `HoaDon` để lấy ra `HoaDonID`.
4.  **Chuyển dữ liệu**: Copy toàn bộ sản phẩm đang có từ bảng `ChiTietGioHang` sang bảng `ChiTietHoaDon` với giá bán thực tế.
5.  **Làm sạch giỏ hàng**: Chạy lệnh `DELETE` làm trống giỏ hàng của người dùng.
6.  **Tạo thông tin thanh toán**: Chèn bản ghi mặc định vào bảng `ThanhToan` ở trạng thái `'Chưa thanh toán'`.
7.  Nếu tất cả các bước trên thành công, database sẽ lưu lại (`COMMIT`); nếu bất kỳ bước nào xảy ra lỗi, toàn bộ quá trình sẽ được hủy bỏ (`ROLLBACK`).

### B. Triggers tự động trong SQL Server
*   **`trg_ChiTietHoaDon_Insert`**: Kích hoạt tự động sau khi thêm dữ liệu vào chi tiết hóa đơn, thực hiện trừ số lượng tồn kho của sản phẩm:
    `SoLuongTon = SoLuongTon - SoLuongMua`.
*   **`trg_HoaDon_UpdateStatus`**: Kích hoạt tự động khi cập nhật cột `TrangThai` trong bảng `HoaDon` thành `'Đã hủy'`. Trigger này sẽ cộng trả lại số lượng sản phẩm vào kho (`SoLuongTon`) và cộng lại 1 lượt sử dụng cho mã khuyến mãi (`SoLuong`).
