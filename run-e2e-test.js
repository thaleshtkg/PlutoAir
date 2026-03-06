/**
 * Master E2E Test Runner
 * Checks server health and runs the appropriate E2E test
 * 
 * Run with: node run-e2e-test.js [playwright|puppeteer]
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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
        resolve({ name, url, status: 'running', statusCode: res.statusCode });
      } else {
        resolve({ name, url, status: 'warning', statusCode: res.statusCode });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name, url, status: 'timeout' });
    });

    req.on('error', (err) => {
      resolve({ name, url, status: 'error', error: err.message });
    });

    req.end();
  });
}

async function checkAllServers() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🔍 Step 1: Checking Server Status...', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  const results = await Promise.all([
    checkServer(FRONTEND_URL, 'Frontend Server'),
    checkServer(BACKEND_URL, 'Backend Server')
  ]);

  results.forEach(result => {
    if (result.status === 'running') {
      log(`✅ ${result.name} is running (${result.url})`, 'green');
    } else {
      log(`❌ ${result.name} is NOT running (${result.url})`, 'red');
      if (result.error) {
        log(`   Error: ${result.error}`, 'red');
      }
    }
  });

  const allRunning = results.every(r => r.status === 'running');

  if (!allRunning) {
    log('\n❌ Cannot proceed: Servers are not running!', 'red');
    log('\nTo start the servers:', 'yellow');
    log('\nTerminal 1 - Frontend:', 'yellow');
    log('   cd frontend && npm run dev');
    log('\nTerminal 2 - Backend:', 'yellow');
    log('   cd backend && npm run dev');
    log('\nThen run this script again.\n', 'yellow');
    process.exit(1);
  }

  log('\n✅ All servers are running!\n', 'green');
  return true;
}

function checkDependencies(testType) {
  log('='.repeat(70), 'cyan');
  log('📦 Step 2: Checking Dependencies...', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  const packageJsonPath = path.join(__dirname, 'package.json');
  let packageJson = {};

  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  }

  const devDeps = packageJson.devDependencies || {};
  const deps = packageJson.dependencies || {};

  if (testType === 'playwright') {
    const hasPlaywright = devDeps['@playwright/test'] || deps['@playwright/test'];
    
    if (!hasPlaywright) {
      log('❌ Playwright is not installed', 'red');
      log('\nTo install Playwright:', 'yellow');
      log('   npm install -D @playwright/test', 'yellow');
      log('   npx playwright install chromium\n', 'yellow');
      return false;
    }
    
    log('✅ Playwright is installed', 'green');
    
    // Check if browsers are installed
    const browsersPath = path.join(__dirname, 'node_modules', '@playwright', 'test');
    if (!fs.existsSync(browsersPath)) {
      log('⚠️  Playwright browsers may not be installed', 'yellow');
      log('   Run: npx playwright install chromium\n', 'yellow');
    }
    
  } else if (testType === 'puppeteer') {
    const hasPuppeteer = devDeps['puppeteer'] || deps['puppeteer'];
    
    if (!hasPuppeteer) {
      log('❌ Puppeteer is not installed', 'red');
      log('\nTo install Puppeteer:', 'yellow');
      log('   npm install puppeteer\n', 'yellow');
      return false;
    }
    
    log('✅ Puppeteer is installed', 'green');
  }

  log('');
  return true;
}

function runTest(testType) {
  return new Promise((resolve, reject) => {
    log('='.repeat(70), 'cyan');
    log(`🚀 Step 3: Running ${testType.toUpperCase()} E2E Test...`, 'cyan');
    log('='.repeat(70) + '\n', 'cyan');

    let command, args;

    if (testType === 'playwright') {
      command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      args = ['playwright', 'test', 'e2e-validation.spec.js', '--headed', '--slowmo=300'];
    } else if (testType === 'puppeteer') {
      command = process.platform === 'win32' ? 'node.exe' : 'node';
      args = ['e2e-validation-puppeteer.js'];
    }

    const testProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        log('\n✅ Test completed successfully!', 'green');
        resolve(true);
      } else {
        log('\n❌ Test failed or encountered errors', 'red');
        resolve(false);
      }
    });

    testProcess.on('error', (err) => {
      log(`\n❌ Error running test: ${err.message}`, 'red');
      reject(err);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let testType = args[0] || 'playwright'; // Default to playwright

  // Validate test type
  if (!['playwright', 'puppeteer'].includes(testType)) {
    log('❌ Invalid test type. Use "playwright" or "puppeteer"', 'red');
    log('\nUsage:', 'yellow');
    log('   node run-e2e-test.js [playwright|puppeteer]', 'yellow');
    log('\nExamples:', 'yellow');
    log('   node run-e2e-test.js playwright', 'yellow');
    log('   node run-e2e-test.js puppeteer\n', 'yellow');
    process.exit(1);
  }

  log('\n' + '='.repeat(70), 'blue');
  log('🎯 End-to-End Test Runner', 'blue');
  log('='.repeat(70), 'blue');
  log(`Test Type: ${testType.toUpperCase()}`, 'blue');
  log('='.repeat(70) + '\n', 'blue');

  try {
    // Step 1: Check servers
    await checkAllServers();

    // Step 2: Check dependencies
    const depsOk = checkDependencies(testType);
    if (!depsOk) {
      process.exit(1);
    }

    // Step 3: Run test
    const testPassed = await runTest(testType);

    // Final summary
    log('\n' + '='.repeat(70), 'cyan');
    log('📊 Final Summary', 'cyan');
    log('='.repeat(70), 'cyan');
    
    if (testPassed) {
      log('✅ All tests passed!', 'green');
      log('\nNext steps:', 'blue');
      log('   - Review test output above for detailed results');
      log('   - Check for any warnings or console errors');
      
      if (testType === 'playwright') {
        log('   - View HTML report: npx playwright show-report');
      }
    } else {
      log('❌ Tests failed!', 'red');
      log('\nNext steps:', 'blue');
      log('   - Review error messages above');
      log('   - Check screenshots in project root (error-*.png)');
      log('   - Review server logs for backend/frontend errors');
      
      if (testType === 'playwright') {
        log('   - View HTML report: npx playwright show-report');
        log('   - Debug: npx playwright test e2e-validation.spec.js --debug');
      }
    }
    
    log('='.repeat(70) + '\n', 'cyan');

    process.exit(testPassed ? 0 : 1);

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();
