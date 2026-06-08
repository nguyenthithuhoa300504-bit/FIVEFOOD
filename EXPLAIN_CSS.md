# GIẢI THÍCH CHI TIẾT CÁC THUỘC TÍNH CSS TRONG DỰ ÁN FOODEXPRESS

Tài liệu này giải thích chi tiết ý nghĩa, chức năng và vai trò của các thuộc tính CSS được sử dụng trong hệ thống giao diện **FoodExpress** (áp dụng trong `style.css`, `admin.css` và `delivery-map.css`).

---

## 1. HỆ THỐNG BIẾN CSS (CSS VARIABLES & THEME)

Hệ thống CSS của FoodExpress sử dụng biến CSS để xây dựng Design System đồng nhất, giúp dễ dàng chuyển đổi giao diện Sáng/Tối (Light/Dark Mode).

### `:root`
*   **Chức năng**: Chọn phần tử gốc của tài liệu (thường là thẻ `<html>`).
*   **Ứng dụng**: Dùng để định nghĩa các biến toàn cục (Global Variables) bắt đầu bằng dấu gạch ngang đôi `--`.
*   **Ví dụ trong dự án**:
    ```css
    :root {
      --primary-color: #ff5722; /* Màu cam chủ đạo */
      --radius-md: 16px;        /* Bo góc trung bình */
      --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    ```

### `var(...)`
*   **Chức năng**: Lấy giá trị của một biến CSS đã định nghĩa.
*   **Ứng dụng**: Truy xuất lại các biến màu sắc, bo góc để áp dụng cho các selector khác nhau.
*   **Ví dụ**: `background-color: var(--primary-color);`

### `body.dark-mode` / `body.light-theme`
*   **Chức năng**: Ghi đè (override) lại giá trị của các biến CSS khi class này được thêm vào thẻ `body` thông qua Javascript.
*   **Ứng dụng**: Chuyển đổi toàn bộ màu nền, màu chữ của trang sang chế độ tối/sáng chỉ với 1 dòng lệnh.

---

## 2. BỐ CỤC LINH HOẠT (FLEXBOX LAYOUT)

Flexbox là công cụ chính để căn chỉnh các phần tử theo hàng dọc hoặc hàng ngang một cách thông minh và linh hoạt.

*   **`display: flex;`**: Thiết lập phần tử cha làm container chứa các item Flexbox.
*   **`flex-direction`**:
    *   `row` (mặc định): Sắp xếp các phần tử con theo chiều ngang.
    *   `column`: Sắp xếp các phần tử con theo chiều dọc (ví dụ: danh sách menu sidebar, các ô nhập liệu của form).
*   **`justify-content`**: Căn chỉnh các phần tử con dọc theo trục chính (trục nằm ngang nếu là `row`):
    *   `space-between`: Đẩy phần tử đầu về góc trái, phần tử cuối về góc phải, khoảng trống chia đều ở giữa (dùng cho thanh Header `.header-container` để đẩy Logo sang trái, cụm tài khoản/giỏ hàng sang phải).
    *   `center`: Căn giữa tất cả phần tử con.
*   **`align-items`**: Căn chỉnh các phần tử con dọc theo trục phụ (trục dọc nếu là `row`):
    *   `center`: Căn giữa các phần tử theo chiều cao để chúng thẳng hàng nhau (như căn giữa icon và chữ trong nút bấm).
*   **`flex-grow`**: Quyết định độ giãn nở của phần tử con khi container còn khoảng trống:
    *   `flex-grow: 1`: Phần tử sẽ tự động phình to ra để lấp đầy toàn bộ khoảng không trống còn lại (dùng cho thanh tìm kiếm `.search-wrapper` trong Header để chiếm hết không gian ở giữa).
*   **`flex-shrink`**: Cho phép phần tử co lại nếu thiếu không gian:
    *   `flex-shrink: 0`: Ngăn phần tử bị bóp méo hoặc co nhỏ lại (thường dùng cho Avatar `.avatar-img` hoặc icon).
*   **`gap`**: Tạo khoảng cách đều giữa các phần tử con bên trong Flexbox (không cần dùng margin thủ công).

---

## 3. LƯỚI GIAO DIỆN (CSS GRID LAYOUT)

CSS Grid được sử dụng để xây dựng các bố cục hai chiều phức tạp, phân chia các cột hiển thị sản phẩm và biểu đồ dashboard.

*   **`display: grid;`**: Khởi tạo bố cục dạng lưới.
*   **`grid-template-columns`**: Định nghĩa số lượng và kích thước các cột:
    *   `repeat(auto-fit, minmax(220px, 1fr))`: Tự động tính toán số cột dựa trên kích thước màn hình. Mỗi cột có chiều rộng tối thiểu là `220px` và tối đa là `1fr` (một phần chia đều). Thuộc tính này giúp danh sách món ăn và thẻ thống kê tự động co giãn cực tốt trên mọi thiết bị mà không cần viết quá nhiều Media Queries.
*   **`grid-template-columns: 2fr 1fr;`**: Chia giao diện thành 2 cột: Cột bên trái rộng gấp đôi cột bên phải (dùng cho màn hình Dashboard Admin: cột trái chứa biểu đồ doanh thu, cột phải chứa hóa đơn mới).

---

## 4. HỆ THỐNG ĐỊNH VỊ (POSITIONING)

Định vị giúp đặt các phần tử ở những vị trí đặc biệt như đè lên nhau, cố định trên màn hình khi cuộn trang.

*   **`position: fixed;`**:
    *   **Nguyên lý**: Định vị phần tử cố định so với cửa sổ trình duyệt (viewport). Phần tử sẽ không bị di chuyển khi người dùng cuộn trang.
    *   **Ứng dụng**: Dùng cho thanh điều hướng chính `.main-header` luôn ghim ở mép trên (`top: 0; left: 0;`) và thanh menu Sidebar của Admin luôn ghim bên trái.
*   **`position: relative;`**:
    *   **Nguyên lý**: Định vị phần tử theo vị trí bình thường của nó, đồng thời làm điểm tựa (gốc tọa độ) cho các phần tử con có thuộc tính `absolute`.
*   **`position: absolute;`**:
    *   **Nguyên lý**: Định vị phần tử dựa vào phần tử cha gần nhất có thuộc tính `relative` (hoặc `fixed`).
    *   **Ứng dụng**:
        *   `.cart-badge` (số lượng món trong giỏ hàng): Định vị ở góc trên bên phải của nút giỏ hàng.
        *   `.floating-badge` (thẻ nổi trang trí trong Hero banner): Định vị tự do bay quanh hình ảnh món ăn chính.
*   **`z-index`**: Quyết định thứ tự xếp chồng của các phần tử đè lên nhau:
    *   Phần tử có `z-index` lớn hơn sẽ nằm đè lên trên phần tử có `z-index` nhỏ hơn (Header dùng `z-index: 1000` để đảm bảo luôn nằm trên các nội dung khác của trang khi cuộn).

---

## 5. HIỆU ỨNG THỦY TINH & NỀN MỜ (GLASSMORPHISM & VISUAL EFFECTS)

FoodExpress sở hữu giao diện sang trọng, cao cấp nhờ áp dụng phong cách thiết kế kính mờ hiện đại.

*   **`backdrop-filter: blur(12px);`**:
    *   **Chức năng**: Tạo hiệu ứng làm mờ phần nội dung nằm phía sau phần tử.
    *   **Ứng dụng**: Dùng cho `.main-header` kết hợp với màu nền bán trong suốt để tạo hiệu ứng kính mờ (Glassmorphism), giúp giao diện trông vô cùng hiện đại và mượt mà.
*   **`background: rgba(r, g, b, alpha);`**: Màu nền bán trong suốt với độ mờ đục điều chỉnh qua tham số `alpha` (từ `0` - trong suốt hoàn toàn đến `1` - đục hoàn toàn).
*   **`box-shadow`**: Đổ bóng cho phần tử để tạo chiều sâu:
    *   Ví dụ: `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);` giúp các thẻ (Card) món ăn trông như nổi lên khỏi nền trang web.
*   **`linear-gradient(...)` & `radial-gradient(...)`**: Tạo nền chuyển màu (gradient) dạng tuyến tính hoặc tỏa tròn, giúp giao diện không bị đơn điệu.
*   **`-webkit-background-clip: text` & `-webkit-text-fill-color: transparent`**:
    *   **Chức năng**: Giới hạn dải màu gradient chỉ hiển thị bên trong viền chữ, và làm chữ gốc trở nên trong suốt.
    *   **Ứng dụng**: Tạo hiệu ứng chữ chuyển màu nghệ thuật cho các tiêu đề lớn (ví dụ: tên thương hiệu hoặc tiêu đề Banner).

---

## 6. THIẾT KẾ ĐÁP ỨNG & KÍCH THƯỚC (RESPONSIVE & SIZING)

*   **`box-sizing: border-box;`**:
    *   **Chức năng**: Thay đổi cách tính kích thước phần tử. Chiều rộng thực tế = `width` (đã bao gồm cả `padding` và `border`).
    *   **Ứng dụng**: Giúp lập trình viên dễ kiểm soát bố cục hơn, không sợ phần tử bị phình to ra ngoài mong muốn khi thêm padding.
*   **`clamp(min, preferred, max)`**:
    *   **Chức năng**: Hàm tự động tính toán kích thước linh hoạt nằm trong khoảng từ `min` đến `max`.
    *   **Ứng dụng**: Áp dụng cho kích thước chữ (Font Size) hoặc kích thước ảnh banner (ví dụ: `font-size: clamp(40px, 4.5vw, 64px)`). Trên màn hình nhỏ, chữ sẽ tự co về tối thiểu `40px`, trên màn hình lớn chữ tự giãn lên tối đa `64px`, loại bỏ hiện tượng tràn viền.
*   **`object-fit: cover;`**:
    *   **Chức năng**: Cắt và căn chỉnh hình ảnh tự động để lấp đầy khung chứa mà không làm ảnh bị bóp méo, kéo giãn (mất tỷ lệ).
    *   **Ứng dụng**: Cực kỳ quan trọng đối với ảnh món ăn (`.hero-card-floating img`) và ảnh đại diện người dùng (`.avatar-img`).
*   **`object-position: center top;`**: Định vị vùng trọng tâm của bức ảnh khi thực hiện cắt (ví dụ: tập trung lấy phần giữa và phần trên của ảnh avatar).

---

## 7. HIỆU ỨNG ĐỘNG & TƯƠNG TÁC (ANIMATIONS & TRANSITIONS)

Các thuộc tính này tạo ra phản hồi trực quan sinh động khi người dùng tương tác.

*   **`transition: all 0.3s cubic-bezier(...);`**:
    *   **Chức năng**: Tạo chuyển cảnh mượt mà khi một thuộc tính CSS thay đổi (ví dụ: từ màu xám sang màu cam khi di chuột qua).
    *   **Ứng dụng**: Giúp các nút bấm, liên kết và thẻ sản phẩm thay đổi trạng thái một cách tự nhiên, không bị giật đột ngột.
*   **`transform`**: Biến đổi hình học của phần tử:
    *   `transform: translateY(-2px);`: Nhấc phần tử lên trên 2 pixel (tạo hiệu ứng nổi lên khi di chuột).
    *   `transform: scale(1.15);`: Phóng to phần tử lên 1.15 lần.
*   **`@keyframes`**: Định nghĩa một hoạt ảnh (Animation) tùy biến chạy liên tục hoặc một lần:
    *   *Hoạt ảnh float-hero*: Làm hình ảnh món ăn ở Banner chính tự động bay lên hạ xuống nhẹ nhàng (`translateY`).
    *   *Hoạt ảnh pulse-badge*: Tạo hiệu ứng co giãn nhịp tim cho chấm đỏ giỏ hàng để thu hút sự chú ý.
*   **`user-select: none;`**: Ngăn chặn người dùng bôi đen văn bản của phần tử (thường dùng cho các nút bấm để tránh việc click đúp chuột nhanh bị bôi xanh chữ gây mất thẩm mỹ).
*   **`scroll-behavior: smooth;`**: Giúp trình duyệt cuộn trang mượt mà khi người dùng click vào các liên kết neo (Anchor link #).

---

## 8. TỐI ƯU HÓA HIỂN THỊ CHỮ (TEXT TRUNCATION)

Khi mô tả món ăn hoặc tên sản phẩm quá dài, CSS sẽ tự động cắt ngắn và thêm dấu ba chấm để đảm bảo giao diện luôn gọn gàng.

```css
.product-table-desc {
  white-space: nowrap;      /* Ngăn chữ tự động xuống dòng */
  overflow: hidden;         /* Ẩn phần chữ bị tràn ra ngoài khung */
  text-overflow: ellipsis;  /* Thay thế phần chữ bị ẩn bằng dấu ba chấm (...) */
}
```

---

## 9. TÙY BIẾN THANH CUỘN (SCROLLBAR CUSTOMIZATION)

Hệ thống ghi đè thanh cuộn mặc định thô kệch của trình duyệt bằng thanh cuộn mảnh và đẹp mắt:

*   **`::-webkit-scrollbar`**: Định hình chiều rộng và chiều cao của toàn bộ thanh cuộn.
*   **`::-webkit-scrollbar-track`**: Định dạng phần nền (đường chạy) của thanh cuộn.
*   **`::-webkit-scrollbar-thumb`**: Định dạng cục trượt (thanh chạy) của thanh cuộn. Có thể bo góc (`border-radius`) và đổi màu khi người dùng di chuột qua (`:hover`).
