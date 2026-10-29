import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectStack, extractEnvVars } from '../src/detector.js';
import { initProject } from '../src/index.js';
import { runDoctor } from '../src/doctor.js';

test('detectStack identifies Node Express correctly', () => {
  const dir = path.resolve('examples/node-express-sample');
  const detected = detectStack(dir);
  assert.equal(detected.type, 'node');
  assert.equal(detected.framework, 'Express');
  assert.equal(detected.packageManager, 'npm');
  assert.equal(detected.defaultPort, 8080);
});

test('detectStack identifies Python FastAPI correctly', () => {
  const dir = path.resolve('examples/python-fastapi-sample');
  const detected = detectStack(dir);
  assert.equal(detected.type, 'python');
  assert.equal(detected.framework, 'FastAPI');
  assert.equal(detected.packageManager, 'pip');
  assert.equal(detected.defaultPort, 8000);
});

test('extractEnvVars extracts variables from codebase', () => {
  const dir = path.resolve('examples/node-express-sample');
  const vars = extractEnvVars(dir);
  assert.ok(vars.includes('DATABASE_URL'));
  assert.ok(vars.includes('SESSION_SECRET'));
});

test('initProject generates all required artifacts in temp directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runrepo-test-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'temp-app',
      scripts: { dev: 'node app.js' }
    }));
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'const key = process.env.SECRET_TOKEN;');

    const res = initProject(tmpDir);
    assert.ok(fs.existsSync(path.join(tmpDir, 'Dockerfile')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.devcontainer', 'devcontainer.json')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'run.sh')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'run.bat')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.env.example')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'workflows', 'verify-reproducibility.yml')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'README.md')));

    const doctorReport = JSON.parse(runDoctor(tmpDir, { json: true }));
    assert.equal(doctorReport.stack.type, 'node');
    assert.ok(doctorReport.checks.length > 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
