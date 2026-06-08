const bcrypt = require('bcryptjs');

const hash = '$2b$10$u4pLx.aLNNDeUTCdm6BauMGxFc8gEMQPkZdzfvPksprcUZuneyK6';
const passwords = ['123456', 'admin', 'admin123', '123456a@', '12345678', 'password'];

for (const p of passwords) {
  const match = bcrypt.compareSync(p, hash);
  console.log(`Password: "${p}" -> ${match ? 'MATCH' : 'NO MATCH'}`);
}
