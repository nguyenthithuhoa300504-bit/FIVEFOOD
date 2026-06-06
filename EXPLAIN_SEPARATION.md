# TÌM HIỂU SÂU VỀ VIỆC TÁCH BIỆT FRONTEND VÀ BACKEND

Trong phát triển phần mềm hiện đại, việc tách biệt **Frontend (Giao diện)** và **Backend (Logic & Cơ sở dữ liệu)** thành hai phần độc lập là một mô hình thiết kế chuẩn mực. Dưới đây là phân tích chi tiết giúp bạn hiểu rõ bản chất của việc tách biệt này.

---

## 1. MÔ HÌNH HIỆN TẠI CỦA DỰ ÁN (Hỗn Hợp - Monolith)

Hiện tại, dự án `webdoan` của bạn đang chạy ở dạng **Hỗn hợp (Monolith)** nhưng cấu trúc mã nguồn đã được tổ chức phân lớp rất sạch sẽ:
*   **Thư mục Backend**: Gồm `app.js`, `controllers/`, `routes/`, `config/`, `middlewares/`.
*   **Thư mục Frontend**: Nằm hoàn toàn trong thư mục `public/` (gồm `index.html`, `js/app.js`, `css/style.css`,...).

### Cách thức hoạt động hiện tại:
*   Backend Node.js (chạy trên cổng `3000`) đảm nhận **cả 2 nhiệm vụ**:
    1.  Cung cấp dữ liệu JSON qua các API (ví dụ: `/api/sanpham`).
    2.  Phục vụ giao diện tĩnh bằng câu lệnh: `app.use(express.static('public'));`.
*   Do cùng chạy trên một cổng `3000` và cùng một server, Frontend có thể gọi API bằng các đường dẫn tương đối như `fetch('/api/sanpham')` mà không cần ghi rõ tên miền.

---

## 2. MÔ HÌNH TÁCH BIỆT HOÀN TOÀN (Decoupled / Separated)

Khi tách biệt hoàn toàn, Frontend và Backend sẽ trở thành **2 dự án độc lập**, chạy trên **2 máy chủ khác nhau** (hoặc 2 cổng khác nhau trên môi trường phát triển).

```
                      MÔ HÌNH TÁCH BIỆT HOÀN TOÀN
                      
   [ Máy chủ FRONTEND ]                    [ Máy chủ BACKEND ]
     (VD: Vercel, Netlify)                   (VD: Render, VPS, AWS)
    domain: foodexpress.com                 domain: api.foodexpress.com
              |                                       |
              |            Gửi HTTP Request           |
              |-------------------------------------->|
              |       (kèm JWT Token ở Header)        |
              |                                       |
              |         Trả về dữ liệu JSON           |
              |<--------------------------------------|
              |       (CORS cho phép domain FE)       |
```

### Điểm khác biệt khi tách riêng biệt:
1.  **Frontend (Client)**: Chỉ chứa HTML, CSS, JS tĩnh. Nó có thể chạy trên một web server siêu nhẹ (như Nginx) hoặc host trên các nền tảng đám mây như Vercel, Netlify, Github Pages.
2.  **Backend (API Server)**: Chỉ chứa logic xử lý Node.js và không phục vụ bất kỳ trang HTML nào. Nhiệm vụ duy nhất của nó là kết nối SQL Server và trả về dữ liệu **JSON**. Nó chạy độc lập trên VPS hoặc dịch vụ như Render, Heroku.

---

## 3. CẦN THAY ĐỔI NHỮNG GÌ ĐỂ TÁCH BIỆT HOÀN TOÀN?

Nếu bạn muốn tách dự án hiện tại thành 2 thư mục riêng biệt độc lập (ví dụ thư mục `FoodExpress-Frontend` và `FoodExpress-Backend`), bạn cần thay đổi những phần sau:

### A. Thay đổi ở phía Backend (`app.js`)
1.  **Xóa phần phục vụ file tĩnh**: Xóa dòng lệnh `app.use(express.static('public'));` vì Backend không còn chứa thư mục `public` nữa.
2.  **Cấu hình CORS (Cross-Origin Resource Sharing)**: Vì Frontend chạy ở một cổng khác (ví dụ cổng `5500` khi chạy Live Server hoặc tên miền khác), bạn phải cấu hình CORS để cho phép tên miền Frontend truy cập vào Backend:
    ```javascript
    // Trong app.js
    const cors = require('cors');
    app.use(cors({
      origin: 'http://localhost:5500', // Địa chỉ domain/cổng của Frontend
      credentials: true
    }));
    ```

### B. Thay đổi ở phía Frontend (Các file Javascript trong `public/js/`)
Thay vì gọi các đường dẫn tương đối (như `/api/...`), Frontend bắt buộc phải gọi đường dẫn **tuyệt đối** trỏ tới IP hoặc tên miền của Server Backend:
```javascript
// Thay đổi trong file public/js/app.js:

// CŨ (Chạy chung server):
// const res = await fetch('/api/sanpham');

// MỚI (Tách riêng server):
const BACKEND_URL = 'http://localhost:3000'; // Hoặc tên miền của backend khi deploy
const res = await fetch(`${BACKEND_URL}/api/sanpham`);
```

---

## 4. BẢNG SO SÁNH GIỮA HAI MÔ HÌNH

| Đặc tính | Mô hình chạy chung (Hiện tại) | Mô hình tách biệt hoàn toàn |
| :--- | :--- | :--- |
| **Số lượng Server** | Chỉ cần 1 server Node.js chạy toàn bộ. | Cần 2 server (1 cho Frontend, 1 cho Backend). |
| **Giao tiếp API** | Dùng đường dẫn tương đối (`/api/foo`). | Dùng đường dẫn tuyệt đối (`https://api.domain.com/api/foo`). |
| **Vấn đề CORS** | Không bị lỗi CORS vì cùng chung cổng/domain. | Phải cấu hình CORS trên Backend để cho phép Frontend gọi sang. |
| **Triển khai (Deploy)** | Đơn giản, chỉ cần deploy 1 folder lên server. | Deploy Frontend lên dịch vụ tĩnh (Vercel/Netlify), Backend lên server VPS. |
| **Tốc độ tải trang** | Frontend phụ thuộc vào tốc độ xử lý của Node.js server. | Frontend tải cực nhanh nhờ các CDN đám mây tối ưu hóa file tĩnh. |
| **Khả năng mở rộng** | Khó scale riêng biệt Frontend và Backend. | Rất dễ scale. Nếu giao diện nhiều người xem, chỉ cần nâng cấp server Frontend. |

---

## 5. TẠI SAO NÊN TÁCH BIỆT FRONTEND VÀ BACKEND?

1.  **Chuyên môn hóa công nghệ (Stack độc lập)**: 
    *   Sau này bạn có thể đổi Frontend sang dùng **ReactJS, VueJS, Next.js** mà không cần thay đổi bất kỳ dòng code nào ở Backend Node.js.
    *   Hoặc bạn có thể đập đi xây lại Backend bằng **C# (.NET Core), Java Spring Boot, hoặc Python Go** mà giao diện Frontend vẫn giữ nguyên, chỉ cần khớp đúng các API endpoint.
2.  **Phát triển song song (Parallel Development)**: 
    *   Lập trình viên Frontend chỉ cần mở tài liệu **Swagger** ra đọc và code giao diện độc lập mà không cần quan tâm Backend cài đặt thế nào.
    *   Lập trình viên Backend chỉ cần tập trung viết API, kiểm thử qua Postman/Swagger mà không cần lo lắng về giao diện CSS bị lệch hay vỡ khung.
3.  **Tối ưu chi phí và hiệu năng**: 
    *   File tĩnh (HTML/CSS/JS) tải cực nhanh qua các mạng phân phối nội dung (CDN) miễn phí như Vercel/Netlify. Bạn chỉ tốn chi phí thuê máy chủ CPU/RAM cao cho phần Backend xử lý logic database nặng.
