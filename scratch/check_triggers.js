const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'WebBanDoAn',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT 
        t.name AS TriggerName,
        OBJECT_NAME(t.parent_id) AS ParentTable,
        t.is_disabled AS IsDisabled,
        OBJECT_DEFINITION(t.object_id) AS TriggerDefinition
      FROM sys.triggers t
      WHERE OBJECT_NAME(t.parent_id) IN ('HoaDon', 'ChiTietHoaDon')
    `);
    
    console.log(JSON.stringify(result.recordset, null, 2));
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}

main();
