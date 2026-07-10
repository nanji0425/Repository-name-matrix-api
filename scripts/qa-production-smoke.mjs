import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const outputDir = join(rootDir, 'output', 'runtime');
const args = new Set(process.argv.slice(2));
const continueOnFail = process.env.SMOKE_CONTINUE_ON_FAIL === '1' || args.has('--continue-on-fail');
const includeFullSuite = process.env.SMOKE_FULL === '1' || args.has('--full');
const delayMs = Number(process.env.SMOKE_DELAY_MS || 2500);
const heavyDelayMs = Number(process.env.SMOKE_HEAVY_DELAY_MS || 9000);
const scriptTimeoutMs = Number(process.env.SMOKE_SCRIPT_TIMEOUT_MS || 240000);

const defaultSuite = [
  { script: 'qa-production-runtime.mjs', delayAfterMs: delayMs },
  { script: 'qa-launch-assets.mjs', delayAfterMs: delayMs },
  { script: 'qa-production-security.mjs', delayAfterMs: delayMs },
  { script: 'qa-public-route-audit.mjs', delayAfterMs: delayMs },
  { script: 'qa-topup-price.mjs', delayAfterMs: delayMs },
  { script: 'qa-admin-account.mjs', delayAfterMs: heavyDelayMs },
  { script: 'qa-admin-backend-coverage.mjs', delayAfterMs: heavyDelayMs },
];

const fullSuite = [
  { script: 'qa-visual-responsive.mjs', delayAfterMs: delayMs },
  { script: 'qa-click-audit.mjs', delayAfterMs: delayMs },
  { script: 'qa-admin-operation-audit.mjs', delayAfterMs: heavyDelayMs },
];

function printHelp() {
  console.log(`MatrixAPI production smoke runner

Usage:
  node scripts/qa-production-smoke.mjs [options]
  npm run qa:production-smoke -- [options]

Options:
  --help              Show this help text without running checks.
  --list              Show the selected suite without running checks.
  --full              Include slower visual, click, and admin operation checks.
  --continue-on-fail  Run remaining checks after a failure.

Environment:
  SMOKE_FULL=1
  SMOKE_CONTINUE_ON_FAIL=1
  SMOKE_DELAY_MS=2500
  SMOKE_HEAVY_DELAY_MS=9000
  SMOKE_SCRIPT_TIMEOUT_MS=240000
`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tail(text, max = 5000) {
  const normalized = String(text || '').replace(/\r\n/g, '\n');
  return normalized.length > max ? normalized.slice(-max) : normalized;
}

function redact(text) {
  return String(text || '')
    .replace(/(password|token|session|key|secret|authorization)["':=\s]+[A-Za-z0-9._~+/@-]{8,}/gi, '$1=[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]{12,}/gi, 'Bearer [REDACTED]');
}

function runScript(script) {
  const startedAt = Date.now();
  const scriptPath = join(rootDir, 'scripts', script);
  const result = {
    script,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: 0,
    exitCode: null,
    signal: null,
    timedOut: false,
    stdoutTail: '',
    stderrTail: '',
  };

  if (!existsSync(scriptPath)) {
    return Promise.resolve({
      ...result,
      durationMs: 0,
      exitCode: 1,
      stderrTail: `Missing script: ${scriptPath}`,
    });
  }

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      env: {
        ...process.env,
        MATRIXAPI_QA_PARENT: 'production-smoke',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      result.timedOut = true;
      child.kill('SIGTERM');
    }, scriptTimeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      result.durationMs = Date.now() - startedAt;
      result.exitCode = code;
      result.signal = signal;
      result.stdoutTail = tail(redact(stdout));
      result.stderrTail = tail(redact(stderr));
      resolve(result);
    });
  });
}

mkdirSync(outputDir, { recursive: true });

const suite = includeFullSuite ? [...defaultSuite, ...fullSuite] : defaultSuite;

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

if (args.has('--list')) {
  console.log(JSON.stringify({
    mode: includeFullSuite ? 'full' : 'default',
    scripts: suite.map((item) => item.script),
  }, null, 2));
  process.exit(0);
}

const report = {
  checkedAt: new Date().toISOString(),
  mode: includeFullSuite ? 'full' : 'default',
  continueOnFail,
  delayMs,
  heavyDelayMs,
  scriptTimeoutMs,
  results: [],
  failures: [],
};

for (const item of suite) {
  console.log(`[smoke] running ${item.script}`);
  const result = await runScript(item.script);
  report.results.push(result);

  const failed = result.exitCode !== 0 || result.signal || result.timedOut;
  if (failed) {
    const reason = `${item.script} failed with exitCode=${result.exitCode} signal=${result.signal || 'none'} timedOut=${result.timedOut}`;
    report.failures.push(reason);
    console.error(`[smoke] ${reason}`);
    if (!continueOnFail) break;
  } else {
    console.log(`[smoke] passed ${item.script} in ${Math.round(result.durationMs / 1000)}s`);
  }

  if (item.delayAfterMs > 0 && item !== suite.at(-1)) {
    await sleep(item.delayAfterMs);
  }
}

report.completedAt = new Date().toISOString();
writeFileSync(join(outputDir, 'qa-production-smoke-report.json'), JSON.stringify(report, null, 2));

if (report.failures.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
