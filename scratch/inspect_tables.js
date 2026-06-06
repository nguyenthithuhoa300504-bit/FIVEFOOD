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

    // Get all tables and columns
    const result = await pool.request().query(`
      SELECT 
        t.name AS TableName,
        c.name AS ColumnName,
        ty.name AS DataType,
        c.max_length AS MaxLength,
        c.is_nullable AS IsNullable
      FROM sys.tables t
      INNER JOIN sys.columns c ON t.object_id = c.object_id
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      ORDER BY t.name, c.column_id
    `);

    console.log('--- TABLES AND COLUMNS IN DB ---');
    let currentTable = '';
    result.recordset.forEach(row => {
      if (row.TableName !== currentTable) {
        currentTable = row.TableName;
        console.log(`\nTable: ${currentTable}`);
      }
      console.log(`  - ${row.ColumnName} (${row.DataType}${row.MaxLength > 0 ? '(' + row.MaxLength + ')' : ''}, ${row.IsNullable ? 'NULL' : 'NOT NULL'})`);
    });

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
