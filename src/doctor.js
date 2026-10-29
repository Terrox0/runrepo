import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { detectStack } from './detector.js';

function checkCommand(cmd) {
  try {
    const out = execSync(`${cmd} --version`, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' });
    return out.trim().split('\n')[0];
  } catch {
    return null;
  }
}

export function runDoctor(projectDir = process.cwd(), options = {}) {
  const detected = detectStack(projectDir);
  const exists = (f) => fs.existsSync(path.join(projectDir, f));

  const checks = [];

  // Check 1: Runtime toolchain availability
  const runtimeCmd = detected.runtime === 'node' ? 'node' :
                     detected.runtime === 'python' ? (os.platform() === 'win32' ? 'python' : 'python3') :
                     detected.runtime === 'go' ? 'go' :
                     detected.runtime === 'rust' ? 'cargo' : null;
  
  const runtimeVersion = runtimeCmd ? checkCommand(runtimeCmd) : null;
  checks.push({
    name: `Native Runtime (${detected.runtime})`,
    pass: !!runtimeVersion,
    detail: runtimeVersion ? `Found ${runtimeVersion}` : `Not found on host PATH. Container fallback required.`
  });

  // Check 2: Docker availability
  const dockerVersion = checkCommand('docker');
  checks.push({
    name: 'Container Engine (Docker)',
    pass: !!dockerVersion,
    detail: dockerVersion ? `Found ${dockerVersion}` : 'Not found. Native execution only.'
  });

  // Check 3: Reproducibility Artifacts
  checks.push({
    name: 'Universal Run Script (run.sh / run.bat)',
    pass: exists('run.sh') || exists('run.bat'),
    detail: exists('run.sh') ? 'run.sh exists' : 'Missing. Run `runrepo init` to generate.'
  });

  checks.push({
    name: 'Containerization (Dockerfile)',
    pass: exists('Dockerfile'),
    detail: exists('Dockerfile') ? 'Dockerfile exists' : 'Missing. Run `runrepo init` to generate.'
  });

  // Check 4: Environment Variables Template
  const hasEnv = exists('.env');
  const hasEnvExample = exists('.env.example') || exists('.env.sample');
  checks.push({
    name: 'Environment Configuration (.env / .env.example)',
    pass: hasEnv || hasEnvExample,
    detail: hasEnv ? '.env is present' : (hasEnvExample ? '.env.example template present (run.sh will copy on boot)' : 'No .env or .env.example found.')
  });

  // Check 5: Codebase Referenced Env Vars vs .env
  let unmappedVars = [];
  if (detected.extractedEnvVars.length > 0) {
    let definedVars = new Set();
    const envPath = hasEnv ? path.join(projectDir, '.env') : (hasEnvExample ? path.join(projectDir, '.env.example') : null);
    if (envPath) {
      try {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const key = trimmed.split('=')[0].trim();
            definedVars.add(key);
          }
        }
      } catch {}
    }
    unmappedVars = detected.extractedEnvVars.filter(v => !definedVars.has(v));
  }

  checks.push({
    name: 'Variable Audit (Code vs Template)',
    pass: unmappedVars.length === 0,
    detail: unmappedVars.length === 0 ? 
      `All ${detected.extractedEnvVars.length} detected code variables are mapped in template.` :
      `Unmapped variables found in code: ${unmappedVars.join(', ')}`
  });

  const hasExecutionEngine = !!runtimeVersion || !!dockerVersion;
  const criticalChecks = checks.filter(c => !c.name.includes('Docker') && !c.name.includes('Native Runtime'));
  const allPass = hasExecutionEngine && criticalChecks.every(c => c.pass);

  const report = {
    projectDir: path.resolve(projectDir),
    timestamp: new Date().toISOString(),
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    stack: detected,
    checks,
    allPass,
    unmappedVars
  };

  if (options.json) {
    return JSON.stringify(report, null, 2);
  }

  if (options.issue) {
    return formatIssueMarkdown(report);
  }

  return formatTerminalOutput(report);
}

function formatTerminalOutput(report) {
  let out = '\n======================================================\n';
  out += '  runrepo doctor -- Pre-flight Environment Diagnostic\n';
  out += '======================================================\n\n';
  out += `  Stack:     ${report.stack.type.toUpperCase()} (${report.stack.framework !== 'unknown' ? report.stack.framework : 'Standard'})\n`;
  out += `  Command:   ${report.stack.runCommand}\n`;
  out += `  Port:      ${report.stack.defaultPort}\n`;
  out += `  Host OS:   ${report.os}\n\n`;
  out += '------------------------------------------------------\n';
  out += '  Health Checks:\n';
  out += '------------------------------------------------------\n';

  for (const c of report.checks) {
    const symbol = c.pass ? '✓' : '✗';
    const tag = c.pass ? '[PASS]' : '[WARN]';
    out += `  ${symbol} ${tag} ${c.name}\n      ↳ ${c.detail}\n`;
  }

  out += '\n------------------------------------------------------\n';
  if (report.allPass) {
    out += '  STATUS: [READY] This repository is 100% reproducible.\n';
    out += '  Run `./run.sh` or `npx runrepo run` to launch.\n';
  } else {
    out += '  STATUS: [ATTENTION NEEDED] Run `npx runrepo init` to fix.\n';
  }
  out += '======================================================\n';
  return out;
}

function formatIssueMarkdown(report) {
  return `### \`runrepo\` Diagnostics Report
*Generated automatically by [runrepo](https://github.com/Terrox0/runrepo)*

| Property | Value |
| :--- | :--- |
| **Operating System** | \`${report.os}\` |
| **Detected Runtime** | \`${report.stack.runtime}\` |
| **Inferred Framework** | \`${report.stack.framework}\` |
| **Default Run Command** | \`${report.stack.runCommand}\` |
| **Port** | \`${report.stack.defaultPort}\` |
| **Timestamp** | \`${report.timestamp}\` |

#### Pre-flight Health Checks
${report.checks.map(c => `- [${c.pass ? 'x' : ' '}] **${c.name}**: ${c.detail}`).join('\n')}

${report.unmappedVars.length > 0 ? `\n> [!WARNING]\n> The following variables were discovered in source files but missing in templates: \`${report.unmappedVars.join('`, `')}\`` : ''}
`;
}
