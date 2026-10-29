import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { detectStack } from './detector.js';
import {
  generateDockerfile,
  generateDevcontainer,
  generateRunSh,
  generateRunBat,
  generateEnvExample,
  generateWorkflow
} from './generator.js';
import { runDoctor } from './doctor.js';
import { composeReadme } from './composer.js';

export function initProject(projectDir = process.cwd(), options = {}) {
  const dir = path.resolve(projectDir);
  const detected = detectStack(dir);

  console.log(`\n[runrepo] Inspecting directory: ${dir}`);
  console.log(`[runrepo] Detected Stack: ${detected.type.toUpperCase()} (${detected.framework !== 'unknown' ? detected.framework : 'Standard'})`);
  console.log(`[runrepo] Package Manager: ${detected.packageManager}`);
  console.log(`[runrepo] Default Command: ${detected.runCommand}`);
  console.log(`[runrepo] Default Port:    ${detected.defaultPort}\n`);

  const createdFiles = [];

  // 1. Dockerfile
  const dockerfilePath = path.join(dir, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath) || options.force) {
    fs.writeFileSync(dockerfilePath, generateDockerfile(detected), 'utf8');
    createdFiles.push('Dockerfile');
  }

  // 2. .devcontainer/devcontainer.json
  const devcontainerDir = path.join(dir, '.devcontainer');
  if (!fs.existsSync(devcontainerDir)) fs.mkdirSync(devcontainerDir, { recursive: true });
  const devcontainerPath = path.join(devcontainerDir, 'devcontainer.json');
  if (!fs.existsSync(devcontainerPath) || options.force) {
    fs.writeFileSync(devcontainerPath, generateDevcontainer(detected), 'utf8');
    createdFiles.push('.devcontainer/devcontainer.json');
  }

  // 3. run.sh
  const runShPath = path.join(dir, 'run.sh');
  if (!fs.existsSync(runShPath) || options.force) {
    fs.writeFileSync(runShPath, generateRunSh(detected), 'utf8');
    try { fs.chmodSync(runShPath, 0o755); } catch {}
    createdFiles.push('run.sh');
  }

  // 4. run.bat
  const runBatPath = path.join(dir, 'run.bat');
  if (!fs.existsSync(runBatPath) || options.force) {
    fs.writeFileSync(runBatPath, generateRunBat(detected), 'utf8');
    createdFiles.push('run.bat');
  }

  // 5. .env.example (if missing and vars detected)
  const envExamplePath = path.join(dir, '.env.example');
  if (!fs.existsSync(envExamplePath) && !fs.existsSync(path.join(dir, '.env.sample'))) {
    fs.writeFileSync(envExamplePath, generateEnvExample(detected.extractedEnvVars), 'utf8');
    createdFiles.push('.env.example');
  }

  // 6. GitHub Action: verify-reproducibility.yml
  const workflowsDir = path.join(dir, '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) fs.mkdirSync(workflowsDir, { recursive: true });
  const workflowPath = path.join(workflowsDir, 'verify-reproducibility.yml');
  if (!fs.existsSync(workflowPath) || options.force) {
    fs.writeFileSync(workflowPath, generateWorkflow(detected), 'utf8');
    createdFiles.push('.github/workflows/verify-reproducibility.yml');
  }

  // 7. Compose / update README.md
  composeReadme(dir, options);
  createdFiles.push('README.md (updated with 1-command badge & quickstart)');

  console.log('✓ Successfully initialized reproducibility layer:');
  for (const f of createdFiles) {
    console.log(`  + ${f}`);
  }
  console.log('\nReady! Run `./run.sh` or `npx runrepo run` to boot this project instantly.\n');

  return { detected, createdFiles };
}

export function executeRun(projectDir = process.cwd(), options = {}) {
  const dir = path.resolve(projectDir);
  const detected = detectStack(dir);

  if (options.container) {
    console.log(`[runrepo] Booting in isolated Docker container (Port ${detected.defaultPort})...`);
    execSync(`docker build -t runrepo-local . && docker run -it --rm -p ${detected.defaultPort}:${detected.defaultPort} -v "${dir}:/app" runrepo-local`, {
      cwd: dir,
      stdio: 'inherit'
    });
    return;
  }

  // Native execution with auto-fallback
  console.log(`[runrepo] Executing: ${detected.runCommand}`);
  try {
    execSync(detected.runCommand, { cwd: dir, stdio: 'inherit' });
  } catch (err) {
    console.warn('\n[runrepo] Native execution failed. Attempting Docker fallback...');
    execSync(`docker build -t runrepo-local . && docker run -it --rm -p ${detected.defaultPort}:${detected.defaultPort} -v "${dir}:/app" runrepo-local`, {
      cwd: dir,
      stdio: 'inherit'
    });
  }
}

export { detectStack, runDoctor, composeReadme };
