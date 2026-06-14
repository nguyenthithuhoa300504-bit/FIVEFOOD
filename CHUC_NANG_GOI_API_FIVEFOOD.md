# 📡 CHỨC NĂNG GỌI API NÀO — FIVEFOOD (Lấy từ code thực tế)

> Mỗi chức năng trên web → gọi đúng 1 API → đi qua Route → Controller → Database

---

## 🗺️ SƠ ĐỒ TỔNG QUÁT

```
public/js/app.js  (Frontend)
        |
        |  fetch('/api/...')
        ↓
app.js (gốc)  →  routes/*.routes.js  →  controllers/*.controller.js  →  Database
```

---

## 1. 📦 HIỂN THỊ DỮ LIỆU (Tải trang — GET)

> Các hàm này tự động chạy khi trang web được mở

| Chức năng | Hàm JS | API gọi | Route → Controller |
|---|---|---|---|
| Tải danh mục | `fetchCategories()` | `GET /api/danhmuc` | `danhmuc.routes` → `danhmuc.controller` |
| Tải sản phẩm trang chủ | `fetchProducts()` | `GET /api/sanpham?page=&limit=8` | `sanpham.routes` → `sanpham.controller` |
| Lọc SP theo danh mục | `fetchProducts(catId)` | `GET /api/sanpham/danhmuc/{id}` | `sanpham.routes` → `sanpham.controller` |
| Tìm kiếm sản phẩm | `searchProducts()` | `GET /api/sanpham/timkiem?q=...` | `sanpham.routes` → `sanpham.controller` |
| Xem chi tiết sản phẩm | *(click vào SP)* | `GET /api/sanpham/{id}` | `sanpham.routes` → `sanpham.controller` |
| Hiển thị mã khuyến mãi | `fetchPromotions()` | `GET /api/khuyenmai` | `khuyenmai.routes` → `khuyenmai.controller` |
| Xem đánh giá sản phẩm | *(mở modal SP)* | `GET /api/danhgia/sanpham/{id}` | `danhgia.routes` → `danhgia.controller` |
| Xem lịch sử đơn hàng | `fetchUserOrders()` | `GET /api/hoadon` | `hoadon.routes` → `hoadon.controller` |
| Xem chi tiết 1 đơn | *(click xem đơn)* | `GET /api/hoadon/{orderId}` | `hoadon.routes` → `hoadon.controller` |

---

## 2. 🛒 GIỎ HÀNG — gọi `/api/giohang`

> File xử lý: `routes/giohang.routes.js` → `controllers/giohang.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Thêm vào giỏ hàng** | 1197, 1414, 1876 | `/api/giohang/them` | `POST` |
| **Đồng bộ giỏ từ DB** | 1314, 1385 | `/api/giohang/{userId}` | `GET` |
| **Cập nhật số lượng** | 1359 | `/api/giohang/capnhat` | `PUT` |
| **Xóa 1 item khỏi giỏ** | 1303, 1321, 1866 | `/api/giohang/item/{chiTietId}` | `DELETE` |

### ⚠️ Giỏ hàng có 2 chế độ:
```
Chưa đăng nhập  →  Lưu vào localStorage (biến: cart[])
                    Không gọi API

Đã đăng nhập    →  Gọi API lưu vào Database
                    Mapping: dbCart = { SanPhamID: ChiTietGioHangID }
                    Khi checkout → xóa giỏ DB → tạo hóa đơn
```

---

## 3. 🧾 ĐẶT HÀNG — gọi `/api/hoadon`

> File xử lý: `routes/hoadon.routes.js` → `controllers/hoadon.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Đặt hàng** (tạo hóa đơn) | 1909 | `/api/hoadon` | `POST` |
| **Hủy đơn hàng** | 2376 | `/api/hoadon/{id}/trangthai` | `PUT` |
| **Xác nhận đã nhận hàng** | 2694 | `/api/hoadon/{id}/trangthai` | `PUT` |

### Luồng đặt hàng chi tiết:
```
User bấm "Xác nhận đặt hàng"
        ↓
app.js (dòng 1858):  GET /api/giohang/{userId}  ← lấy giỏ từ DB
        ↓
app.js (dòng 1866):  DELETE /api/giohang/item/{id}  ← xóa từng item
        ↓
app.js (dòng 1909):  POST /api/hoadon  ← tạo hóa đơn
        ↓
hoadon.controller.js  →  gọi Stored Procedure: sp_TaoHoaDon
        ↓
sp_TaoHoaDon (trong DB):
  - Tạo bản ghi hóa đơn
  - Tạo chi tiết hóa đơn
  - Trừ tồn kho sản phẩm
  - Trừ lượt dùng mã KM (nếu có)
  - Tất cả trong 1 Transaction (đảm bảo toàn vẹn)
        ↓
Trả về { hoaDonId, ... }  →  app.js hiển thị modal "Đặt hàng thành công 🎉"
```

---

## 4. 👤 TÀI KHOẢN — gọi `/api/auth`, `/api/nguoidung`

> File xử lý: `routes/auth.routes.js` → `controllers/auth.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Đăng nhập** | 2006 | `/api/login` | `POST` |
| **Đăng ký** | 2068 | `/api/register` | `POST` |
| **Cập nhật hồ sơ** | 2824 | `/api/nguoidung/{userId}` | `PUT` |

### Luồng đăng nhập:
```
User nhập email + password  →  bấm Đăng nhập
        ↓
POST /api/login  →  auth.controller.js kiểm tra DB
        ↓
Nếu đúng: tạo JWT Token  →  trả về token + thông tin user
        ↓
app.js lưu vào localStorage:
  fe_token = "eyJhbGci..."
  fe_user  = { NguoiDungID, HoTen, Email, ... }
        ↓
Mọi API sau đó đều gửi kèm:
  Header: Authorization: Bearer <token>
```

---

## 5. ❤️ YÊU THÍCH — gọi `/api/yeuthich`

> File xử lý: `routes/yeuthich.routes.js` → `controllers/yeuthich.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Thêm yêu thích** | 1154 | `/api/yeuthich` | `POST` |
| **Xóa yêu thích** | 1139 | `/api/yeuthich/{id}` | `DELETE` |
| **Đồng bộ danh sách** | 1443 | `/api/yeuthich/dongbo` | `POST` |
| **Lấy danh sách** | 1454 | `/api/yeuthich` | `GET` |

---

## 6. 🏷️ MÃ GIẢM GIÁ — gọi `/api/khuyenmai`

> File xử lý: `routes/khuyenmai.routes.js` → `controllers/khuyenmai.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Hiển thị mã KM** | 537 | `/api/khuyenmai` | `GET` |
| **Áp dụng mã KM** | 1530 | `/api/khuyenmai/ap-dung` | `POST` |

---

## 7. ⭐ ĐÁNH GIÁ — gọi `/api/danhgia`

> File xử lý: `routes/danhgia.routes.js` → `controllers/danhgia.controller.js`

| Chức năng | Dòng code (app.js) | API gọi | Phương thức |
|---|---|---|---|
| **Xem đánh giá SP** | 1009 | `/api/danhgia/sanpham/{id}` | `GET` |
| **Kiểm tra đã đánh giá** | 2510 | `/api/danhgia/hoadon/{orderId}` | `GET` |
| **Gửi đánh giá** | 2642 | `/api/danhgia` | `POST` |

---

## 8. 🗂️ BẢNG TỔNG HỢP NHANH

```
CHỨC NĂNG                 FILE FRONTEND          API              FILE BACKEND
─────────────────────────────────────────────────────────────────────────────────
Tải sản phẩm              public/js/app.js  →  /api/sanpham  →  sanpham.controller
Tải danh mục              public/js/app.js  →  /api/danhmuc  →  danhmuc.controller
Tìm kiếm                  public/js/app.js  →  /api/sanpham  →  sanpham.controller
Thêm giỏ hàng             public/js/app.js  →  /api/giohang  →  giohang.controller
Xóa/sửa giỏ              public/js/app.js  →  /api/giohang  →  giohang.controller
Áp dụng mã KM             public/js/app.js  →  /api/khuyenmai→  khuyenmai.controller
Đặt hàng                  public/js/app.js  →  /api/hoadon   →  hoadon.controller
Hủy / Nhận hàng           public/js/app.js  →  /api/hoadon   →  hoadon.controller
Đăng nhập / Đăng ký       public/js/app.js  →  /api/login    →  auth.controller
Cập nhật hồ sơ            public/js/app.js  →  /api/nguoidung→  nguoidung.controller
Yêu thích                 public/js/app.js  →  /api/yeuthich →  yeuthich.controller
Gửi đánh giá              public/js/app.js  →  /api/danhgia  →  danhgia.controller
Theo dõi đơn              track-order.js    →  /api/hoadon   →  hoadon.controller
Trang admin               admin.js          →  /api/admin    →  admin.controller
Giao hàng (map)           delivery-map.js   →  /api/hoadon   →  hoadon.controller
```

---

## 9. 💡 QUY TẮC DỄ NHỚ

```
Mỗi nhóm chức năng  →  1 cặp Route + Controller duy nhất
─────────────────────────────────────────────────────────
Sản phẩm    →  sanpham.routes   +  sanpham.controller
Giỏ hàng    →  giohang.routes   +  giohang.controller
Hóa đơn     →  hoadon.routes    +  hoadon.controller
Tài khoản   →  auth.routes      +  auth.controller
Khuyến mãi  →  khuyenmai.routes +  khuyenmai.controller
Yêu thích   →  yeuthich.routes  +  yeuthich.controller
Đánh giá    →  danhgia.routes   +  danhgia.controller
Admin        →  admin.routes     +  admin.controller
```

> **Ghi nhớ**: Tên file routes và controller **luôn đồng nhau** → dễ tìm!
