# HƯỚNG DẪN LUỒNG HOẠT ĐỘNG WEBSITE FIVEFOOD
*(Tài liệu dành cho người mới đọc để hiểu cách vận hành toàn bộ trang web)*

Tài liệu này mô phỏng toàn bộ **Hành trình của người dùng** từ lúc bắt đầu truy cập website cho đến lúc nhận được đồ ăn và cách tầng Backend âm thầm xử lý phía sau. Đọc xong tài liệu này, bất kỳ ai (dù không trực tiếp code) cũng sẽ hiểu website hoạt động thế nào.

---

## 1. MÔ HÌNH VẬN HÀNH TỔNG QUAN (CLIENT - SERVER)

Trang web hoạt động theo cơ chế trao đổi:
*   **Frontend (Giao diện):** Đóng vai trò hiển thị nút bấm, hình ảnh, bản đồ và thu thập thông tin người dùng gõ vào.
*   **Backend (Node.js + Database):** Là bộ não xử lý tất cả tính toán, kiểm tra quyền hạn, quản lý kho hàng và tiền bạc, sau đó trả kết quả về dưới dạng chuỗi dữ liệu (JSON).

---

## 2. HÀNH TRÌNH TỪ A ĐẾN Z CỦA MỘT KHÁCH HÀNG (USER LIFECYCLE)

Dưới đây là kịch bản chạy thực tế của trang web khi có một khách hàng vào mua đồ ăn:

### Bước 1: Khách vào trang chủ xem thực đơn
*   **Giao diện hiển thị:** Các danh mục đồ ăn (Đồ uống, Gà rán, Pizza...) và danh sách các món ăn đẹp mắt.
*   **Backend xử lý phía sau:**
    *   Frontend gọi API `GET /api/sanpham` và `GET /api/danhmuc`.
    *   Backend nhận lệnh, vào Database lấy danh sách món ăn đang ở trạng thái bán (`TrangThai = 1`), lấy ra số lượng tồn kho (`SoLuongTon`) và gửi ngược lại cho Frontend vẽ lên màn hình.

### Bước 2: Khách Đăng ký & Đăng nhập tài khoản
*   **Giao diện hiển thị:** Ô nhập Tài khoản, Mật khẩu, Email, SĐT, Địa chỉ.
*   **Backend xử lý phía sau:**
    *   **Khi Đăng ký:** Frontend gửi thông tin đăng ký lên. Backend dùng thư viện `bcryptjs` để băm mật khẩu thành một chuỗi mã hóa không thể đọc ngược (ví dụ: `123456` thành `$2b$10$Sdms...`). Sau đó lưu vào bảng `NguoiDung`.
    *   **Khi Đăng nhập:** Backend so sánh mật khẩu khách vừa nhập với mật khẩu băm dưới database. Nếu đúng, Backend cấp cho trình duyệt một chiếc **"Vé thông hành"** gọi là **JWT Token**. Chiếc vé này chứa ID của người dùng và vai trò của họ (Khách hàng hoặc Admin). Trình duyệt sẽ lưu chiếc vé này để dùng cho tất cả các bước tiếp theo.

### Bước 3: Thêm món ăn vào giỏ hàng
*   **Giao diện hiển thị:** Số lượng sản phẩm trong giỏ hàng tăng lên.
*   **Backend xử lý phía sau:**
    *   Nếu khách chưa đăng nhập: Giỏ hàng chỉ lưu tạm trên máy khách (Local Storage).
    *   Khi khách đã đăng nhập: Frontend gửi API `POST /api/giohang/them`. Backend sẽ kiểm tra xem món ăn này có bị ngưng bán không và số lượng tồn kho còn đủ không. Nếu đủ, Backend ghi trực tiếp món ăn này vào bảng `ChiTietGioHang` dưới database. Việc này giúp giỏ hàng không bị mất khi khách tắt máy hoặc đổi sang điện thoại khác.

### Bước 4: Chọn địa chỉ trên Bản đồ số & Đặt hàng
*   **Giao diện hiển thị:** Bản đồ Leaflet hiện ra, khách click chọn vị trí của mình $\rightarrow$ Bản đồ tự động điền địa chỉ chữ và tính tiền ship $\rightarrow$ Khách bấm "Đặt hàng".
*   **Backend xử lý phía sau:**
    *   Frontend gọi API chỉ đường để vẽ quãng đường đi.
    *   Khi khách bấm "Đặt hàng", Backend chạy một thủ tục an toàn cao tên là `sp_TaoHoaDon` bọc trong **SQL Transaction** để xử lý đồng thời:
        1. Áp dụng mã giảm giá (giảm số lượng voucher khả dụng).
        2. Tạo hóa đơn mới (bảng `HoaDon`) kèm tọa độ Vĩ độ/Kinh độ để shipper giao.
        3. Chuyển toàn bộ món từ `ChiTietGioHang` sang `ChiTietHoaDon`.
        4. Tự động chạy **Trigger ngầm** trừ hàng trong kho (`SanPham`).
        5. Xóa sạch giỏ hàng hiện tại.
        6. Tạo hóa đơn thanh toán ở trạng thái "Chưa thanh toán".
    *   *Lợi ích:* Nếu một trong các bước trên bị lỗi, hệ thống hủy bỏ toàn bộ quá trình, không tạo hóa đơn ảo.

### Bước 5: Theo dõi Shipper giao hàng thời gian thực
*   **Giao diện hiển thị:** Màn hình hiển thị bản đồ, có biểu tượng xe máy di chuyển mượt mà từ Nhà hàng đến nhà khách hàng để mô phỏng shipper đang đi.
*   **Backend xử lý phía sau:**
    *   Frontend đọc tọa độ nhà hàng và tọa độ khách hàng từ hóa đơn vừa đặt.
    *   Nó gửi tọa độ này lên API dẫn đường mở **OSRM**. API này trả về danh sách các điểm tọa độ chi tiết trên con đường thực tế.
    *   Frontend vẽ đường nối và chạy hoạt ảnh dịch chuyển icon xe máy dọc theo tuyến đường đó.

### Bước 6: Khách hàng đánh giá món ăn
*   **Giao diện hiển thị:** Form chọn số sao (1-5 sao) và viết bình luận sau khi nhận hàng.
*   **Backend xử lý phía sau:**
    *   Frontend gửi yêu cầu qua API `POST /api/danhgia`. Backend lưu thông tin này vào bảng `DanhGia` để tính toán lại số sao trung bình của món ăn hiển thị trên trang chủ.

---

## 3. HÀNH TRÌNH DÀNH CHO ADMIN (QUẢN TRỊ VIÊN)

### Quản lý món ăn
*   Admin có thể Thêm mới món ăn, Sửa giá, thay đổi hình ảnh, hoặc **Tạm dừng bán** (chuyển `TrangThai = 0` khi nhà hàng hết nguyên liệu làm món đó). Backend cung cấp các API `POST`, `PUT`, `DELETE` tại `/api/sanpham` và chỉ cho phép tài khoản có vai trò Admin (`RoleId = 1`) thực hiện.

### Duyệt đơn hàng
*   Admin nhìn thấy toàn bộ đơn hàng của cửa hàng. Admin bấm "Xác nhận đơn" $\rightarrow$ "Đang giao" $\rightarrow$ "Hoàn thành".
*   Khi Admin đổi trạng thái đơn thành **"Hoàn thành"**, Backend sẽ tự động chạy lệnh cập nhật bảng `ThanhToan` liên kết sang trạng thái `'Đã thanh toán'` và lưu thời gian thanh toán.
*   Nếu Admin hoặc Khách hàng bấm **"Hủy đơn"** (khi đơn chưa giao), hệ thống tự kích hoạt **Trigger `trg_HoaDon_UpdateStatus`** trả lại đồ ăn vào kho và hoàn trả lượt dùng mã giảm giá cho khách hoàn toàn tự động.
