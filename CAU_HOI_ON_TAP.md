# BỘ CÂU HỎI & CÂU TRẢ LỜI ÔN TẬP BẢO VỆ ĐỒ ÁN FIVEFOOD

Bộ tài liệu này chứa các câu hỏi phản biện phổ biến nhất từ Hội đồng chấm thi môn Lập trình Backend (hệ Đại học), kèm câu trả lời chi tiết chuẩn xác theo mã nguồn dự án **FIVEFOOD**.

---

## PHẦN I: DÀNH CHO TRƯỞNG NHÓM (DATABASE & TRANSACTION LOGIC)

### ❓ Câu 1: Tại sao em lại bọc logic đặt hàng trong Stored Procedure `sp_TaoHoaDon` kết hợp `TRANSACTION` mà không viết hoàn toàn bằng Node.js?
*   **Câu trả lời:**
    *   **Tính toàn vẹn dữ liệu (Data Integrity):** Nghiệp vụ đặt hàng liên quan đến nhiều bảng khác nhau (`KhuyenMai`, `HoaDon`, `ChiTietHoaDon`, `ChiTietGioHang`, `ThanhToan`). Nếu viết riêng lẻ bằng Node.js, khi server bị mất kết nối giữa chừng hoặc gặp sự cố phần cứng, hệ thống có thể rơi vào trạng thái lỗi: tạo được hóa đơn nhưng chưa trừ kho, hoặc trừ kho nhưng chưa áp dụng được voucher.
    *   **Cơ chế Transaction:** Sử dụng `BEGIN TRANSACTION` và `COMMIT/ROLLBACK` giúp đảm bảo nguyên lý **ACID** (Tính nguyên tố - Atomicity). Tất cả các bước phải thành công $100\%$, nếu có bất kỳ lỗi nào ở bất kỳ bước nào, hệ thống sẽ thực hiện `ROLLBACK TRANSACTION` để khôi phục dữ liệu về trạng thái ban đầu như chưa có gì xảy ra.
    *   **Hiệu năng:** Giảm thiểu số lượng request truyền tải qua lại trên mạng (Network Round-trips) giữa Server ứng dụng và CSDL.

### ❓ Câu 2: Trigger `trg_HoaDon_UpdateStatus` hoạt động như thế nào và giải quyết bài toán nghiệp vụ gì?
*   **Câu trả lời:**
    *   **Bài toán nghiệp vụ:** Giải quyết bài toán hủy đơn hàng của khách hàng hoặc admin. Khi đơn hàng bị hủy (`TrangThai = N'Đã hủy'`), lượng hàng hóa đã đặt phải được trả lại kho và lượt dùng của mã giảm giá phải được hoàn lại cho khách hàng.
    *   **Hoạt động:** Trigger này chạy tự động **sau khi** cột `TrangThai` trong bảng `HoaDon` bị thay đổi (`AFTER UPDATE`).
        *   Nó so sánh bảng trạng thái mới (`inserted`) với trạng thái cũ (`deleted`). Nếu trạng thái chuyển đổi từ một giá trị khác sang `'Đã hủy'`.
        *   Nó thực hiện câu lệnh `UPDATE` cộng trả lại số lượng món ăn vào cột `SoLuongTon` của bảng `SanPham` bằng cách nối (JOIN) bảng `ChiTietHoaDon` với bảng `inserted`.
        *   Nó cộng trả lại 1 lượt sử dụng (`SoLuong = SoLuong + 1`) trong bảng `KhuyenMai` nếu đơn hàng bị hủy có áp dụng khuyến mãi (`KhuyenMaiID IS NOT NULL`).

### ❓ Câu 3: Làm sao em ngăn chặn được SQL Injection trong hệ thống khi người dùng đăng nhập hoặc nhập mã khuyến mãi?
*   **Câu trả lời:**
    *   Hệ thống hoàn toàn miễn dịch với lỗi SQL Injection nhờ việc sử dụng **Parameterized Queries** (Truy vấn tham số hóa) thông qua thư viện `mssql` của Node.js.
    *   Ví dụ khi gọi procedure `sp_KiemTraDangNhap` hay `sp_TaoHoaDon`, thay vì cộng chuỗi SQL trực tiếp dạng `'SELECT... WHERE Username = ' + input`, em sử dụng cơ chế bind biến:
        ```javascript
        request.input('TenDangNhap', sql.VarChar(50), TenDangNhap);
        request.execute('sp_KiemTraDangNhap');
        ```
    *   Điều này bắt buộc SQL Server phải biên dịch câu lệnh SQL trước rồi mới truyền tham số đầu vào vào sau dưới dạng dữ liệu thuần túy, loại bỏ hoàn toàn khả năng chèn mã độc hại.

---

## PHẦN II: DÀNH CHO THÀNH VIÊN 2 & 3 (BACKEND DEVELOPMENT - AUTH, CART & PRODUCTS)

### ❓ Câu 4: Cơ chế bảo mật mật khẩu người dùng và xác thực hệ thống hoạt động ra sao?
*   **Câu trả lời:**
    *   **Bảo mật mật khẩu:** Hệ thống không lưu mật khẩu dưới dạng văn bản thuần (plain text). Khi đăng ký, mật khẩu của người dùng được băm (hash) 1 chiều bằng thuật toán **bcryptjs** (độ phức tạp/salt round mặc định là $10$) trước khi lưu vào cột `MatKhauHash` trong bảng `NguoiDung`.
    *   **Xác thực JWT:** Khi đăng nhập thành công, Backend sinh ra một chuỗi **JSON Web Token (JWT)** chứa thông tin định danh không nhạy cảm (`NguoiDungID`, `VaiTroID`) được ký bằng một khóa bí mật (`JWT_SECRET`) lưu trong file `.env`. Token này có thời hạn sử dụng là 24 giờ.
    *   **Phân quyền (RBAC):** Middleware `verifyToken` sẽ giải mã JWT ở mỗi request tiếp theo để xác thực danh tính. Nếu API yêu cầu quyền Admin, middleware `isAdmin` tiếp tục kiểm tra thuộc tính `RoleId` trong token có bằng $1$ (Admin) hay không, nếu không sẽ chặn quyền truy cập (mã lỗi `403 Forbidden`).

### ❓ Câu 5: Hệ thống kiểm soát tồn kho như thế nào khi khách hàng thêm món vào giỏ hàng?
*   **Câu trả lời:**
    *   Khi nhận request thêm món (`POST /api/giohang/them`), Backend thực hiện kiểm tra tồn kho tại `controllers/giohang.controller.js`:
        *   Đầu tiên kiểm tra trạng thái món ăn có đang bị khóa bán (`TrangThai = 0`) hay không.
        *   Nếu món ăn đã có trong giỏ hàng của user, Backend cộng dồn số lượng hiện có trong database với số lượng muốn thêm mới.
        *   Backend so sánh tổng số lượng này với cột `SoLuongTon` trong bảng `SanPham`. Nếu vượt quá tồn kho khả dụng, Backend trả về mã lỗi `400 Bad Request` kèm thông báo tiếng Việt báo cho khách hàng biết số lượng tối đa có thể mua.

### ❓ Câu 6: Làm thế nào để Frontend biết các API của Backend hỗ trợ những tham số gì và cấu trúc JSON trả về ra sao?
*   **Câu trả lời:**
    *   Em đã tích hợp công cụ **Swagger UI** (sử dụng thư viện `swagger-jsdoc` và `swagger-ui-express`).
    *   Mỗi API endpoint trong mã nguồn Backend đều được viết tài liệu đặc tả dưới dạng chú thích (JSDoc annotations) chuẩn OpenAPI.
    *   Swagger tự động biên dịch các chú thích này thành một giao diện web trực quan tại đường dẫn `/api-docs` giúp đội phát triển Frontend dễ dàng tra cứu, kiểm tra các tham số đầu vào và chạy thử (Test) trực tiếp API mà không cần dùng đến các phần mềm bên ngoài như Postman.

---

## PHẦN III: DÀNH CHO THÀNH VIÊN 4 & 5 (FRONTEND DEVELOPMENT - UI, CSS & MAPS)

### ❓ Câu 7: Cơ chế đồng bộ giỏ hàng (Hybrid Cart) giữa Local Storage và Database được xử lý như thế nào?
*   **Câu trả lời:**
    *   **Khi chưa đăng nhập:** Khách hàng vẫn có thể duyệt món ăn và thêm vào giỏ. Lúc này, giỏ hàng được lưu trữ tạm thời trong **Local Storage** của trình duyệt để tăng tốc độ phản hồi và giảm tải cho Server.
    *   **Khi đăng nhập thành công:** Logic trong file `public/js/app.js` sẽ kiểm tra nếu trong Local Storage có sản phẩm, nó sẽ tự động gửi tuần tự các request gọi API `POST /api/giohang/them` lên Server để đẩy toàn bộ sản phẩm đó lưu vào bảng `ChiTietGioHang` dưới Database. Sau đó làm trống Local Storage.
    *   Từ thời điểm này, mọi thao tác cập nhật giỏ hàng sẽ được đồng bộ trực tiếp với Database, giúp dữ liệu giỏ hàng được lưu vĩnh viễn dù khách hàng có đăng nhập trên thiết bị khác.

### ❓ Câu 8: Tính năng theo dõi shipper thời gian thực hoạt động như thế nào trên Bản đồ Leaflet?
*   **Câu trả lời:**
    *   Trang `track-order.html` lấy thông tin tọa độ vĩ độ/kinh độ của Nhà hàng và địa chỉ nhận hàng (`ViDo`, `KinhDo`) của hóa đơn lưu trong CSDL.
    *   Frontend gọi API chỉ đường **OSRM (Open Source Routing Machine)**. API này trả về một danh sách (mảng) gồm rất nhiều điểm tọa độ chi tiết tạo nên tuyến đường giao thông thực tế nối giữa 2 điểm.
    *   Em sử dụng thư viện **Leaflet** để vẽ một đường nối (`Polyline`) dựa trên các điểm tọa độ này.
    *   Để tạo hiệu ứng di chuyển mượt mà, em lập trình một vòng lặp sử dụng hàm `setTimeout` hoặc `requestAnimationFrame` để nội suy và cập nhật tọa độ của biểu tượng (icon) chiếc xe máy dọc theo mảng điểm đó, tạo cảm giác shipper đang giao hàng trực quan trên màn hình.

### ❓ Câu 9: Hàm `apiFetch()` được xây dựng để giải quyết vấn đề gì khi Frontend giao tiếp với Backend?
*   **Câu trả lời:**
    *   Hàm `apiFetch()` là một hàm helper bọc ngoài hàm `fetch()` mặc định của trình duyệt để chuẩn hóa toàn bộ các cuộc gọi API:
        *   **Tự động đính kèm Token:** Kiểm tra xem có JWT token trong bộ nhớ trình duyệt hay không, nếu có sẽ tự động chèn vào header `Authorization: Bearer <token>` của mọi request.
        *   **Xử lý lỗi Token hết hạn:** Nếu Backend trả về mã lỗi `401` (Unauthorized) hoặc `403` (Forbidden), hàm `apiFetch` tự động phát hiện, hiển thị thông báo Toast cảnh báo phiên đăng nhập hết hạn và kích hoạt mở popup Đăng nhập lại cho khách hàng mà không làm gián đoạn trải nghiệm mua sắm.
