const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'WebBanDoAn',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    console.log('Connecting to database with config:', {
      server: config.server,
      database: config.database,
      user: config.user,
    });
    
    const pool = await sql.connect(config);
    console.log('Connected! Reading procedures.sql...');
    
    const sqlFilePath = path.join(__dirname, '../procedures.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file by "GO" statements
    const commands = sqlContent.split(/^\s*GO\s*$/mi);
    
    console.log(`Found ${commands.length} SQL blocks. Executing...`);
    
    for (let i = 0; i < commands.length; i++) {
      let cmd = commands[i].trim();
      
      if (cmd.toUpperCase().startsWith('USE ')) {
        continue;
      }
      
      if (cmd === '') {
        continue;
      }
      
      try {
        console.log(`Executing block ${i + 1}/${commands.length}...`);
        await pool.request().query(cmd);
        console.log(`Block ${i + 1} succeeded!`);
      } catch (err) {
        console.error(`Error in block ${i + 1}:`, err.message);
        console.error('Command content was:', cmd.substring(0, 200) + '...');
        throw err;
      }
    }
    
    console.log('All SQL blocks executed successfully!');
    await sql.close();
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

main();
