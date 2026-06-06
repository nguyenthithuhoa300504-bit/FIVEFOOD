========================================================================
             HƯỚNG DẪN KHỞI CHẠY VÀ SỬ DỤNG DỰ ÁN BACKEND
========================================================================

Dự án sử dụng: Node.js (Express), MS SQL Server (mssql), JWT (jsonwebtoken) và Swagger UI.

------------------------------------------------------------------------
BƯỚC 1: CÀI ĐẶT THƯ VIỆN PHỤ THUỘC (DEPENDENCIES)
------------------------------------------------------------------------
Trước khi chạy dự án lần đầu, hãy cài đặt đầy đủ các package cần thiết:
Lệnh chạy:
   npm install

* Lưu ý: Thư viện 'bcryptjs' và các thư viện hỗ trợ đã được khai báo sẵn
  trong file package.json.

------------------------------------------------------------------------
BƯỚC 2: CẤU HÌNH CƠ SỞ DỮ LIỆU (DATABASE & ENV)
------------------------------------------------------------------------
1. Mở file .env ở thư mục gốc để kiểm tra cấu hình kết nối SQL Server:
   - DB_USER: Tài khoản (mặc định: sa)
   - DB_PASSWORD: Mật khẩu (mặc định: 123456)
   - DB_SERVER: Địa chỉ server (mặc định: localhost)
   - DB_DATABASE: Tên database (mặc định: WebBanDoAn)

2. Khởi tạo Stored Procedure trên database của bạn:
   - Mở phần mềm SQL Server Management Studio (SSMS).
   - Mở file 'procedures.sql' trong thư mục dự án này.
   - Nhấn F5 (hoặc nút Execute) để chạy tạo procedure 'sp_KiemTraDangNhap'.

------------------------------------------------------------------------
BƯỚC 3: KHỞI CHẠY SERVER DỰ ÁN update 15/06/2026
------------------------------------------------------------------------
Để khởi chạy Server, hãy chạy một trong hai câu lệnh sau tại terminal:

Cách 1: Chạy chế độ phát triển (Development Mode):
   npm run dev

Cách 2: Chạy chế độ thông thường (Production Mode):
   npm start

* Khuyến nghị phát triển: Nếu muốn tự động tải lại code khi chỉnh sửa file
  mà không cần nhấn Ctrl + C để khởi động lại server, bạn có thể:
  1. Cài đặt nodemon:
     npm install -D nodemon
  2. Sửa lại cấu hình trong package.json:
     "dev": "nodemon app.js"

------------------------------------------------------------------------
BƯỚC 4: KIỂM TRA VÀ KIỂM THỬ API QUA SWAGGER
------------------------------------------------------------------------
Sau khi chạy thành công, truy cập trình duyệt theo địa chỉ:
   http://localhost:3000/api-docs

Tại đây, bạn sẽ thấy Swagger UI hiển thị:
- Route POST /api/auth/login (Cho phép nhập TenDangNhap và MatKhauHash để test).
- Thử nghiệm tài khoản mẫu:
  * Tài khoản: admin
  * Mật khẩu: 123456

========================================================================
