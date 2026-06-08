# GIẢI THÍCH CHI TIẾT VỀ FRONTEND DỰ ÁN FOODEXPRESS

Tài liệu này giải thích chi tiết cấu trúc, cách thức hoạt động, giao diện người dùng và logic lập trình của **Frontend** trong dự án **FoodExpress**.

---

## 1. TỔNG QUAN VỀ CẤU TRÚC FRONTEND 

Toàn bộ mã nguồn Frontend được lưu giữ trong thư mục **`public/`** của dự án. Đây là mô hình SPA (Single Page Application - Ứng dụng trang đơn) đơn giản sử dụng **HTML5, CSS3 và Javascript thuần (Vanilla JS)** mà không qua các framework nặng nề (như React hay Angular), giúp trang web tải cực nhanh và dễ bảo trì.

Các file chính bao gồm:
*   **Trang HTML**:
    *   `index.html`: Giao diện chính của khách hàng (Xem sản phẩm, Giỏ hàng, Đặt hàng, Xem lịch sử đơn hàng, Đánh giá sản phẩm).
    *   `admin.html`: Giao diện quản lý dành cho Admin.
    *   `delivery-map.html`: Giao diện bản đồ chọn địa chỉ nhận hàng.
    *   `track-order.html`: Giao diện bản đồ theo dõi hành trình giao hàng thời gian thực.
    *   `favorites.html`: Giao diện hiển thị danh sách sản phẩm yêu thích của người dùng.
*   **Javascript (`public/js/`)**:
    *   `js/app.js`: Xử lý toàn bộ logic nghiệp vụ phía khách hàng.
    *   `js/admin.js`: Xử lý logic nghiệp vụ phía Admin.
    *   `js/delivery-map.js`: Logic bản đồ chọn địa chỉ giao nhận.
    *   `js/track-order.js`: Logic mô phỏng đường đi của tài xế giao hàng.
*   **CSS (`public/css/`)**:
    *   `css/style.css`: File chứa toàn bộ hệ thống CSS thiết kế giao diện, phối màu, tạo hiệu ứng mượt mà và hỗ trợ hiển thị tốt trên cả máy tính lẫn điện thoại (Responsive Design).

---

## 2. CƠ CHẾ HOẠT ĐỘNG CỦA FRONTEND KHÁCH HÀNG (`js/app.js`)

File `app.js` là bộ não điều khiển toàn bộ hành vi trên trang chủ khách hàng. Nó hoạt động dựa trên các nguyên lý sau:

### 1. Quản lý trạng thái ứng dụng (State Management)
Các biến toàn cục dùng để lưu trữ dữ liệu hiện thời trên trình duyệt:
*   `currentUser`: Đối tượng chứa thông tin người dùng đang đăng nhập (lấy từ `localStorage.getItem('fe_user')`).
*   `currentToken`: Chuỗi JWT Token dùng để xác thực API (lấy từ `localStorage.getItem('fe_token')`).
*   `cart`: Mảng chứa các món ăn trong giỏ hàng hiện tại (mỗi món gồm id, name, price, image, qty).
*   `appliedCoupon`: Thông tin mã giảm giá đang được áp dụng.

### 2. Tự động đồng bộ giỏ hàng (Cart Synchronization)
Frontend áp dụng cơ chế đồng bộ thông minh:
*   Khi khách hàng chưa đăng nhập: Giỏ hàng chỉ lưu tạm thời trong `localStorage` (`fe_cart`).
*   Ngay khi khách hàng đăng nhập thành công:
    1.  Hệ thống gọi hàm `syncCartFromDB()` để lấy dữ liệu giỏ hàng đã lưu trong database của tài khoản đó về.
    2.  Kết hợp giỏ hàng local hiện tại và giỏ hàng trên DB.
    3.  Lưu lại trạng thái mới nhất lên database thông qua API `/api/giohang/them`.
*   Khi thanh toán đặt hàng thành công: Giỏ hàng trên `localStorage` và DB của user đều được tự động xóa sạch.

### 3. Hàm gọi API an toàn (`apiFetch`)
Đây là một hàm bao bọc (Wrapper) tiện ích được sử dụng xuyên suốt dự án để giao tiếp với Backend:
*   **Tự động đính kèm Token**: Tự động chèn header `Authorization: Bearer <currentToken>` cho mọi request để vượt qua bộ lọc bảo mật của Backend.
*   **Tự động định dạng**: Tự động chuyển đổi body sang chuỗi JSON và thêm header `Content-Type: application/json`.
*   **Xử lý lỗi bảo mật tự động**: Nếu nhận được mã phản hồi `401` hoặc `403` từ Backend (do token hết hạn hoặc giả mạo), hàm này sẽ hiển thị thông báo Toast cảnh báo, xóa sạch token lưu lỗi, đóng các modal và tự động bật popup yêu cầu người dùng đăng nhập lại.

---

## 3. CÁC TÍNH NĂNG NỔI BẬT KHÁC CỦA FRONTEND

### 1. Tích Hợp Bản Đồ Chọn Vị Trí (`delivery-map.html`)
*   Sử dụng thư viện bản đồ mã nguồn mở **Leaflet** kết hợp dữ liệu bản đồ **OpenStreetMap**.
*   Khi người dùng click chọn "Chọn từ bản đồ" ở form thanh toán, một cửa sổ popup/iframe bản đồ mở ra.
*   Người dùng có thể gõ tìm địa chỉ hoặc click trực tiếp lên bản đồ. Hệ thống sẽ:
    1.  Dùng tọa độ (Kinh độ/Vĩ độ) để gọi API Nominatim (Reverse Geocoding) dịch tọa độ thành địa chỉ chữ tiếng Việt cụ thể (ví dụ: "Số 5, Xuân Thủy, Cầu Giấy, Hà Nội").
    2.  Lưu Tọa độ và Địa chỉ vào `sessionStorage` để form thanh toán tự động cập nhật mà người dùng không cần gõ tay.

### 2. Mô phỏng Hành trình Giao Hàng Live (`track-order.html`)
*   Giúp khách hàng xem tài xế đang đi tới đâu sau khi đơn hàng được chuyển sang trạng thái `'Đang giao'`.
*   **Nguyên lý mô phỏng**:
    1.  Đọc tọa độ của cửa hàng (Restaurant) và tọa độ địa chỉ nhận hàng của Khách hàng (`ViDo`, `KinhDo` đã lưu trong hóa đơn).
    2.  Gửi yêu cầu tới API dẫn đường **OSRM (Open Source Routing Machine)** để lấy danh sách toàn bộ các điểm tọa độ nằm trên tuyến đường tối ưu nhất nối giữa hai điểm.
    3.  Sử dụng Javascript để nội suy khoảng cách và góc quay, tạo hoạt ảnh chuyển động mượt mà cho icon "Xe máy" chạy dọc theo tuyến đường từ cửa hàng tới nhà khách hàng.
    4.  Hiển thị thời gian ước tính (ETA) và khoảng cách thực tế còn lại.

### 3. Đánh giá Món Ăn trực quan
*   Sau khi đơn hàng hoàn thành, giao diện lịch sử đơn hàng sẽ hiện nút "Đánh giá".
*   Khi click, Frontend mở modal đánh giá hiển thị danh sách các món ăn đã mua trong đơn hàng đó.
*   Người dùng click chọn số sao bằng hiệu ứng hover chuột sinh động và viết nội dung đánh giá trước khi gửi về API `/api/danhgia`.
*   Hệ thống có cơ chế kiểm tra API xem đơn hàng này đã được đánh giá sản phẩm nào chưa để ẩn nút đánh giá tương ứng, tránh việc spam review.
