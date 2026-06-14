# BÁO CÁO THUYẾT MINH KẾT THÚC HỌC PHẦN
**MÔN HỌC: LẬP TRÌNH BACKEND (HỆ ĐẠI HỌC)**

---

## 1. Thông tin thành viên (Số lượng sinh viên tối đa: 5 sinh viên)

*   **MSSV (Trưởng nhóm):** 120000123
*   **Họ và tên (Trưởng nhóm):** Nguyễn Văn A

### Danh sách sinh viên trong nhóm:

| STT | MSSV | Họ và tên | Vai trò | Ký tên | SĐT |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **01** | 120000123 | **Nguyễn Văn A** | **Trưởng nhóm - Database Engineer**<br>Thiết kế CSDL, Stored Procedures & Triggers | | 0987654321 |
| **02** | 120000234 | **Trần Hoàng Long** | **Backend Developer (Auth & Cart)**<br>Xử lý xác thực JWT, bảo mật & nghiệp vụ giỏ hàng | | 0976543210 |
| **03** | 120000345 | **Lê Thị Mai** | **Backend Developer (Admin & Products)**<br>API quản trị, hóa đơn, đánh giá & Swagger API Docs | | 0965432109 |
| **04** | 120000456 | **Phạm Minh Tuấn** | **Frontend Developer (Client App)**<br>Giao diện khách hàng, CSS Core & Logic client | | 0954321098 |
| **05** | 120000567 | **Nguyễn Thu Hà** | **Frontend Developer (Admin & Maps)**<br>Giao diện Admin, Bản đồ Leaflet & Theo dõi shipper | | 0943210987 |

---

## 2. Thông tin người hướng dẫn (Mentor)

*   **Họ và tên:** TS. Nguyễn Văn B
*   **Đơn vị:** Khoa Công nghệ thông tin - Bộ môn Kỹ thuật phần mềm
*   **Điện thoại:** 0909123456
*   **Email:** nvb@university.edu.vn

---

## 3. Tên dự án/ đề tài thực hiện trong học phần

**Xây dựng hệ thống đặt món ăn trực tuyến FIVEFOOD tích hợp bản đồ số và đồng bộ giỏ hàng thời gian thực**
*(Tên đề tài bắt đầu bằng động từ theo đúng tiêu chí yêu cầu)*

---

## 4. Tóm tắt đề tài

Đề tài tập trung xây dựng hệ thống website đặt món ăn trực tuyến **FIVEFOOD** nhằm giải quyết các bài toán thực tiễn của mô hình kinh doanh F&B trực tuyến như: mất đồng bộ giỏ hàng khi thay đổi thiết bị, nguy cơ quá bán (over-selling) khi nhiều khách hàng đặt cùng một món ăn giới hạn tồn kho, và khó khăn trong việc định vị, ước lượng lộ trình giao nhận.

Hệ thống được phát triển theo kiến trúc 3 lớp (3-Tier Architecture) hoàn chỉnh:
1.  **Tầng Dữ liệu (Database Layer):** Sử dụng **MS SQL Server** được chuẩn hóa cao với 12 bảng liên kết chặt chẽ, tối ưu hóa xử lý đồng thời bằng các giao dịch an toàn (**SQL Transactions**) trong Stored Procedure và tự động hóa cập nhật trạng thái thông qua **Database Triggers**.
2.  **Tầng Ứng dụng (Backend Layer):** Phát triển bằng **Node.js** và framework **Express.js**, sử dụng cơ chế bảo mật xác thực **JSON Web Token (JWT)**, mã hóa mật khẩu 1 chiều bằng **bcryptjs** và tự động biên soạn tài liệu đặc tả API thông qua **Swagger UI**.
3.  **Tầng Giao diện (Presentation Layer):** Xây dựng dưới dạng Single Page Application (SPA) bằng **Vanilla JS** kết hợp **CSS3** (Glassmorphism & Micro-animations) và thư viện bản đồ số **Leaflet** cùng API **OSRM** để tự động mô phỏng lộ trình shipper di chuyển giao đồ ăn thực tế.

Hệ thống phân quyền rõ ràng giữa Khách hàng (đặt món, áp mã giảm giá, theo dõi hành trình giao nhận, đánh giá) và Admin (quản lý thực đơn, phê duyệt đơn hàng, thống kê doanh thu biểu đồ), đảm bảo tính nhất quán dữ liệu tuyệt đối ngay cả khi xảy ra sự cố hủy đơn (hoàn kho và hoàn voucher tự động).

---

## 5. Mục tiêu và kết quả mong đợi

### Mục tiêu của đề tài:
*   **Nghiên cứu và làm chủ kiến trúc Backend hiện đại:** Xây dựng hệ thống API RESTful an toàn, phi trạng thái (stateless) sử dụng JWT Token, kết nối hiệu quả với cơ sở dữ liệu quan hệ SQL Server qua Connection Pool.
*   **Đảm bảo tính nhất quán dữ liệu (Data Integrity):** Áp dụng mô hình Transaction và Trigger ở mức cơ sở dữ liệu để giải quyết triệt để bài toán tranh chấp tài nguyên kho hàng (trừ tồn kho tức thời) và áp dụng khuyến mãi hợp lệ khi có lượng truy cập đồng thời lớn.
*   **Nâng cao trải nghiệm người dùng trực quan:** Tương tác bản đồ số tự động hóa việc lấy tọa độ, dịch địa chỉ chi tiết và vẽ lộ trình shipper thực tế dựa trên tuyến đường giao thông thực (OSRM API).
*   **Xây dựng giao diện Responsive, Premium:** Áp dụng hệ thống CSS chuẩn hóa, responsive trên mọi thiết bị di động và máy tính, tối ưu hóa thời gian tải trang.

### Kết quả của đề tài:
Hệ thống hoàn thành đầy đủ các tính năng thực tế bao gồm:
*   **Đồng bộ giỏ hàng (Hybrid Cart):** Tự động đồng bộ giỏ hàng từ Local Storage lên CSDL ngay khi người dùng đăng nhập để tránh mất dữ liệu.
*   **Đặt hàng an toàn qua Transaction:** Áp dụng Transaction trong procedure `sp_TaoHoaDon` bọc chuỗi tác vụ: áp dụng voucher, tạo đơn, xóa giỏ và khởi tạo thanh toán nhằm bảo toàn dữ liệu.
*   **Tự động hóa bằng Trigger:** Tự động trừ kho khi chèn hóa đơn chi tiết (`trg_ChiTietHoaDon_Insert`) và tự động hoàn trả kho + lượt dùng mã giảm giá khi hủy đơn (`trg_HoaDon_UpdateStatus`).
*   **Định vị và theo dõi shipper:** Tích hợp bản đồ Leaflet và OSRM API giúp người dùng click chọn vị trí giao, tự động dịch địa chỉ và vẽ lộ trình shipper di chuyển thực tế.
*   **Quản trị và thống kê trực quan:** Dashboard cho phép Admin quản lý danh mục/món ăn (có ẩn/hiện bán), duyệt trạng thái đơn (đồng bộ thanh toán) và xem biểu đồ doanh thu.


---

## 6. Kế hoạch thực hiện

| STT | Nội dung thực hiện | Thời gian | Người thực hiện |
| :---: | :--- | :--- | :--- |
| **01** | **Khảo sát hệ thống và phân tích yêu cầu:**<br>- Nghiên cứu quy trình đặt hàng, giao nhận thực tế.<br>- Khảo sát các API bản đồ mở (Leaflet, OpenStreetMap). | 1 tuần<br>Từ ngày ... đến ngày ... | Cả nhóm |
| **02** | **Thiết kế cơ sở dữ liệu (Database Design):**<br>- Thiết kế sơ đồ quan hệ Entity Relationship Diagram (ERD).<br>- Tạo kịch bản script tạo bảng, khóa ngoại (`database.sql`). | 1 tuần<br>Từ ngày ... đến ngày ... | Nguyễn Văn A |
| **03** | **Lập trình cơ sở dữ liệu nâng cao:**<br>- Viết Stored Procedure `sp_KiemTraDangNhap`.<br>- Viết Procedure nghiệp vụ cốt lõi `sp_TaoHoaDon` kèm xử lý Transaction.<br>- Viết các Trigger tự động hóa cập nhật tồn kho và hoàn voucher. | 1 tuần<br>Từ ngày ... đến ngày ... | Nguyễn Văn A |
| **04** | **Phát triển Backend Core (Auth & Cart API):**<br>- Cài đặt server Express, kết nối database pool (`db.config.js`).<br>- Viết middleware `verifyToken` & mã hóa mật khẩu `bcryptjs`.<br>- Lập trình API đăng nhập/đăng ký và API giỏ hàng. | 1.5 tuần<br>Từ ngày ... đến ngày ... | Trần Hoàng Long |
| **05** | **Phát triển Backend nghiệp vụ (Products, Orders & Docs):**<br>- Lập trình nhóm API sản phẩm, danh mục, khuyến mãi, đánh giá.<br>- Lập trình API cập nhật hóa đơn, trạng thái đơn hàng.<br>- Tích hợp Swagger biên soạn tài liệu API `/api-docs`. | 1.5 tuần<br>Từ ngày ... đến ngày ... | Lê Thị Mai |
| **06** | **Thiết kế giao diện Khách hàng (Client UI):**<br>- Xây dựng trang chủ `index.html` và trang món ăn yêu thích.<br>- Thiết kế CSS Core (`style.css`), hỗ trợ responsive và animations.<br>- Viết logic client `app.js` gọi API, quản lý token, đồng bộ giỏ hàng. | 2 tuần<br>Từ ngày ... đến ngày ... | Phạm Minh Tuấn |
| **07** | **Thiết kế giao diện Quản trị & Bản đồ (Admin & Maps UI):**<br>- Thiết kế giao diện Admin Dashboard (`admin.html`, `admin.css`).<br>- Viết logic quản trị `admin.js` thêm/sửa/xóa sản phẩm và duyệt đơn.<br>- Nhúng bản đồ Leaflet định vị nhận địa chỉ (`delivery-map.html`).<br>- Xây dựng trang theo dõi shipper thời gian thực qua OSRM API (`track-order.html`). | 2 tuần<br>Từ ngày ... đến ngày ... | Nguyễn Thu Hà |
| **08** | **Tích hợp hệ thống, kiểm thử và nghiệm thu:**<br>- Ghép nối Frontend & Backend toàn cục.<br>- Kiểm thử các kịch bản lỗi, tranh chấp tồn kho, hết hạn voucher.<br>- Hoàn thiện báo cáo thuyết minh và slide trình bày. | 1 tuần<br>Từ ngày ... đến ngày ... | Cả nhóm |

