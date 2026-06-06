const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hash = '$2b$10$u4pLx.aLNNDeUTCdm6BauMGxFc8gEMQPkZdzfvPksprcUZuneyK6';

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const candidates = [
  '123456',
  md5('123456'),
  md5('123456').toUpperCase(),
  sha256('123456'),
  'admin',
  'admin123',
  'admin@123',
  '12345678',
  '123456aA@'
];

for (const c of candidates) {
  if (bcrypt.compareSync(c, hash)) {
    console.log(`FOUND MATCH: "${c}"`);
  }
}
console.log('Done testing.');
