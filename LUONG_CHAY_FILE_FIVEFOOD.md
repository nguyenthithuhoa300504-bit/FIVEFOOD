# 🗺️ LUỒNG CHẠY FILE - DỰ ÁN FIVEFOOD

---

## 1. TỔNG QUAN KIẾN TRÚC

```
Trình duyệt (Browser)
        ↕ HTTP Request / Response
Node.js Server (Express) — app.js
        ↕ SQL Query / Stored Procedure
MS SQL Server (Database)
```

---

## 2. VAI TRÒ TỪNG NHÓM FILE

| Nhóm file | Vị trí | Làm gì |
|---|---|---|
| **Entry point** | `app.js` (thư mục gốc) | Khởi động server, kết nối DB, đăng ký tất cả routes |
| **Frontend HTML** | `public/*.html` | Giao diện người dùng thấy trên trình duyệt |
| **Frontend JS** | `public/js/*.js` | Gọi API, cập nhật giao diện (không reload trang) |
| **Routes** | `routes/*.routes.js` | Định nghĩa URL API nào → gọi controller nào |
| **Controllers** | `controllers/*.controller.js` | Xử lý logic, truy vấn DB, trả kết quả JSON |
| **Database** | `database.sql` / `procedures.sql` | Bảng dữ liệu + Stored Procedures / Triggers |
| **Config** | `config/db.config.js` | Cấu hình kết nối SQL Server |

---

## 3. LUỒNG CHẠY CHI TIẾT

### ✅ Ví dụ 1: Hiển thị danh sách sản phẩm

```
1. Người dùng mở trình duyệt  →  public/index.html  (trang được tải)
                    ↓
2. index.html tự động load  →  public/js/app.js  (JS bắt đầu chạy)
                    ↓
3. app.js gọi:  fetch('GET /api/sanpham')
                    ↓
4. app.js (gốc) nhận request  →  chuyển tới  routes/sanpham.routes.js
                    ↓
5. sanpham.routes.js  →  gọi  controllers/sanpham.controller.js
                    ↓
6. sanpham.controller.js  →  chạy SQL / Stored Procedure trên DB
                    ↓
7. DB trả kết quả  →  controller đóng gói thành JSON
                    ↓
8. JSON trả về  →  public/js/app.js nhận  →  render HTML ra màn hình
```

---

### ✅ Ví dụ 2: Đặt hàng

```
1. User bấm "Đặt hàng" trên index.html
                    ↓
2. public/js/app.js  gọi:  POST /api/hoadon/tao
                    ↓
3. routes/hoadon.routes.js  →  controllers/hoadon.controller.js
                    ↓
4. Controller gọi Stored Procedure:  sp_TaoHoaDon  trong DB
                    ↓
5. sp_TaoHoaDon:  tạo hóa đơn + trừ tồn kho + trừ lượt dùng mã KM
   (tất cả trong 1 Transaction — đảm bảo toàn vẹn dữ liệu)
                    ↓
6. Trigger tự động chạy  →  cập nhật các bảng liên quan
                    ↓
7. Controller trả:  { success: true, orderId: ... }
                    ↓
8. public/js/app.js  hiển thị thông báo thành công cho user
```

---

### ✅ Ví dụ 3: Đăng nhập

```
1. User điền email/password  →  bấm "Đăng nhập"
                    ↓
2. public/js/app.js  gọi:  POST /api/auth/login
                    ↓
3. routes/auth.routes.js  →  controllers/auth.controller.js
                    ↓
4. Controller kiểm tra email + password trong DB
                    ↓
5. Nếu đúng: tạo JWT Token  →  trả về token
                    ↓
6. public/js/app.js  lưu token vào localStorage
                    ↓
7. Các lần gọi API sau đều gắn token vào header:
   Authorization: Bearer <token>
```

---

## 4. MAP NHANH: CHỨC NĂNG → FILE CODE

| Chức năng | Frontend JS | Route | Controller |
|---|---|---|---|
| Hiển thị sản phẩm | `public/js/app.js` | `sanpham.routes.js` | `sanpham.controller.js` |
| Đăng nhập / Đăng ký | `public/js/app.js` | `auth.routes.js` | `auth.controller.js` |
| Giỏ hàng | `public/js/app.js` | `giohang.routes.js` | `giohang.controller.js` |
| Đặt hàng | `public/js/app.js` | `hoadon.routes.js` | `hoadon.controller.js` |
| Mã giảm giá | `public/js/app.js` | `khuyenmai.routes.js` | `khuyenmai.controller.js` |
| Theo dõi đơn hàng | `public/js/track-order.js` | `hoadon.routes.js` | `hoadon.controller.js` |
| Admin dashboard | `public/js/admin.js` | `admin.routes.js` | `admin.controller.js` |
| Yêu thích | `public/js/favorites.js` | `yeuthich.routes.js` | `yeuthich.controller.js` |
| Danh mục | `public/js/app.js` | `danhmuc.routes.js` | `danhmuc.controller.js` |
| Đánh giá | `public/js/app.js` | `danhgia.routes.js` | `danhgia.controller.js` |
| Thanh toán | `public/js/app.js` | `thanhtoan.routes.js` | `thanhtoan.controller.js` |

---

## 5. SƠ ĐỒ FILE THEO TẦNG

```
📁 webdoan/
│
├── app.js                    ← ĐIỂM KHỞI ĐỘNG (Entry Point)
│
├── config/
│   └── db.config.js          ← Kết nối SQL Server
│
├── routes/                   ← TẦNG ĐỊNH TUYẾN (URL → Controller)
│   ├── auth.routes.js
│   ├── sanpham.routes.js
│   ├── giohang.routes.js
│   ├── hoadon.routes.js
│   └── ... (12 file)
│
├── controllers/              ← TẦNG XỬ LÝ LOGIC
│   ├── auth.controller.js
│   ├── sanpham.controller.js
│   ├── giohang.controller.js
│   ├── hoadon.controller.js
│   └── ... (12 file)
│
├── middlewares/              ← BẢO MẬT (Kiểm tra JWT Token)
│
├── public/                   ← FRONTEND (Trình duyệt tải về)
│   ├── index.html            ← Trang chủ
│   ├── admin.html            ← Trang admin
│   ├── track-order.html      ← Theo dõi đơn hàng
│   ├── favorites.html        ← Yêu thích
│   ├── css/                  ← Giao diện (CSS)
│   └── js/
│       ├── app.js            ← JS trang chủ (lớn nhất ~115KB)
│       ├── admin.js          ← JS admin
│       ├── track-order.js    ← JS theo dõi đơn
│       └── favorites.js      ← JS yêu thích
│
├── database.sql              ← Tạo bảng DB
└── procedures.sql            ← Stored Procedures + Triggers
```

---

## 6. TÓM TẮT 1 CÂU

> **Browser** mở HTML → JS gọi **API** (`/api/...`) → **Route** điều hướng → **Controller** xử lý → truy vấn **Database** qua Stored Procedure → trả **JSON** → **JS frontend** render lên màn hình.
