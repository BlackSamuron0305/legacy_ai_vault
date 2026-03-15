import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers/promises';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions for colored output
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.magenta}[HEADER]${colors.reset} ${msg}`),
  service: (msg) => console.log(`${colors.cyan}[SERVICE]${colors.reset} ${msg}`),
};

// Configuration
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const ENV_FILE = path.join(SCRIPT_DIR, '.env');
const TIMEOUT = 10000; // 10 seconds

// Load environment variables
function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    log.error(`Environment file not found: ${ENV_FILE}`);
    process.exit(1);
  }

  const env = {};
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  log.success(`Environment loaded from ${ENV_FILE}`);
  return env;
}

// Mask sensitive values
function maskValue(value) {
  if (!value) return '(missing)';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

// HTTP request with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Check service health
async function checkService(serviceName, url, expectedStatus = 200) {
  log.service(`Checking ${serviceName}...`);
  
  const startTime = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const duration = Date.now() - startTime;
    
    if (response.status === expectedStatus) {
      log.success(`${serviceName} is healthy (${duration}ms)`);
      return { success: true, duration, status: response.status };
    } else {
      log.error(`${serviceName} failed (HTTP ${response.status}, ${duration}ms)`);
      return { success: false, duration, status: response.status };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`${serviceName} unreachable (${duration}ms) - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Check API authentication
async function checkApiAuth(serviceName, url, headers, successPattern = null) {
  log.service(`Checking ${serviceName} authentication...`);
  
  const startTime = Date.now();
  try {
    const response = await fetchWithTimeout(url, { headers });
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      log.success(`${serviceName} authentication OK (${duration}ms)`);
      return { success: true, duration, status: response.status };
    } else {
      log.error(`${serviceName} authentication failed (HTTP ${response.status}, ${duration}ms)`);
      return { success: false, duration, status: response.status };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`${serviceName} authentication error (${duration}ms) - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Check Docker services
async function checkDockerServices() {
  log.header('Docker Services Status');
  console.log('');

  try {
    // Check if Docker is available
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('docker --version');
    await execAsync('docker info');

    // Try docker-compose or docker compose
    let composeCmd = 'docker-compose';
    try {
      await execAsync('docker-compose --version');
    } catch {
      composeCmd = 'docker compose';
      await execAsync('docker compose version');
    }

    // Get service status
    const { stdout } = await execAsync(`${composeCmd} ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"`);
    const lines = stdout.trim().split('\n').slice(1); // Skip header

    for (const line of lines) {
      if (line.includes('running')) {
        const serviceName = line.split('\t')[0];
        log.success(`${serviceName} is running`);
      } else if (line.includes('exited')) {
        const serviceName = line.split('\t')[0];
        log.error(`${serviceName} has exited`);
      }
    }
  } catch (error) {
    log.error(`Docker check failed: ${error.message}`);
  }
}

// Main health check function
async function mainHealthCheck() {
  log.header('Legacy AI Vault - Health Check');
  console.log('');

  // Load environment
  const env = loadEnv();
  console.log('');

  log.header('Configuration Check');
  console.log('');

  let configOk = true;

  // Check critical environment variables
  if (env.ELEVENLABS_API_KEY) {
    log.success(`ELEVENLABS_API_KEY: ${maskValue(env.ELEVENLABS_API_KEY)}`);
  } else {
    log.error('ELEVENLABS_API_KEY: missing');
    configOk = false;
  }

  if (env.HUGGINGFACE_API_TOKEN) {
    log.success(`HUGGINGFACE_API_TOKEN: ${maskValue(env.HUGGINGFACE_API_TOKEN)}`);
  } else {
    log.error('HUGGINGFACE_API_TOKEN: missing');
    configOk = false;
  }

  if (env.SUPABASE_URL) {
    log.success(`SUPABASE_URL: ${env.SUPABASE_URL}`);
  } else {
    log.error('SUPABASE_URL: missing');
    configOk = false;
  }

  if (env.SUPABASE_SERVICE_KEY) {
    log.success(`SUPABASE_SERVICE_KEY: ${maskValue(env.SUPABASE_SERVICE_KEY)}`);
  } else {
    log.error('SUPABASE_SERVICE_KEY: missing');
    configOk = false;
  }

  console.log('');
  log.header('Service Health Checks');
  console.log('');

  const results = [];
  let checksPassed = 0;
  let totalChecks = 0;

  // Check AI Service
  totalChecks++;
  const aiServiceResult = await checkService('AI Service', 'http://localhost:5000/api/health');
  if (aiServiceResult.success) checksPassed++;
  results.push({ ...aiServiceResult, serviceName: 'AI Service' });

  // Check Backend API
  totalChecks++;
  const backendResult = await checkService('Backend API', 'http://localhost:3001/api/health');
  if (backendResult.success) checksPassed++;
  results.push({ ...backendResult, serviceName: 'Backend API' });

  // Check Frontend
  totalChecks++;
  const frontendResult = await checkService('Frontend', 'http://localhost:3000');
  if (frontendResult.success) checksPassed++;
  results.push({ ...frontendResult, serviceName: 'Frontend' });

  // Check external APIs (optional)
  console.log('');
  log.header('External API Checks');
  console.log('');

  if (env.ELEVENLABS_API_KEY) {
    totalChecks++;
    const elevenlabsResult = await checkApiAuth(
      'ElevenLabs API',
      'https://api.elevenlabs.io/v1/user',
      { 'xi-api-key': env.ELEVENLABS_API_KEY }
    );
    if (elevenlabsResult.success) checksPassed++;
    results.push({ ...elevenlabsResult, serviceName: 'ElevenLabs API' });
  }

  if (env.HUGGINGFACE_API_TOKEN) {
    totalChecks++;
    const huggingfaceResult = await checkApiAuth(
      'Hugging Face API',
      'https://huggingface.co/api/whoami-v2',
      { 'Authorization': `Bearer ${env.HUGGINGFACE_API_TOKEN}` }
    );
    if (huggingfaceResult.success) checksPassed++;
    results.push({ ...huggingfaceResult, serviceName: 'Hugging Face API' });
  }

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    totalChecks++;
    const supabaseResult = await checkApiAuth(
      'Supabase REST',
      `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`,
      {
        apikey: env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
      }
    );
    if (supabaseResult.success) checksPassed++;
    results.push({ ...supabaseResult, serviceName: 'Supabase REST' });
  }

  // Docker services check
  console.log('');
  await checkDockerServices();

  // Summary
  console.log('');
  log.header('Health Check Summary');
  console.log('');

  let exitCode = 0;
  if (checksPassed === totalChecks) {
    log.success(`All checks passed! (${checksPassed}/${totalChecks})`);
    exitCode = 0;
  } else if (checksPassed > Math.floor(totalChecks / 2)) {
    log.warning(`Partial success (${checksPassed}/${totalChecks})`);
    exitCode = 1;
  } else {
    log.error(`Major issues detected (${checksPassed}/${totalChecks})`);
    exitCode = 2;
  }

  console.log('');
  log.info('Service URLs:');
  console.log('  Frontend: http://localhost:3000');
  console.log('  Backend:  http://localhost:3001/api');
  console.log('  AI Service: http://localhost:5000/api');
  console.log('');

  // Detailed results table
  console.log('');
  log.header('Detailed Results');
  console.log('');
  console.log('Service'.padEnd(20) + 'Status'.padEnd(10) + 'Duration'.padEnd(12) + 'Details');
  console.log('─'.repeat(60));
  
  for (const result of results) {
    const status = result.success ? '✓ OK' : '✗ FAIL';
    const duration = `${result.duration}ms`;
    const details = result.status || result.error || 'N/A';
    console.log(
      result.serviceName.padEnd(20) + 
      status.padEnd(10) + 
      duration.padEnd(12) + 
      details
    );
  }

  process.exit(exitCode);
}

// Run main function
mainHealthCheck().catch((error) => {
  log.error(`Health check failed unexpectedly: ${error.message}`);
  process.exit(1);
});
