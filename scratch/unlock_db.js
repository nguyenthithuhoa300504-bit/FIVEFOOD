const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'master', // Connect to master first
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    console.log('Connecting to master to release locks on WebBanDoAn...');
    const pool = await sql.connect(config);
    
    console.log('Forcing rollback of any dangling transactions on WebBanDoAn...');
    await pool.request().query('ALTER DATABASE WebBanDoAn SET SINGLE_USER WITH ROLLBACK IMMEDIATE;');
    console.log('Restoring multi-user access...');
    await pool.request().query('ALTER DATABASE WebBanDoAn SET MULTI_USER;');
    
    console.log('Database successfully unlocked!');
    await sql.close();
  } catch (err) {
    console.error('Failed to unlock database:', err.message);
  }
}

main();
