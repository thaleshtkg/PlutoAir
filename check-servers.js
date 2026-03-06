/**
 * Server Health Check Script
 * Verifies that frontend and backend servers are running before E2E tests
 * 
 * Run with: node check-servers.js
 */

const http = require('http');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function checkServer(url, name) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 500) {
        console.log(`${colors.green}✅ ${name} is running${colors.reset} (${url})`);
        resolve({ name, url, status: 'running', statusCode: res.statusCode });
      } else {
        console.log(`${colors.yellow}⚠️  ${name} responded with status ${res.statusCode}${colors.reset} (${url})`);
        resolve({ name, url, status: 'warning', statusCode: res.statusCode });
      }
    });

    req.on('timeout', () => {
      console.log(`${colors.red}❌ ${name} timed out${colors.reset} (${url})`);
      req.destroy();
      resolve({ name, url, status: 'timeout' });
    });

    req.on('error', (err) => {
      console.log(`${colors.red}❌ ${name} is not running${colors.reset} (${url})`);
      console.log(`   Error: ${err.message}`);
      resolve({ name, url, status: 'error', error: err.message });
    });

    req.end();
  });
}

async function checkAllServers() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Checking Server Status...');
  console.log('='.repeat(60) + '\n');

  const results = await Promise.all([
    checkServer(FRONTEND_URL, 'Frontend Server'),
    checkServer(BACKEND_URL, 'Backend Server')
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60) + '\n');

  const allRunning = results.every(r => r.status === 'running');
  const hasWarnings = results.some(r => r.status === 'warning');

  if (allRunning) {
    console.log(`${colors.green}✅ All servers are running!${colors.reset}`);
    console.log(`\n${colors.blue}You can now run the E2E tests:${colors.reset}`);
    console.log(`   ${colors.yellow}npx playwright test e2e-validation.spec.js --headed${colors.reset}`);
    console.log(`   ${colors.yellow}node e2e-validation-puppeteer.js${colors.reset}`);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  Servers are running but with warnings${colors.reset}`);
    console.log(`\nYou may proceed with caution, but check server logs for issues.`);
  } else {
    console.log(`${colors.red}❌ One or more servers are not running!${colors.reset}`);
    console.log(`\n${colors.blue}To start the servers:${colors.reset}`);
    
    const frontendDown = results.find(r => r.name === 'Frontend Server' && r.status === 'error');
    const backendDown = results.find(r => r.name === 'Backend Server' && r.status === 'error');

    if (frontendDown) {
      console.log(`\n${colors.yellow}Terminal 1 - Frontend:${colors.reset}`);
      console.log(`   cd frontend`);
      console.log(`   npm install`);
      console.log(`   npm run dev`);
    }

    if (backendDown) {
      console.log(`\n${colors.yellow}Terminal 2 - Backend:${colors.reset}`);
      console.log(`   cd backend`);
      console.log(`   npm install`);
      console.log(`   npm run dev`);
    }

    console.log(`\n${colors.blue}Then run this script again to verify:${colors.reset}`);
    console.log(`   node check-servers.js`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(allRunning ? 0 : 1);
}

// Run the check
checkAllServers().catch(err => {
  console.error(`${colors.red}Error running health check:${colors.reset}`, err);
  process.exit(1);
});
