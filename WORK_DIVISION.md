# BẢNG PHÂN CHIA CÔNG VIỆC THÀNH VIÊN NHÓM (5 NGƯỜI) - DỰ ÁN FOODEXPRESS

Tài liệu này phân chia chi tiết nhiệm vụ và **gán cụ thể các file mã nguồn** cho từng thành viên trong nhóm 5 người. Thiết kế này giúp các thành viên dễ dàng trả lời câu hỏi của Hội đồng chấm thi: *"Em đã làm file nào/phần nào trong dự án?"*

---

## BẢNG TỔNG HỢP PHÂN CHIA CÔNG VIỆC

| Thành viên | Vai trò chính | Các file mã nguồn phụ trách chính |
| :--- | :--- | :--- |
| **Thành viên 1**<br>*(Trưởng nhóm)* | **Database Engineer**<br>Thiết kế CSDL, Procedure & Triggers | `database.sql`<br>`procedures.sql`<br>`config/db.config.js` |
| **Thành viên 2** | **Backend Developer (Auth & Cart)**<br>Xử lý xác thực JWT, bảo mật & giỏ hàng | `app.js` (Cấu hình hệ thống)<br>`middlewares/auth.middleware.js`<br>`routes/auth.routes.js` / `controllers/auth.controller.js`<br>`routes/giohang.routes.js` / `controllers/giohang.controller.js`<br>`routes/khuyenmai.routes.js` / `controllers/khuyenmai.controller.js` |
| **Thành viên 3** | **Backend Developer (Admin & Products)**<br>API quản trị, hóa đơn, đánh giá & Swagger | `routes/sanpham.routes.js` / `controllers/sanpham.controller.js`<br>`routes/hoadon.routes.js` / `controllers/hoadon.controller.js`<br>`routes/danhgia.routes.js` / `controllers/danhgia.controller.js`<br>`routes/yeuthich.routes.js` / `controllers/yeuthich.controller.js` |
| **Thành viên 4** | **Frontend Developer (Client App)**<br>Giao diện khách hàng, CSS Core & Logic client | `public/index.html`<br>`public/favorites.html`<br>`public/css/style.css`<br>`public/js/app.js` |
| **Thành viên 5** | **Frontend Developer (Admin & Maps)**<br>Giao diện quản trị, Bản đồ Leaflet & Shipper | `public/admin.html`<br>`public/css/admin.css`<br>`public/js/admin.js`<br>`public/delivery-map.html` / `public/js/delivery-map.js`<br>`public/track-order.html` / `public/js/track-order.js` |

---

## CHI TIẾT NHIỆM VỤ TỪNG THÀNH VIÊN (ĐỂ ĐƯA VÀO SLIDE & TRẢ LỜI CÂU HỎI)

### 👤 Thành viên 1: Thiết kế Cơ sở dữ liệu & Database Logic
*   **Nội dung thuyết trình / Câu hỏi bảo vệ**: *"Em thiết kế CSDL như thế nào để đảm bảo tính toàn vẹn dữ liệu khi đặt hàng và hủy đơn?"*
*   **Câu trả lời chuẩn**:
    *   Em thiết kế cấu trúc CSDL gồm 12 bảng liên kết chặt chẽ bằng khóa ngoại (`database.sql`).
    *   Em viết **Stored Procedure `sp_TaoHoaDon`** (`procedures.sql`) sử dụng `TRANSACTION` để bọc toàn bộ chuỗi hành động: kiểm tra tồn kho, áp dụng voucher giảm giá, tạo hóa đơn, chuyển sản phẩm từ giỏ hàng sang chi tiết hóa đơn, xóa giỏ hàng và tạo bản ghi thanh toán.
    *   Em viết **Trigger trừ tồn kho** (`trg_ChiTietHoaDon_Insert`) và **Trigger hoàn kho/hoàn voucher khi hủy đơn** (`trg_HoaDon_UpdateStatus`) để hệ thống tự động hoàn trả số lượng mà không cần code Backend can thiệp thủ công.

### 👤 Thành viên 2: Lập trình Backend (Xác thực hệ thống & Giỏ hàng)
*   **Nội dung thuyết trình / Câu hỏi bảo vệ**: *"Cơ chế bảo mật đăng nhập và quản lý giỏ hàng được xử lý như thế nào ở phía server?"*
*   **Câu trả lời chuẩn**:
    *   Em phụ trách cấu hình chạy server chính (`app.js`) và thiết lập middleware xác thực Token (`auth.middleware.js`).
    *   Em mã hóa mật khẩu người dùng bằng thư viện `bcryptjs` trước khi lưu vào CSDL và cấp **JSON Web Token (JWT)** khi người dùng đăng nhập thành công.
    *   Em viết các API quản lý giỏ hàng (`giohang.controller.js`) để hỗ trợ thêm món, cập nhật số lượng và tự động kiểm tra xem sản phẩm có bị ngưng bán (`TrangThai = 0`) hay không.

### 👤 Thành viên 3: Lập trình Backend (API Nghiệp vụ & Swagger API Docs)
*   **Nội dung thuyết trình / Câu hỏi bảo vệ**: *"Làm thế nào để quản lý danh sách sản phẩm và liên kết API với Frontend?"*
*   **Câu trả lời chuẩn**:
    *   Em xây dựng các API cốt lõi về Sản phẩm và Danh mục món ăn (`sanpham.controller.js`), cho phép tìm kiếm và lọc sản phẩm.
    *   Em xây dựng các API quản lý Hóa đơn (`hoadon.controller.js`) cho phép khách hàng xem lịch sử đơn hàng của chính họ và API cập nhật trạng thái đơn dành cho Admin.
    *   Em tích hợp công cụ **Swagger UI** (`swagger-jsdoc` & `swagger-ui-express`) để tự động tạo tài liệu API tại đường dẫn `/api-docs` giúp đội phát triển giao diện (Frontend) dễ dàng tích hợp.

### 👤 Thành viên 4: Lập trình Frontend (Giao diện khách hàng & Logic tương tác)
*   **Nội dung thuyết trình / Câu hỏi bảo vệ**: *"Em xây dựng giao diện khách hàng và đồng bộ giỏ hàng phía trình duyệt như thế nào?"*
*   **Câu trả lời chuẩn**:
    *   Em thiết kế giao diện chính cho Khách hàng (`index.html`) và trang yêu thích (`favorites.html`).
    *   Em viết file CSS cốt lõi (`style.css`) hỗ trợ Responsive tương thích với điện thoại và máy tính, áp dụng phong cách thiết kế kính mờ (Glassmorphism) và các hiệu ứng động (pulse, float).
    *   Em viết logic client-side (`app.js`) quản lý giỏ hàng tạm thời trên Local Storage và gọi API để tự động đồng bộ giỏ hàng lên Database ngay sau khi khách hàng đăng nhập.
    *   Em xây dựng hàm helper `apiFetch()` để tự động đính kèm JWT Token vào Header của các API gửi lên Server, tự động bắt lỗi `401/403` để cảnh báo và bắt đăng nhập lại khi token hết hạn.

### 👤 Thành viên 5: Lập trình Frontend (Giao diện Admin & Tích hợp Bản đồ số)
*   **Nội dung thuyết trình / Câu hỏi bảo vệ**: *"Chức năng quản trị và tính năng bản đồ định vị/theo dõi shipper hoạt động ra sao ở Frontend?"*
*   **Câu trả lời chuẩn**:
    *   Em thiết kế giao diện Admin Dashboard (`admin.html`) và viết CSS tương ứng (`admin.css`).
    *   Em lập trình logic quản trị (`admin.js`) cho phép thêm/sửa/xóa sản phẩm, chuyển trạng thái đơn hàng và hiển thị biểu đồ doanh thu thống kê.
    *   Em nhúng bản đồ **Leaflet Map** (`delivery-map.html`) cho phép khách hàng click chọn vị trí nhận hàng và gọi API dịch tọa độ thành địa chỉ chi tiết dạng chữ để gửi về trang thanh toán.
    *   Em lập trình màn hình theo dõi hành trình giao hàng thời gian thực (`track-order.html`), gọi API dẫn đường **OSRM** để lấy danh sách tọa độ tuyến đường thực tế, vẽ đường đi (Polyline) và chạy hoạt ảnh mô phỏng xe shipper di chuyển.
