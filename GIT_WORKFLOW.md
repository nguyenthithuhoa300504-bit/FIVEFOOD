# 🌿 Quy Trình Làm Việc Nhóm với Git - FoodExpress

Tài liệu này mô tả quy trình quản lý mã nguồn, phân nhánh và review code cho nhóm phát triển dự án **FoodExpress Web Application**.

---

## 1. Khởi Tạo Repository

```bash
# Khởi tạo Git trong thư mục dự án
cd webdoan
git init

# Commit lần đầu tiên
git add .
git commit -m "feat: Initial project setup - FoodExpress"

# Kết nối với GitHub (thay <your-repo-url> bằng URL thực tế)
git remote add origin <your-repo-url>
git push -u origin main
```

---

## 2. Mô Hình Phân Nhánh (Git Flow)

```
main          ← Nhánh chính (production-ready)
  └── develop ← Nhánh tích hợp (staging)
        ├── feature/ten-tinh-nang   ← Tính năng mới
        └── bugfix/ten-loi          ← Sửa lỗi
```

| Nhánh | Mục đích | Ai tạo |
| :--- | :--- | :--- |
| `main` | Source code đã được kiểm thử, sẵn sàng deploy | Lead |
| `develop` | Tích hợp tất cả tính năng đã hoàn thành | Lead |
| `feature/*` | Phát triển tính năng mới | Mỗi thành viên |
| `bugfix/*` | Sửa lỗi phát sinh | Mỗi thành viên |

---

## 3. Quy Trình Phát Triển Tính Năng Mới

### Bước 1: Tạo nhánh từ `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
```
> Ví dụ: `feature/them-bieu-do-thong-ke`, `feature/quan-ly-khuyen-mai`

### Bước 2: Phát triển và commit thường xuyên
```bash
git add .
git commit -m "feat: Mô tả ngắn gọn thay đổi"
```

### Bước 3: Đẩy nhánh lên remote
```bash
git push origin feature/ten-tinh-nang
```

### Bước 4: Tạo Pull Request (PR) trên GitHub
- **Base branch:** `develop`
- **Compare branch:** `feature/ten-tinh-nang`
- **Title:** `[Feature] Tên tính năng ngắn gọn`
- **Description:** Mô tả chi tiết những thay đổi, cách test

### Bước 5: Code Review
- Ít nhất **1 thành viên khác** phải review và approve
- Góp ý qua GitHub Comments trực tiếp trên từng dòng code
- Sau khi được approve → Merge vào `develop`

---

## 4. Quy Ước Viết Commit Message

Sử dụng chuẩn **Conventional Commits**:

```
<type>: <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>
```

| Type | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| `feat` | Tính năng mới | `feat: Thêm biểu đồ thống kê doanh thu` |
| `fix` | Sửa lỗi | `fix: Sửa lỗi đồng bộ trạng thái đơn hàng` |
| `style` | Thay đổi CSS/UI, không ảnh hưởng logic | `style: Cập nhật màu sắc dashboard` |
| `refactor` | Tái cấu trúc code, không thêm tính năng | `refactor: Tách hàm renderCharts` |
| `docs` | Cập nhật tài liệu | `docs: Thêm hướng dẫn deploy DEPLOY.md` |
| `chore` | Công việc phụ (config, package) | `chore: Cập nhật .gitignore` |

---

## 5. Mẫu Pull Request

```markdown
## Mô tả thay đổi
<!-- Mô tả ngắn gọn tính năng/sửa lỗi này làm gì -->

## Cách test
1. Chạy `npm run dev`
2. Truy cập `http://localhost:3000/admin.html`
3. Đăng nhập tài khoản Admin
4. Kiểm tra [mô tả chi tiết bước test]

## Checklist
- [ ] Code đã được test thủ công
- [ ] Không có lỗi console.log thừa
- [ ] Đã cập nhật API docs (nếu thêm endpoint mới)
```

---

## 6. Merge vào `main` (Deploy)

Sau khi tất cả tính năng trong `develop` đã được kiểm thử:

```bash
git checkout main
git merge develop
git push origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin --tags
```

---

## 7. Xử Lý Conflict

```bash
# Lấy code mới nhất từ develop về nhánh hiện tại
git fetch origin
git rebase origin/develop

# Nếu có conflict, mở file bị conflict và giải quyết thủ công
# Sau đó:
git add .
git rebase --continue
```
