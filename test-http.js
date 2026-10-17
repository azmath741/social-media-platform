const http = require('http');
require('dotenv').config();

const { app, server } = require('./server');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runHttpTests() {
  console.log('--- STARTING HTTP ROUTES TEST ---');
  const port = process.env.PORT || 5000;

  try {
    // Test 1: GET / should redirect to /login for unauthenticated users
    console.log('[HTTP Test 1] GET / (Unauthenticated)');
    const resHome = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/',
      method: 'GET',
    });
    console.log(`Status: ${resHome.statusCode}, Location: ${resHome.headers.location}`);
    if (resHome.statusCode !== 302 || resHome.headers.location !== '/login') {
      throw new Error(`Expected 302 redirect to /login, got ${resHome.statusCode}`);
    }
    console.log('✓ Unauthenticated user redirected to /login');

    // Test 2: GET /login should return 200 OK and contains CSRF token
    console.log('\n[HTTP Test 2] GET /login');
    const resLogin = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/login',
      method: 'GET',
    });
    console.log(`Status: ${resLogin.statusCode}`);
    if (resLogin.statusCode !== 200 || !resLogin.body.includes('name="_csrf"')) {
      throw new Error(`Expected 200 and CSRF input in HTML, got ${resLogin.statusCode}`);
    }
    console.log('✓ /login returned 200 OK with CSRF token input');

    // Test 3: GET /register should return 200 OK and contains register form
    console.log('\n[HTTP Test 3] GET /register');
    const resRegister = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/register',
      method: 'GET',
    });
    console.log(`Status: ${resRegister.statusCode}`);
    if (resRegister.statusCode !== 200 || !resRegister.body.includes('Join Pulse Today')) {
      throw new Error(`Expected 200 and register form in HTML, got ${resRegister.statusCode}`);
    }
    console.log('✓ /register returned 200 OK with registration form');

    // Test 4: POST without CSRF token should be rejected (403 Forbidden)
    console.log('\n[HTTP Test 4] POST /register without CSRF token');
    const postPayload = 'name=Hacker&username=hacker&email=h@h.com&password=secret';
    const resPostNoCsrf = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postPayload),
          'Accept': 'application/json',
        },
      },
      postPayload
    );
    console.log(`Status: ${resPostNoCsrf.statusCode}`);
    if (resPostNoCsrf.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for missing CSRF, got ${resPostNoCsrf.statusCode}`);
    }
    console.log('✓ Missing CSRF token successfully blocked with 403 Forbidden');

    // Test 5: GET /non-existent-route should return 404 Not Found error page
    console.log('\n[HTTP Test 5] GET /non-existent-route');
    const res404 = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/non-existent-route-xyz',
      method: 'GET',
    });
    console.log(`Status: ${res404.statusCode}`);
    if (res404.statusCode !== 404 || !res404.body.includes('404')) {
      throw new Error(`Expected 404 error page, got ${res404.statusCode}`);
    }
    console.log('✓ 404 handled gracefully with styled error page');

    console.log('\n========================================');
    console.log('ALL HTTP & SECURITY ROUTE TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runHttpTests().catch((err) => {
  console.error('\n❌ HTTP TEST SUITE FAILED:', err);
  process.exit(1);
});

