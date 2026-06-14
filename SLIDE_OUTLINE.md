# CHI TIẾT NỘI DUNG SLIDE BÁO CÁO DỰ ÁN FIVEFOOD (CHÍNH XÁC THEO CODE)

Tài liệu này cung cấp nội dung chi tiết từng slide, sử dụng chính xác tên bảng, cột, hàm, API route, Stored Procedure và Trigger từ mã nguồn của dự án của bạn để bạn đưa vào slide báo cáo.

---

### Slide 1: Trang tiêu đề (Title Slide)
*   **Tiêu đề chính**: DỰ ÁN XÂY DỰNG WEBSITE ĐẶT ĐỒ ĂN TRỰC TUYẾN FIVEFOOD
*   **Mô tả**: Hệ thống đặt món ăn, quản trị giỏ hàng đồng bộ và mô phỏng giao nhận tích hợp Bản đồ số
*   **Thông tin**:
    *   Sinh viên thực hiện: [Tên của bạn]
    *   Giáo viên hướng dẫn: [Tên GVHD]
    *   Công nghệ cốt lõi: Node.js (Express) + SQL Server + Vanilla JS + Leaflet Map

---

### Slide 2: Lý do chọn đề tài (Introduction & Problem Statement)
*   **Thực trạng**: Các hệ thống giao đồ ăn yêu cầu tính thời gian thực cao, dữ liệu nhất quán và định vị địa lý .
*   **Các vấn đề kỹ thuật cần giải quyết**:
    *   *Mất đồng bộ giỏ hàng*: Khách thêm đồ ăn vào giỏ ở điện thoại nhưng khi đăng nhập trên máy tính lại không thấy.
    *   *Thất thoát kho hàng*: Nhiều người cùng đặt một món ăn có số lượng tồn kho giới hạn cùng một lúc gây ra hiện tượng quá bán (Over-selling).
    *   *Khó khăn trong định vị*: Nhập địa chỉ thủ công dễ sai lệch quãng đường, ảnh hưởng tới việc tính phí vận chuyển và mô phỏng lộ trình giao hàng.

---

### Slide 3: Mục tiêu của dự án (Project Goals)
*   **Mục tiêu thiết kế**:
    *   Xây dựng CSDL quan hệ chuẩn hóa cao trên SQL Server để quản lý sản phẩm, đơn hàng, thanh toán và đánh giá.
    *   Thiết kế kiến trúc API RESTful bảo mật bằng mã hóa mật khẩu `bcryptjs` và cơ chế xác thực phân quyền qua **JSON Web Token (JWT)**.
    *   Phát triển giao diện Single Page Application (SPA) phản hồi nhanh, mượt mà và tương thích mọi thiết bị (Responsive).
    *   Tích hợp bản đồ Leaflet để lấy tọa độ thực (`ViDo`, `KinhDo`) và vẽ đường đi giao hàng tự động.

---

### Slide 4: Công nghệ & Thư viện sử dụng (Tech Stack)
*   **Backend (Node.js/Express)**:
    *   `express`: Xây dựng máy chủ API.
    *   `mssql`: Kết nối và thực thi các câu lệnh SQL Server dạng Connection Pool.
    *   `jsonwebtoken`: Tạo và xác thực mã JWT để phân quyền người dùng.
    *   `bcryptjs`: Băm mật khẩu (mã hóa 1 chiều) trước khi lưu vào CSDL.
    *   `swagger-jsdoc` & `swagger-ui-express`: Tự động biên soạn tài liệu API tại `/api-docs`.
*   **Database (MS SQL Server)**:
    *   T-SQL, Stored Procedures (Thủ tục lưu trữ), Triggers (Bộ kích hoạt tự động).
*   **Frontend**: HTML5, CSS3, Javascript thuần (Vanilla JS), thư viện bản đồ **Leaflet** và API bản đồ mở **OpenStreetMap** / **OSRM** (để dẫn đường).

---

### Slide 5: Kiến trúc hệ thống (System Architecture)
*   **Kiến trúc 3 lớp (3-Tier)**:
    *   **Presentation Layer (Giao diện)**: `index.html`, `admin.html`, `js/app.js`, `js/admin.js`, `js/track-order.js`. Gọi API qua hàm helper `apiFetch()`.
    *   **Application Layer (Backend)**: Định tuyến qua `routes/` (ví dụ: `hoadon.routes.js`), xác thực qua middleware `verifyToken` trong `auth.middleware.js`, xử lý logic nghiệp vụ trong `controllers/` (ví dụ: `hoadon.controller.js`).
    *   **Data Layer (CSDL)**: SQL Server kết nối qua `config/db.config.js`. Thực thi lưu trữ và tự động hóa logic qua Stored Procedures và Triggers.

---

### Slide 6: Thiết kế Cơ sở dữ liệu (Database Schema)
Hệ thống gồm 12 bảng chính liên kết chặt chẽ qua các ràng buộc khóa ngoại (Foreign Keys):
1.  `VaiTro` (VaiTroID, TenVaiTro): Phân quyền Admin (1) và Khách hàng (2).
2.  `NguoiDung` (NguoiDungID, VaiTroID, HoTen, TenDangNhap, MatKhauHash, Email, SoDienThoai, DiaChi, NgayTao).
3.  `DanhMuc` (DanhMucID, TenDanhMuc, MoTa, HinhAnh).
4.  `SanPham` (SanPhamID, DanhMucID, TenSanPham, MoTa, Gia, HinhAnh, SoLuongTon, TrangThai).
5.  `GioHang` (GioHangID, NguoiDungID, NgayTao).
6.  `ChiTietGioHang` (ChiTietGioHangID, GioHangID, SanPhamID, SoLuong).
7.  `KhuyenMai` (KhuyenMaiID, MaKhuyenMai, TenKhuyenMai, PhanTramGiam, SoTienGiam, DieuKienToiThieu, SoLuong, NgayBatDau, NgayKetThuc).
8.  `HoaDon` (HoaDonID, NguoiDungID, KhuyenMaiID, NgayDat, TongTien, TrangThai, DiaChiNhan, SoDienThoaiNhan, GhiChu, ViDo, KinhDo).
9.  `ChiTietHoaDon` (ChiTietHoaDonID, HoaDonID, SanPhamID, SoLuong, DonGia, ThanhTien).
10. `ThanhToan` (ThanhToanID, HoaDonID, PhuongThuc, TrangThaiThanhToan, NgayThanhToan).
11. `DanhGia` (DanhGiaID, SanPhamID, NguoiDungID, HoaDonID, SoSao, BinhLuan, NgayTao).
12. `YeuThich` (NguoiDungID, SanPhamID, NgayThem).

---

### Slide 7: Tính năng 1: Đăng nhập & Đồng bộ giỏ hàng
*   **Xác thực JWT**: 
    *   API Đăng ký: `POST /api/register` băm mật khẩu bằng `bcrypt.hashSync()`.
    *   API Đăng nhập: `POST /api/login` kiểm tra mật khẩu bằng `bcrypt.compareSync()`, trả về token chứa `NguoiDungID` và `RoleId`.
*   **Đồng bộ giỏ hàng (Hybrid Cart)**:
    *   Khi khách hàng nhấn thêm món ăn ở trang chủ, Frontend gọi API `POST /api/giohang/them` gửi kèm `NguoiDungID`, `SanPhamID`, và `SoLuong`.
    *   Backend tự động kiểm tra xem sản phẩm có đang bị tạm khóa bán không (`TrangThai == 0`), nếu có sẽ ném lỗi.
    *   Nếu chưa có giỏ hàng trong database, tự động tạo mới bản ghi vào bảng `GioHang`. Sau đó thêm mới hoặc cộng dồn số lượng vào bảng `ChiTietGioHang`.

---

### Slide 8: Tính năng 2: Bản đồ định vị & Đặt hàng an toàn
*   **Bản đồ định vị Leaflet**:
    *   Giao diện `delivery-map.html` khởi tạo bản đồ số Leaflet. Khi người dùng click chọn vị trí, JS thu thập tọa độ Vĩ độ (`lat`) và Kinh độ (`lng`).
    *   Dùng API Nominatim của OpenStreetMap để dịch tọa độ thành địa chỉ chi tiết và gửi ngược về trang đặt hàng (`index.html`) qua `sessionStorage`.
*   **Đặt hàng an toàn qua Stored Procedure `sp_TaoHoaDon`**:
    *   Khi người dùng bấm "Đặt hàng", Frontend gửi yêu cầu `POST /api/hoadon` truyền các tham số: `NguoiDungID`, `MaKhuyenMai`, `DiaChiNhan`, `SoDienThoaiNhan`, `GhiChu`, `PhuongThucThanhToan`, `ViDo`, `KinhDo`.
    *   Backend gọi thực thi procedure `sp_TaoHoaDon` để thực hiện giao dịch (Transaction) đồng thời nhiều tác vụ:
        1. Áp dụng mã khuyến mãi (trừ 1 số lượng voucher trong bảng `KhuyenMai`).
        2. Tạo hóa đơn mới trong bảng `HoaDon`.
        3. Sao chép món ăn từ `ChiTietGioHang` sang `ChiTietHoaDon` kèm đơn giá tại thời điểm mua.
        4. Xóa sạch giỏ hàng của user ở bảng `ChiTietGioHang`.
        5. Tạo bản ghi thanh toán ở trạng thái `'Chưa thanh toán'` trong bảng `ThanhToan`.

---

### Slide 9: Tính năng 3: Theo dõi đơn giao hàng & Đánh giá món ăn
*   **Mô phỏng giao hàng thời gian thực (`track-order.html`)**:
    *   Đọc tọa độ kinh/vĩ độ của cửa hàng (Restaurant) và địa chỉ khách nhận hàng (`ViDo`, `KinhDo` lưu trong `HoaDon`).
    *   Gọi API dẫn đường **OSRM (Open Source Routing Machine)** qua endpoint:
        `http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`
    *   API trả về một danh sách các điểm tọa độ chi tiết trên tuyến đường thực tế.
    *   Frontend vẽ tuyến đường (Polyline) và chạy vòng lặp nội suy vị trí để di chuyển icon "Xe máy" chạy mượt mà dọc tuyến đường.
*   **Đánh giá sản phẩm**:
    *   Sau khi đơn hàng có trạng thái `'Hoàn thành'`, nút "Đánh giá món ăn" xuất hiện.
    *   Khách chọn số sao và gửi nội dung đánh giá qua API `POST /api/danhgia`, chèn bản ghi vào bảng `DanhGia`.

---

### Slide 10: Tính năng 4: Giao diện quản trị Admin (`admin.html`)
*   **Quản lý danh mục & món ăn**:
    *   Cho phép Admin Thêm/Sửa/Xóa các món ăn và danh mục thông qua các API: `POST /api/sanpham`, `PUT /api/sanpham/:id`, `DELETE /api/sanpham/:id`.
    *   Cột `TrangThai` (0: Tạm ngưng bán, 1: Đang bán) trong bảng `SanPham` giúp Admin tạm ngưng kinh doanh một món ăn khi hết nguyên liệu.
*   **Quản lý trạng thái hóa đơn**:
    *   Admin cập nhật trạng thái đơn qua API `PUT /api/hoadon/:id/trangthai`.
    *   Nếu chuyển đơn sang `'Hoàn thành'`: Tự động cập nhật bảng `ThanhToan` thành `TrangThaiThanhToan = N'Đã thanh toán'` và lưu ngày giờ thanh toán (`NgayThanhToan = GETDATE()`).

---

### Slide 11: Điểm nhấn kỹ thuật đặc sắc (Technical Highlights)
Đây là các phần ghi điểm cao trước Hội đồng chấm thi nhờ tính tự động hóa và bảo toàn dữ liệu:
*   **Database Trigger Trừ Tồn Kho (`trg_ChiTietHoaDon_Insert`)**:
    *   Kích hoạt ngay sau khi có món ăn chèn vào `ChiTietHoaDon`.
    *   Tự động chạy câu lệnh trừ kho hàng: `UPDATE SanPham SET SoLuongTon = SoLuongTon - inserted.SoLuong WHERE SanPhamID = inserted.SanPhamID`.
*   **Database Trigger Hoàn Kho & Hoàn Voucher (`trg_HoaDon_UpdateStatus`)**:
    *   Khi Admin hoặc Khách hàng hủy đơn (`TrangThai` cập nhật thành `'Đã hủy'`), trigger tự động kích hoạt để:
        1. Cộng trả lại số lượng đồ ăn vào kho: `SoLuongTon = SoLuongTon + ChiTietHoaDon.SoLuong`.
        2. Cộng trả lại lượt sử dụng mã giảm giá: `SoLuong = SoLuong + 1` trong bảng `KhuyenMai`.
*   **Hàm gọi API `apiFetch` ở Frontend**:
    *   Tự động đính kèm `Authorization: Bearer <JWT_token>` trong header của mọi request.
    *   Tự động bắt lỗi Token hết hạn (mã lỗi `401/403` từ backend) để hiển thị thông báo Toast tiếng Việt và mở popup đăng nhập lại cho người dùng.

---

### Slide 12: Kết quả & Hướng phát triển (Results & Future Work)
*   **Kết quả đạt được**:
    *   Hệ thống hóa đơn đạt tính nhất quán cao nhờ kết hợp Transaction trong Stored Procedure và Trigger tự động.
    *   Giao diện responsive mượt mà, đồng bộ giỏ hàng thời gian thực giúp trải nghiệm người dùng liền mạch.
    *   Tích hợp thành công bản đồ số Leaflet và thuật toán dẫn đường OSRM tạo tính năng theo dõi giao nhận chuyên nghiệp.
*   **Hướng phát triển**:
    *   Chuyển đổi phần giao diện tĩnh từ Vanilla JS sang các framework SPA mạnh mẽ hơn (ReactJS hoặc Next.js) để cải thiện SEO và tái sử dụng component.
    *   Tích hợp các cổng thanh toán ví điện tử thật (như Momo, VNPay) thay vì mô phỏng trạng thái thanh toán.
    *   Xây dựng thêm module WebSockets để truyền vị trí tọa độ GPS thực tế của tài xế (thay vì giả lập tuyến đường).

---

### Slide 13: Lời cảm ơn & Câu hỏi (Q&A)
*   **Nội dung**:
    *   Bày tỏ lòng biết ơn tới Giáo viên hướng dẫn đã tận tình giúp đỡ hoàn thành đồ án.
    *   Xin ý kiến nhận xét và giải trình các câu hỏi từ Hội đồng chấm điểm.
