const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function run() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to database!');

    // Update image URLs for matching products
    const updates = [
      {
        id: 1,
        url: 'https://images.unsplash.com/photo-1603133872878-6966b45880ac?w=600',
        desc: 'Cơm chiên hải sản đặc biệt'
      },
      {
        id: 2,
        url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600',
        desc: 'Trà sữa trân châu'
      },
      {
        id: 3,
        url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
        desc: 'Pizza hải sản'
      },
      {
        id: 4,
        url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
        desc: 'Cơm chiên hải sản'
      },
      {
        id: 13,
        url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600',
        desc: 'Bánh Mì Kẹp Thịt Nướng'
      }
    ];

    for (const item of updates) {
      const request = new sql.Request();
      request.input('id', sql.Int, item.id);
      request.input('url', sql.NVarChar(255), item.url);
      
      const result = await request.query(`
        UPDATE SanPham 
        SET HinhAnh = @url 
        WHERE SanPhamID = @id
      `);
      console.log(`Updated ${item.desc} (ID: ${item.id}): ${result.rowsAffected} row(s) affected.`);
    }

    await sql.close();
    console.log('Product images successfully updated in the database!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
