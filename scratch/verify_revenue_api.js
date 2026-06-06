const http = require('http');

const PORT = 3000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function verify() {
  try {
    console.log('Logging in as Admin...');
    const loginRes = await request('POST', '/api/auth/login', {
      TenDangNhap: 'admin',
      MatKhau: '123456'
    });

    // Wait, let's verify if the route is /api/auth/login or /api/login (in test_api.js it was /api/login)
    // Let's try /api/auth/login first, or if it fails we check.
    let token = '';
    if (loginRes.status === 200 && loginRes.body.token) {
      token = loginRes.body.token;
    } else {
      // Try /api/login
      const loginResAlt = await request('POST', '/api/login', {
        TenDangNhap: 'admin',
        MatKhau: '123456'
      });
      if (loginResAlt.status === 200 && loginResAlt.body.token) {
        token = loginResAlt.body.token;
      } else {
        console.error('Login failed! Response:', loginRes, loginResAlt);
        process.exit(1);
      }
    }

    console.log('Fetching revenue from /api/admin/doanhthu...');
    const revRes = await request('GET', '/api/admin/doanhthu', null, token);
    console.log('API Response status:', revRes.status);
    console.log('API Response body:', revRes.body);

    if (revRes.status === 200) {
      console.log('\nSUCCESS: Revenue successfully retrieved!');
      console.log('TongDoanhThu:', revRes.body.TongDoanhThu);
      // We expect 756000 (which is 621000 + 135000)
      if (parseFloat(revRes.body.TongDoanhThu) === 756000) {
        console.log('✅ Revenue is CORRECT (756,000)!');
      } else {
        console.error('❌ Revenue is INCORRECT! Expected 756000, got:', revRes.body.TongDoanhThu);
        process.exit(1);
      }
    } else {
      console.error('❌ API failed with status:', revRes.status);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

verify();
