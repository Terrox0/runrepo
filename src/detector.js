import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan directory recursively up to a depth limit, ignoring node_modules, .git, etc.
 */
function walkFiles(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const entries = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith('.') && item.name !== '.env.example' && item.name !== '.devcontainer') continue;
      if (item.name === 'node_modules' || item.name === 'vendor' || item.name === '__pycache__' || item.name === 'target') continue;
      
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        entries.push(...walkFiles(fullPath, maxDepth, currentDepth + 1));
      } else {
        entries.push(fullPath);
      }
    }
  } catch {
    // Ignore unreadable dirs
  }
  return entries;
}

/**
 * Scan source files for environment variable references
 */
export function extractEnvVars(projectDir) {
  const envVars = new Set();
  const files = walkFiles(projectDir, 3);
  
  const jsTsRegex = /\bprocess\.env\.([A-Z0-9_]{2,})\b/g;
  const pyRegex = /\bos\.(?:environ\[['"]|getenv\(['"]|environ\.get\(['"])([A-Z0-9_]{2,})['"]/g;
  const goRegex = /\bos\.Getenv\(["']([A-Z0-9_]{2,})["']\)/g;
  const rustRegex = /\benv::var\(["']([A-Z0-9_]{2,})["']\)/g;

  for (const filePath of files) {
    const ext = path.extname(filePath);
    if (!['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs'].includes(ext)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      if (['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
        while ((match = jsTsRegex.exec(content)) !== null) envVars.add(match[1]);
      } else if (ext === '.py') {
        while ((match = pyRegex.exec(content)) !== null) envVars.add(match[1]);
      } else if (ext === '.go') {
        while ((match = goRegex.exec(content)) !== null) envVars.add(match[1]);
      } else if (ext === '.rs') {
        while ((match = rustRegex.exec(content)) !== null) envVars.add(match[1]);
      }
    } catch {
      // Ignore read errors
    }
  }

  // Filter out standard non-secret environment vars
  const standardIgnored = new Set(['NODE_ENV', 'PORT', 'HOST', 'PATH', 'HOME', 'USER']);
  return Array.from(envVars).filter(v => !standardIgnored.has(v)).sort();
}

/**
 * Primary Stack Detector
 */
export function detectStack(projectDir) {
  const exists = (f) => fs.existsSync(path.join(projectDir, f));
  const readJson = (f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(projectDir, f), 'utf8'));
    } catch {
      return null;
    }
  };

  const detected = {
    type: 'unknown',
    runtime: 'unknown',
    runtimeVersion: null,
    packageManager: 'unknown',
    framework: 'unknown',
    runCommand: 'echo "No run command configured"',
    buildCommand: null,
    defaultPort: 3000,
    hasDockerfile: exists('Dockerfile'),
    hasDevcontainer: exists('.devcontainer/devcontainer.json') || exists('.devcontainer.json'),
    hasEnvExample: exists('.env.example') || exists('.env.sample') || exists('.env.template'),
    hasEnv: exists('.env'),
    hasRunScript: exists('run.sh') || exists('run.bat'),
    extractedEnvVars: extractEnvVars(projectDir)
  };

  // 1. Docker Compose (multi-service)
  if (exists('docker-compose.yml') || exists('docker-compose.yaml') || exists('compose.yaml') || exists('compose.yml')) {
    detected.type = 'docker-compose';
    detected.runtime = 'docker';
    detected.packageManager = 'docker-compose';
    detected.runCommand = 'docker compose up --build';
    detected.defaultPort = 8080;
    return detected;
  }

  // 2. Node.js / TypeScript
  if (exists('package.json')) {
    detected.type = 'node';
    detected.runtime = 'node';
    detected.runtimeVersion = '20';
    const pkg = readJson('package.json') || {};

    // Detect package manager
    if (exists('bun.lockb') || exists('bun.lock')) detected.packageManager = 'bun';
    else if (exists('pnpm-lock.yaml')) detected.packageManager = 'pnpm';
    else if (exists('yarn.lock')) detected.packageManager = 'yarn';
    else detected.packageManager = 'npm';

    const pmRun = detected.packageManager === 'npm' ? 'npm run' : detected.packageManager;
    const scripts = pkg.scripts || {};

    // Detect framework & port
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (allDeps['next']) {
      detected.framework = 'Next.js';
      detected.defaultPort = 3000;
    } else if (allDeps['vite']) {
      detected.framework = 'Vite';
      detected.defaultPort = 5173;
    } else if (allDeps['express']) {
      detected.framework = 'Express';
      detected.defaultPort = 8080;
    } else if (allDeps['react-scripts']) {
      detected.framework = 'Create React App';
      detected.defaultPort = 3000;
    } else if (allDeps['fastify']) {
      detected.framework = 'Fastify';
      detected.defaultPort = 3000;
    } else if (allDeps['nuxt']) {
      detected.framework = 'Nuxt';
      detected.defaultPort = 3000;
    } else if (allDeps['astro']) {
      detected.framework = 'Astro';
      detected.defaultPort = 4321;
    }

    if (scripts.dev) {
      detected.runCommand = `${pmRun} dev`;
    } else if (scripts.start) {
      detected.runCommand = `${pmRun} start`;
    } else if (scripts.serve) {
      detected.runCommand = `${pmRun} serve`;
    } else if (pkg.main && exists(pkg.main)) {
      detected.runCommand = `node ${pkg.main}`;
    } else if (exists('index.js')) {
      detected.runCommand = 'node index.js';
    } else if (exists('server.js')) {
      detected.runCommand = 'node server.js';
    } else {
      detected.runCommand = `${detected.packageManager} start`;
    }

    if (scripts.build) {
      detected.buildCommand = `${pmRun} build`;
    }

    return detected;
  }

  // 3. Python
  if (exists('requirements.txt') || exists('pyproject.toml') || exists('Pipfile') || exists('setup.py')) {
    detected.type = 'python';
    detected.runtime = 'python';
    detected.runtimeVersion = '3.11';
    detected.defaultPort = 8000;

    let reqsContent = '';
    if (exists('requirements.txt')) {
      try { reqsContent = fs.readFileSync(path.join(projectDir, 'requirements.txt'), 'utf8').toLowerCase(); } catch {}
    }

    if (exists('poetry.lock') || (exists('pyproject.toml') && reqsContent.includes('poetry'))) {
      detected.packageManager = 'poetry';
      detected.runCommand = 'poetry run python main.py';
    } else if (exists('Pipfile')) {
      detected.packageManager = 'pipenv';
      detected.runCommand = 'pipenv run python main.py';
    } else {
      detected.packageManager = 'pip';
      detected.runCommand = 'python main.py';
    }

    if (reqsContent.includes('fastapi') || reqsContent.includes('uvicorn')) {
      detected.framework = 'FastAPI';
      detected.runCommand = 'uvicorn main:app --reload --host 0.0.0.0 --port 8000';
    } else if (reqsContent.includes('django')) {
      detected.framework = 'Django';
      detected.runCommand = 'python manage.py runserver 0.0.0.0:8000';
    } else if (reqsContent.includes('flask')) {
      detected.framework = 'Flask';
      detected.defaultPort = 5000;
      detected.runCommand = 'flask run --host=0.0.0.0 --port=5000';
    } else if (exists('app.py')) {
      detected.runCommand = 'python app.py';
    } else if (exists('server.py')) {
      detected.runCommand = 'python server.py';
    }

    return detected;
  }

  // 4. Go
  if (exists('go.mod') || exists('main.go')) {
    detected.type = 'go';
    detected.runtime = 'go';
    detected.runtimeVersion = '1.22';
    detected.packageManager = 'go';
    detected.defaultPort = 8080;
    detected.runCommand = 'go run .';
    return detected;
  }

  // 5. Rust
  if (exists('Cargo.toml')) {
    detected.type = 'rust';
    detected.runtime = 'rust';
    detected.runtimeVersion = 'latest';
    detected.packageManager = 'cargo';
    detected.defaultPort = 8080;
    detected.runCommand = 'cargo run';
    return detected;
  }

  // 6. Static HTML
  if (exists('index.html')) {
    detected.type = 'static-web';
    detected.runtime = 'html';
    detected.packageManager = 'none';
    detected.defaultPort = 8080;
    detected.runCommand = 'npx serve .';
    return detected;
  }

  return detected;
}
