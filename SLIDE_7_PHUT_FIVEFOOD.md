# NỘI DUNG & KỊCH BẢN SLIDE BÁO CÁO 7 PHÚT - FIVEFOOD
*(Tài liệu rút gọn tối ưu cho slide và thuyết trình nhanh trong 7 phút bảo vệ)*

Để thuyết trình trong 7 phút, slide chỉ nên có **7 - 8 trang**. File này gộp phần nội dung text slide (ngắn gọn) và kịch bản thuyết trình từng slide để bạn tập nói trước.

---

### 🖥️ SLIDE 1: GIỚI THIỆU ĐỀ TÀI
*   **Nội dung Slide:**
    *   **Tên đề tài:** Xây dựng hệ thống đặt món ăn trực tuyến FIVEFOOD tích hợp bản đồ số và đồng bộ giỏ hàng thời gian thực.
    *   **Công nghệ:** Node.js (Express) + MS SQL Server + Vanilla JS + Leaflet Map.
    *   **Thành viên:** [Tên của bạn] (Trưởng nhóm - phụ trách Database/Backend) & Nhóm FiveFood.
*   **Lời thoại thuyết trình (Nói trong 30 giây):**
    > *"Kính thưa Hội đồng, nhóm em xin trình bày đề tài FIVEFOOD. Đây là hệ thống website đặt món ăn trực tuyến tối ưu hóa trải nghiệm người dùng bằng bản đồ số để theo dõi giao hàng và đảm bảo tính nhất quán dữ liệu bằng giao dịch Transaction và Trigger dưới cơ sở dữ liệu."*

---

### 🖥️ SLIDE 2: LÝ DO CHỌN ĐỀ TÀI (VẤN ĐỀ THỰC TẾ)
*   **Nội dung Slide:**
    *   ❌ **Vấn đề 1 - Mất đồng bộ giỏ hàng:** Khách thêm đồ ăn vào giỏ trên điện thoại, nhưng đổi sang máy tính lại mất hết (lưu tạm ở Local Storage).
    *   ❌ **Vấn đề 2 - Quá bán (Over-selling):** Nhiều khách đặt cùng 1 món đang hết hàng cùng lúc, gây sai lệch tồn kho nếu không có cơ chế kiểm soát.
    *   ❌ **Vấn đề 3 - Khó xác định vị trí giao hàng:** Nhập địa chỉ thủ công dễ sai, không thể mô phỏng lộ trình giao hàng thực tế.
    *   ✅ **Giải pháp:** Xây dựng hệ thống FIVEFOOD kết hợp Hybrid Cart + SQL Transaction/Trigger + Leaflet/OSRM Map.
*   **Lời thoại thuyết trình (Nói trong 40 giây):**
    > *"Nhóm em chọn đề tài này vì thực tế các hệ thống đặt đồ ăn thường gặp 3 vấn đề lớn: mất đồng bộ giỏ hàng khi đổi thiết bị, nguy cơ quá bán khi nhiều người đặt cùng lúc, và khó khăn trong việc định vị địa chỉ giao hàng chính xác. Hệ thống FIVEFOOD được xây dựng để giải quyết cả 3 vấn đề này."*

---

### 🖥️ SLIDE 3: KIẾN TRÚC HỆ THỐNG (3-TIER ARCHITECTURE)
*   **Nội dung Slide:**
    *   **Presentation (Giao diện):** Vanilla JS, CSS3, Bản đồ số Leaflet & OSRM API.
    *   **Application (Backend API):** Node.js + Express.js, bảo mật qua JWT Token và mã hóa mật khẩu `bcryptjs`.
    *   **Data (Cơ sở dữ liệu):** MS SQL Server gồm 12 bảng liên kết chặt chẽ.
*   **Lời thoại thuyết trình (Nói trong 45 giây):**
    > *"Hệ thống của chúng em được thiết kế theo kiến trúc 3 lớp rõ ràng. Tầng giao diện gọi API bất đồng bộ thông qua JWT Token xác thực. Tầng ứng dụng Node.js tiếp nhận, kiểm tra điều kiện nghiệp vụ và giao tiếp với tầng CSDL SQL Server bằng Connection Pool để đảm bảo tốc độ phản hồi nhanh nhất."*

---

### 🖥️ SLIDE 3: THIẾT KẾ CƠ SỞ DỮ LIỆU & PHÂN QUYỀN (JWT)
*   **Nội dung Slide:**
    *   Sơ đồ liên kết 12 bảng (nhấn mạnh bảng `SanPham`, `GioHang`, `HoaDon`, `KhuyenMai`).
    *   **Phân quyền (Auth):** Xác thực người dùng qua JWT Token. 
        *   `RoleId = 1`: Admin (Quản trị sản phẩm, duyệt hóa đơn).
        *   `RoleId = 2`: Khách hàng (Đặt món, áp mã giảm giá).
*   **Lời thoại thuyết trình (Nói trong 45 giây):**
    > *"CSDL của hệ thống gồm 12 bảng. Để bảo mật và phân quyền, chúng em sử dụng cơ chế JWT. Khi khách hàng đăng nhập thành công, Backend cấp 1 mã Token. Mã này sẽ được đính kèm vào Header ở mọi Request tiếp theo để xác thực quyền hạn mà không cần truy vấn mật khẩu liên tục."*

---

### 🖥️ SLIDE 4: TÍNH NĂNG 1 - ĐỒNG BỘ GIỎ HÀNG THÔNG MINH
*   **Nội dung Slide:**
    *   **Hybrid Cart:**
        *   Chưa đăng nhập $\rightarrow$ Lưu giỏ hàng tạm thời ở trình duyệt (`Local Storage`).
        *   Đăng nhập thành công $\rightarrow$ Gửi API `POST /api/giohang/them` đẩy toàn bộ món ăn đồng bộ xuống bảng `ChiTietGioHang` dưới Database.
*   **Lời thoại thuyết trình (Nói trong 45 giây):**
    > *"Một điểm yếu của các web cũ là mất giỏ hàng khi đổi thiết bị. Hệ thống của chúng em giải quyết bằng cơ chế Hybrid Cart. Khi đăng nhập, toàn bộ giỏ tạm từ Local Storage sẽ được tự động đồng bộ xuống Database giúp khách hàng tiếp tục mua sắm liền mạch ở bất kỳ thiết bị nào."*

---

### 🖥️ SLIDE 5: TÍNH NĂNG 2 - GIAO DỊCH ĐẶT HÀNG AN TOÀN (TRANSACTION)
*   **Nội dung Slide:**
    *   **Procedure `sp_TaoHoaDon`:** Bọc toàn bộ các tác vụ sau trong một **SQL Transaction**:
        1. Kiểm tra & trừ lượt dùng mã giảm giá (`KhuyenMai`).
        2. Tạo hóa đơn mới (`HoaDon`).
        3. Sao chép món từ `ChiTietGioHang` sang `ChiTietHoaDon`.
        4. Làm trống giỏ hàng (`DELETE`).
        5. Tạo bản ghi trạng thái thanh toán (`ThanhToan`).
*   **Lời thoại thuyết trình (Nói trong 60 giây):**
    > *"Để đặt hàng, chúng em xây dựng Stored Procedure `sp_TaoHoaDon` bọc trong một SQL Transaction. Toàn bộ chuỗi thao tác từ áp mã giảm giá, tạo hóa đơn, chuyển giỏ hàng và xóa giỏ phải thành công 100%. Nếu có bất kỳ lỗi nào xảy ra ở bất kỳ bước nào, hệ thống sẽ ROLLBACK hoàn toàn để tránh tình trạng tạo hóa đơn ảo nhưng không trừ được giỏ hàng."*

---

### 🖥️ SLIDE 6: ĐIỂM NHẤN ĐẶC SẮC - DATABASE TRIGGERS
*   **Nội dung Slide:**
    *   **Trigger `trg_ChiTietHoaDon_Insert`:** Tự động trừ cột `SoLuongTon` của bảng `SanPham` khi có món ăn được thêm vào đơn hàng.
    *   **Trigger `trg_HoaDon_UpdateStatus`:** Khi hóa đơn chuyển sang trạng thái `'Đã hủy'`:
        *   Tự động cộng trả lại sản phẩm vào kho (`SoLuongTon = SoLuongTon + SoLuong`).
        *   Cộng trả lại 1 lượt sử dụng cho mã giảm giá khách đã dùng (`KhuyenMai`).
*   **Lời thoại thuyết trình (Nói trong 60 giây):**
    > *"Điểm nhấn kỹ thuật lớn nhất của dự án là việc tự động hóa thông qua Trigger ngầm dưới CSDL. Khi đơn hàng được tạo, Trigger tự động trừ tồn kho. Và đặc biệt, khi khách hàng hoặc Admin bấm HỦY ĐƠN, một Trigger khác sẽ tự động hoàn kho sản phẩm và trả lại lượt sử dụng mã giảm giá cho khách, giúp dữ liệu luôn chính xác tuyệt đối mà không cần code Backend xử lý phức tạp."*

---

### 🖥️ SLIDE 7: TÍNH NĂNG 3 - BẢN ĐỒ SỐ & THEO DÕI SHIPPER THỜI GIAN THỰC
*   **Nội dung Slide:**
    *   **Leaflet Map & Nominatim API:** Tự động lấy tọa độ và dịch thành địa chỉ chữ khi click chọn vị trí giao hàng.
    *   **OSRM Routing API:** Lấy tọa độ nhà hàng và nhà khách để vẽ tuyến đường di chuyển thực tế.
    *   Mô phỏng icon Shipper chạy dọc theo lộ trình trên bản đồ.
*   **Lời thoại thuyết trình (Nói trong 60 giây):**
    > *"Hệ thống tích hợp bản đồ số Leaflet. Khi đặt hàng, khách chỉ cần click trên bản đồ, hệ thống sẽ tự động dịch tọa độ thành địa chỉ chi tiết. Đồng thời, trang theo dõi đơn hàng sử dụng API OSRM để lấy tuyến đường giao thông thực tế và chạy hoạt ảnh mô phỏng xe shipper di chuyển trực quan, nâng cao trải nghiệm người dùng."*

---

### 🖥️ SLIDE 8: KẾT LUẬN & HƯỚNG PHÁT TRIỂN
*   **Nội dung Slide:**
    *   **Kết quả:** Hệ thống chạy ổn định, giao diện mượt mà, CSDL đạt tính toàn vẹn dữ liệu cao nhờ Transaction/Trigger.
    *   **Hướng phát triển:**
        *   Chuyển đổi Frontend sang ReactJS/Next.js.
        *   Tích hợp thanh toán trực tuyến thật qua Momo, VNPay.
        *   Tương tác vị trí thực tế của shipper bằng Socket.io.
*   **Lời thoại thuyết trình (Nói trong 30 giây):**
    > *"Kết luận, hệ thống FIVEFOOD đã hoàn thành tốt các nghiệp vụ cốt lõi và đảm bảo an toàn dữ liệu. Hướng phát triển tiếp theo của nhóm là tích hợp cổng thanh toán thực tế và kết nối GPS thời gian thực cho shipper. Nhóm em xin cảm ơn thầy cô đã lắng nghe và rất mong nhận được ý kiến đóng góp từ Hội đồng."*
