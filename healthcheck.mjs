import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getConfig() {
  const root = process.cwd();
  const envPath = path.join(root, '.env');
  const fileEnv = loadEnvFile(envPath);

  const get = (key, fallback = '') => process.env[key] || fileEnv[key] || fallback;

  return {
    ELEVENLABS_API_KEY: get('ELEVENLABS_API_KEY'),
    HUGGINGFACE_API_TOKEN: get('HUGGINGFACE_API_TOKEN'),
    SUPABASE_URL: get('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: get('SUPABASE_SERVICE_KEY'),
    AI_SERVICE_URL: get('AI_SERVICE_URL', 'http://localhost:5000'),
  };
}

function mask(value) {
  if (!value) return '(missing)';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function runCheck(name, checkFn) {
  const started = Date.now();
  try {
    const result = await checkFn();
    const duration = Date.now() - started;
    console.log(`OK   ${name} (${duration}ms) - ${result}`);
    return true;
  } catch (error) {
    const duration = Date.now() - started;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${name} (${duration}ms) - ${message}`);
    return false;
  }
}

async function checkAiService(aiServiceUrl) {
  const candidates = [];
  candidates.push(aiServiceUrl);

  if (aiServiceUrl.includes('ai-service')) {
    candidates.push(aiServiceUrl.replace('ai-service', 'localhost'));
  }

  if (!candidates.some((u) => u.startsWith('http://localhost:5000'))) {
    candidates.push('http://localhost:5000');
  }

  for (const base of candidates) {
    const url = `${base.replace(/\/$/, '')}/api/health`;
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = await res.text();
      return `reachable at ${url} -> ${body}`;
    } catch {
      // Try next candidate
    }
  }

  throw new Error(`AI service health check failed for candidates: ${candidates.join(', ')}`);
}

async function main() {
  const cfg = getConfig();

  console.log('Healthcheck configuration');
  console.log(`- ELEVENLABS_API_KEY: ${mask(cfg.ELEVENLABS_API_KEY)}`);
  console.log(`- HUGGINGFACE_API_TOKEN: ${mask(cfg.HUGGINGFACE_API_TOKEN)}`);
  console.log(`- SUPABASE_URL: ${cfg.SUPABASE_URL || '(missing)'}`);
  console.log(`- SUPABASE_SERVICE_KEY: ${mask(cfg.SUPABASE_SERVICE_KEY)}`);
  console.log(`- AI_SERVICE_URL: ${cfg.AI_SERVICE_URL}`);
  console.log('');

  const results = [];

  results.push(await runCheck('AI Service', async () => {
    return await checkAiService(cfg.AI_SERVICE_URL);
  }));

  results.push(await runCheck('ElevenLabs API', async () => {
    if (!cfg.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY missing');
    const res = await fetchWithTimeout('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': cfg.ELEVENLABS_API_KEY,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return `authenticated as ${data?.subscription?.tier || 'unknown-tier'}`;
  }));

  results.push(await runCheck('Hugging Face API', async () => {
    if (!cfg.HUGGINGFACE_API_TOKEN) throw new Error('HUGGINGFACE_API_TOKEN missing');
    const res = await fetchWithTimeout('https://huggingface.co/api/whoami-v2', {
      headers: {
        Authorization: `Bearer ${cfg.HUGGINGFACE_API_TOKEN}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return `authenticated as ${data?.name || 'unknown-user'}`;
  }));

  results.push(await runCheck('Supabase REST', async () => {
    if (!cfg.SUPABASE_URL) throw new Error('SUPABASE_URL missing');
    if (!cfg.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY missing');

    const base = cfg.SUPABASE_URL.replace(/\/$/, '');
    const res = await fetchWithTimeout(`${base}/rest/v1/`, {
      headers: {
        apikey: cfg.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_SERVICE_KEY}`,
      },
    });

    if (res.status >= 500) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }

    return `reachable (${res.status})`;
  }));

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\nSummary: ${passed}/${total} checks passed.`);

  if (passed !== total) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Healthcheck failed unexpectedly:', error);
  process.exit(1);
});
