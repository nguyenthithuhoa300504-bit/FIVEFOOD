# 🚀 Hướng Dẫn Triển Khai FoodExpress lên VPS (Ubuntu Server)

Tài liệu này hướng dẫn từng bước cách triển khai ứng dụng **FoodExpress** lên một VPS chạy **Ubuntu 22.04 LTS**, sử dụng **Node.js + PM2 + Nginx + SSL Let's Encrypt**.

---

## Yêu Cầu

- VPS với Ubuntu 22.04 LTS (tối thiểu 1 vCPU, 1GB RAM)
- Tên miền đã trỏ DNS về IP của VPS (ví dụ: `foodexpress.yourdomain.com`)
- Đã có SQL Server (có thể dùng **Azure SQL** hoặc cài **SQL Server on Linux**)

---

## Bước 1: Cài Đặt Node.js (v18 LTS)

```bash
# Cài đặt NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra phiên bản
node -v   # v18.x.x
npm -v    # 9.x.x
```

---

## Bước 2: Upload Source Code lên VPS

**Cách 1: Dùng Git (khuyến nghị)**
```bash
# Trên VPS
cd /var/www
git clone <your-github-repo-url> foodexpress
cd foodexpress
npm install --production
```

**Cách 2: Dùng SCP (copy file trực tiếp)**
```bash
# Trên máy local
scp -r ./webdoan user@<VPS_IP>:/var/www/foodexpress
```

---

## Bước 3: Cấu Hình Biến Môi Trường

```bash
cd /var/www/foodexpress
nano .env
```

Nội dung file `.env` trên server:
```env
PORT=3000
JWT_SECRET=mot_chuoi_bat_ky_rat_dai_va_ngau_nhien_it_nhat_64_ky_tu

DB_SERVER=<your-azure-sql-server>.database.windows.net
DB_DATABASE=WebBanDoAn
DB_USER=<db-username>
DB_PASSWORD=<db-password>
DB_PORT=1433
```

> **⚠️ Lưu ý bảo mật:** Không bao giờ commit file `.env` lên Git!

---

## Bước 4: Cài Đặt và Khởi Chạy PM2

**PM2** là trình quản lý tiến trình Node.js, giúp ứng dụng chạy liên tục 24/7.

```bash
# Cài PM2 toàn cục
sudo npm install -g pm2

# Khởi chạy ứng dụng
cd /var/www/foodexpress
pm2 start app.js --name "foodexpress"

# Tự động khởi động lại khi VPS reboot
pm2 startup
pm2 save
```

**Các lệnh PM2 hữu ích:**
```bash
pm2 status           # Xem trạng thái
pm2 logs foodexpress # Xem logs
pm2 restart foodexpress  # Khởi động lại
pm2 stop foodexpress     # Dừng app
```

---

## Bước 5: Cài Đặt và Cấu Hình Nginx

**Nginx** đóng vai trò là Reverse Proxy, nhận request ở port 80/443 và chuyển tiếp về Node.js ở port 3000.

```bash
# Cài Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Tạo file cấu hình cho tên miền
sudo nano /etc/nginx/sites-available/foodexpress
```

Nội dung cấu hình:
```nginx
server {
    listen 80;
    server_name foodexpress.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Kích hoạt cấu hình
sudo ln -s /etc/nginx/sites-available/foodexpress /etc/nginx/sites-enabled/
sudo nginx -t        # Kiểm tra cú pháp
sudo systemctl reload nginx
```

---

## Bước 6: Cấu Hình SSL với Let's Encrypt (HTTPS miễn phí)

```bash
# Cài Certbot
sudo apt install certbot python3-certbot-nginx -y

# Xin cấp chứng chỉ SSL (thay bằng tên miền thực tế)
sudo certbot --nginx -d foodexpress.yourdomain.com

# Certbot sẽ tự động cập nhật cấu hình Nginx sang HTTPS
# Chứng chỉ SSL tự động gia hạn mỗi 90 ngày qua cronjob
```

Kiểm tra chứng chỉ tự gia hạn:
```bash
sudo certbot renew --dry-run
```

---

## Bước 7: Kiểm Tra Triển Khai

```bash
# Kiểm tra PM2 đang chạy
pm2 status

# Kiểm tra Nginx
sudo systemctl status nginx

# Kiểm tra ứng dụng từ Internet
curl https://foodexpress.yourdomain.com/api/danhmuc
```

Truy cập trang web từ trình duyệt:
- **Trang chủ:** `https://foodexpress.yourdomain.com`
- **Trang Admin:** `https://foodexpress.yourdomain.com/admin.html`
- **Swagger API Docs:** `https://foodexpress.yourdomain.com/api-docs`

---

## Bước 8: Cập Nhật Code (Deploy mới)

```bash
cd /var/www/foodexpress

# Lấy code mới nhất từ Git
git pull origin main

# Cài dependencies mới (nếu có)
npm install --production

# Khởi động lại ứng dụng (zero-downtime)
pm2 restart foodexpress
```

---

## Cấu Trúc Hệ Thống Sau Khi Deploy

```
Internet (HTTPS :443)
    ↓
Nginx Reverse Proxy (:80 redirect → :443)
    ↓
Node.js / Express App (:3000) [PM2]
    ↓
MS SQL Server (Azure SQL / localhost :1433)
```
