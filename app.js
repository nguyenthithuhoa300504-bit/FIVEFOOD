require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectDB } = require('./config/db.config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ thư mục tĩnh 'public' chứa giao diện Frontend
app.use(express.static('public'));

// Cấu hình Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // Sử dụng OpenAPI 3.0.0 hiện đại
    info: {
      title: 'Food Delivery API',
      version: '1.0.0',
      description: 'Hệ thống API bán đồ ăn trực tuyến (Node.js, Express, MS SQL Server, JWT)',
      contact: {
        name: 'Developer Hỗ trợ',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Development Server'
      }
    ],
    // Cấu hình bảo mật JWT (Bearer Token) cho OpenAPI 3.0
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập chuỗi JWT Token của bạn để xác thực.'
        }
      }
    },
    // Áp dụng bảo mật BearerAuth toàn cục (hoặc cấu hình theo từng route cụ thể)
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./app.js', './routes/*.js'], // Đường dẫn chứa các file định nghĩa API để sinh tài liệu
};

// Khởi tạo Swagger Specs
const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Import & Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vaitro', require('./routes/vaitro.routes'));
app.use('/api/danhmuc', require('./routes/danhmuc.routes'));
app.use('/api/sanpham', require('./routes/sanpham.routes'));
app.use('/api/giohang', require('./routes/giohang.routes'));
app.use('/api/khuyenmai', require('./routes/khuyenmai.routes'));
app.use('/api/hoadon', require('./routes/hoadon.routes'));
app.use('/api/thanhtoan', require('./routes/thanhtoan.routes'));
app.use('/api/danhgia', require('./routes/danhgia.routes'));
app.use('/api/yeuthich', require('./routes/yeuthich.routes'));
app.use('/api', require('./routes/nguoidung.routes'));
app.use('/api/admin', require('./routes/admin.routes'));


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Kiểm tra trạng thái hoạt động của server
 *     description: API test nhanh để xác định server Node.js đang chạy bình thường.
 *     responses:
 *       200:
 *         description: Server hoạt động tốt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Server is running smoothly!"
 *                 uptime:
 *                   type: number
 *                   example: 12.34
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly!',
    uptime: process.uptime()
  });
});

// Trang chủ mặc định hướng dẫn truy cập Swagger Docs
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
      <h1 style="color: #4A90E2;">Food Delivery API Server</h1>
      <p>Server của bạn đã hoạt động bình thường trên Port <strong>${PORT}</strong>.</p>
      <p>Truy cập tài liệu API tại: <a href="/api-docs" style="color: #E24A4A; font-weight: bold; text-decoration: none;">/api-docs</a></p>
    </div>
  `);
});

// Khởi chạy server sau khi kết nối cơ sở dữ liệu thành công
const startServer = async () => {
  try {
    // Kết nối MS SQL Server
    await connectDB();

    // Khởi chạy HTTP Server
    app.listen(PORT, () => {
      console.log(`[Server] Khởi chạy thành công tại địa chỉ: http://localhost:${PORT}`);
      console.log(`[Swagger] Tài liệu API có sẵn tại: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('[Server] Không thể khởi chạy ứng dụng do lỗi kết nối Database.');
  }
};

startServer();
