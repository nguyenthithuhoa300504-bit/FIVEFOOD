# TÀI LIỆU GIẢI THÍCH CHI TIẾT NGHIỆP VỤ & LUỒNG CHẠY API - FIVEFOOD

Tài liệu này giải thích chi tiết, dễ hiểu cách hoạt động của từng API nghiệp vụ quan trọng trong hệ thống **FIVEFOOD**, bao gồm: luồng chạy từng bước, các tham số gửi đi và các bảng dữ liệu thay đổi cụ thể.

---

## 1. NGHIỆP VỤ: THÊM MÓN ĂN VÀO GIỎ HÀNG

Khi người dùng nhấn nút **"Thêm vào giỏ"** trên giao diện, hệ thống xử lý như sau:

### 🔹 API sử dụng:
`POST /api/giohang/them` (Yêu cầu xác thực JWT Token ở Header)

### 🔹 Luồng chạy từng bước (Step-by-Step Flow):
1.  **Frontend gửi yêu cầu:** 
    *   Gửi JWT Token ở Header để xác thực.
    *   Gửi Body dạng JSON gồm: `{ SanPhamID: 10, SoLuong: 2 }`.
2.  **Backend (Node.js) tiếp nhận và kiểm tra:**
    *   Giải mã JWT Token để lấy ra `NguoiDungID` (ai đang thêm).
    *   Truy vấn bảng `SanPham` để kiểm tra món ăn ID số 10:
        *   *Món này còn bán không?* (Nếu cột `TrangThai = 0` $\rightarrow$ Báo lỗi ngưng bán).
        *   *Kho còn đủ hàng không?* (Nếu khách muốn mua 2 cái nhưng cột `SoLuongTon` chỉ còn 1 $\rightarrow$ Báo lỗi hết hàng).
3.  **Database (SQL Server) thực thi:**
    *   **Bước A:** Kiểm tra xem người dùng này đã có giỏ hàng chưa (tìm trong bảng `GioHang`). Nếu chưa có $\rightarrow$ Chèn (`INSERT`) một dòng mới vào bảng `GioHang` để lấy ra `GioHangID`.
    *   **Bước B:** Kiểm tra xem món ăn ID 10 đã có sẵn trong giỏ của người này chưa (tìm trong bảng `ChiTietGioHang` theo `GioHangID` và `SanPhamID`).
        *   *Nếu chưa có:* Chèn (`INSERT`) dòng mới vào bảng `ChiTietGioHang` với số lượng là 2.
        *   *Nếu đã có sẵn (ví dụ đang có 1):* Cộng dồn số lượng bằng lệnh `UPDATE` tăng số lượng lên thành 3.

### 🔹 Các bảng dữ liệu thay đổi (Database Changes):
*   Bảng `GioHang`: Thêm 1 dòng mới (nếu khách hàng này lần đầu tiên mua hàng).
*   Bảng `ChiTietGioHang`: Thêm 1 dòng mới **hoặc** thay đổi cột `SoLuong` ở dòng đã có sẵn.
*   *(Lưu ý: Bảng `SanPham` không bị thay đổi số lượng tồn kho ở bước này, hàng tồn kho chỉ bị trừ khi thực hiện Đặt hàng thành công).*

---

## 2. NGHIỆP VỤ: ĐẶT HÀNG & TẠO HÓA ĐƠN (CHECKOUT)

Khi người dùng nhấn nút **"Đặt hàng"** tại trang thanh toán:

### 🔹 API sử dụng:
`POST /api/hoadon` (Yêu cầu xác thực JWT Token ở Header)

### 🔹 Luồng chạy từng bước (Step-by-Step Flow):
1.  **Frontend gửi yêu cầu:**
    *   Gửi Body dạng JSON gồm: `{ MaKhuyenMai: "GIAM20", DiaChiNhan: "123 Nguyễn Trãi", SoDienThoaiNhan: "0987654321", ViDo: 10.77, KinhDo: 106.69 }`.
2.  **Backend gọi Stored Procedure `sp_TaoHoaDon`:**
    *   Backend nhận yêu cầu, giải mã lấy `NguoiDungID` và gọi thực thi thủ tục `sp_TaoHoaDon` trong CSDL.
3.  **Database thực thi khối TRANSACTION (Giao dịch an toàn):**
    *   **Bước A (Kiểm tra voucher):** Kiểm tra mã `"GIAM20"` trong bảng `KhuyenMai`. Nếu mã còn hạn, còn lượt sử dụng (`SoLuong > 0`) và đơn đạt giá trị tối thiểu $\rightarrow$ Tính toán số tiền được giảm giá và trừ 1 lượt sử dụng của mã này.
    *   **Bước B (Tạo hóa đơn):** Chèn (`INSERT`) một dòng mới vào bảng `HoaDon` chứa thông tin khách hàng, số tiền sau giảm giá, tọa độ địa lý (`ViDo`, `KinhDo`) và trạng thái mặc định là `N'Chờ xác nhận'`. Lấy ra ID hóa đơn vừa tạo (`HoaDonID`).
    *   **Bước C (Chuyển giỏ hàng sang hóa đơn):** Copy toàn bộ sản phẩm đang có từ bảng `ChiTietGioHang` sang bảng `ChiTietHoaDon` kèm theo giá bán tại thời điểm đó.
    *   **Bước D (Trigger trừ kho ngầm):** Ngay khi sản phẩm được chèn vào bảng `ChiTietHoaDon`, **Trigger `trg_ChiTietHoaDon_Insert`** tự động kích hoạt $\rightarrow$ Chạy lệnh `UPDATE` giảm cột `SoLuongTon` của món ăn đó trong bảng `SanPham`.
    *   **Bước E (Xóa giỏ hàng):** Lệnh `DELETE` tự động xóa sạch các món ăn trong bảng `ChiTietGioHang` của người dùng này (làm trống giỏ hàng).
    *   **Bước F (Tạo bản ghi thanh toán):** Chèn một dòng vào bảng `ThanhToan` ở trạng thái `N'Chưa thanh toán'`.
    *   Nếu tất cả các bước trên thành công $\rightarrow$ Lưu vĩnh viễn (`COMMIT`). Nếu có bất kỳ bước nào lỗi (ví dụ: bị trùng mã hoặc món ăn hết hàng tồn kho đột xuất) $\rightarrow$ Hủy bỏ toàn bộ quá trình (`ROLLBACK`).

### 🔹 Các bảng dữ liệu thay đổi (Database Changes):
*   Bảng `KhuyenMai`: Cột `SoLuong` giảm đi 1.
*   Bảng `HoaDon`: Thêm 1 dòng mới ở trạng thái `N'Chờ xác nhận'`.
*   Bảng `ChiTietHoaDon`: Thêm các dòng mới chi tiết các món đã đặt mua.
*   Bảng `SanPham`: Cột `SoLuongTon` bị giảm đi tương ứng với số lượng món khách đặt mua (thực thi tự động qua Trigger).
*   Bảng `ChiTietGioHang`: Bị xóa sạch dữ liệu của khách hàng đó.
*   Bảng `ThanhToan`: Thêm 1 dòng mới ở trạng thái `N'Chưa thanh toán'`.

---

## 3. NGHIỆP VỤ: HỦY ĐƠN HÀNG (CANCEL ORDER)

Khi khách hàng hoặc admin nhấn nút **"Hủy đơn"**:

### 🔹 API sử dụng:
`PUT /api/hoadon/:id/trangthai` với Body: `{ TrangThai: "Đã hủy" }`

### 🔹 Luồng chạy từng bước (Step-by-Step Flow):
1.  **Backend kiểm tra và thực thi:**
    *   Backend kiểm tra quyền hạn và cập nhật cột `TrangThai` của dòng hóa đơn đó trong bảng `HoaDon` thành `N'Đã hủy'`.
2.  **Database tự động kích hoạt Trigger `trg_HoaDon_UpdateStatus`:**
    *   Trigger phát hiện trạng thái vừa chuyển từ trạng thái khác sang `'Đã hủy'`.
    *   Nó tự động lấy thông tin từ bảng `ChiTietHoaDon` của hóa đơn này để chạy câu lệnh `UPDATE` cộng trả lại số lượng món ăn vào cột `SoLuongTon` của bảng `SanPham`.
    *   Nó tự động cộng trả lại 1 lượt dùng (`SoLuong = SoLuong + 1`) vào bảng `KhuyenMai` nếu đơn hàng bị hủy có sử dụng mã giảm giá.

### 🔹 Các bảng dữ liệu thay đổi (Database Changes):
*   Bảng `HoaDon`: Cột `TrangThai` cập nhật thành `N'Đã hủy'`.
*   Bảng `SanPham`: Cột `SoLuongTon` tăng trở lại (hoàn kho).
*   Bảng `KhuyenMai`: Cột `SoLuong` tăng trở lại (hoàn voucher).

---

## 4. NGHIỆP VỤ: HOÀN THÀNH ĐƠN HÀNG (COMPLETE ORDER)

Khi Admin xác nhận đã giao hàng thành công, hoặc khách hàng nhấn **"Đã nhận được hàng"**:

### 🔹 API sử dụng:
`PUT /api/hoadon/:id/trangthai` với Body: `{ TrangThai: "Hoàn thành" }`

### 🔹 Luồng chạy từng bước (Step-by-Step Flow):
1.  **Backend thực thi cập nhật trạng thái đơn:**
    *   Cập nhật trạng thái đơn trong bảng `HoaDon` thành `N'Hoàn thành'`.
2.  **Backend đồng bộ trạng thái thanh toán:**
    *   Khi thấy đơn hàng chuyển sang `'Hoàn thành'`, Backend tự động chạy một truy vấn SQL thứ hai cập nhật bảng `ThanhToan` liên kết với hóa đơn này thành:
        *   `TrangThaiThanhToan = N'Đã thanh toán'`
        *   `NgayThanhToan = GETDATE()` (lưu thời điểm thanh toán thực tế).

### 🔹 Các bảng dữ liệu thay đổi (Database Changes):
*   Bảng `HoaDon`: Cột `TrangThai` chuyển thành `N'Hoàn thành'`.
*   Bảng `ThanhToan`: Cột `TrangThaiThanhToan` cập nhật thành `N'Đã thanh toán'`, cột `NgayThanhToan` cập nhật thời gian hiện tại.
