#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import { initProject, runDoctor, composeReadme, executeRun } from '../src/index.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

function printHelp() {
  console.log(`
  runrepo - Turn any messy codebase into a 1-command runnable repo.
  
  Usage:
    runrepo <command> [directory] [options]
    npx runrepo <command> [directory] [options]

  Commands:
    init [dir]      Auto-detect stack and synthesize Dockerfile, devcontainer,
                    run scripts, .env.example, and PR reproducibility action.
    doctor [dir]    Pre-flight audit for missing files, unmapped env vars,
                    port collisions, and host runtime readiness.
    run [dir]       Execute project instantly via native runtime or container.
    readme [dir]    Generate or inject 1-command runnable badge & quickstart.
    issue [dir]     Compose a sanitized Markdown diagnostic block for GitHub issues.

  Options:
    --container, -c Force containerized execution (for 'run')
    --force, -f     Overwrite existing files (for 'init')
    --json          Output structured JSON (for 'doctor')
    --issue         Format output as Markdown issue block (for 'doctor')
    --help, -h      Display this help menu
    --version, -v   Print version number

  Examples:
    $ npx runrepo init
    $ npx runrepo doctor
    $ ./run.sh
    $ npx runrepo run --container
`);
}

switch (command) {
  case 'init': {
    const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : process.cwd();
    const force = args.includes('--force') || args.includes('-f');
    initProject(targetDir, { force });
    break;
  }
  case 'doctor': {
    const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : process.cwd();
    const json = args.includes('--json');
    const issue = args.includes('--issue');
    const out = runDoctor(targetDir, { json, issue });
    console.log(out);
    break;
  }
  case 'run': {
    const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : process.cwd();
    const container = args.includes('--container') || args.includes('-c');
    executeRun(targetDir, { container });
    break;
  }
  case 'readme': {
    const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : process.cwd();
    const res = composeReadme(targetDir);
    console.log(`✓ README updated at: ${res.readmePath}`);
    break;
  }
  case 'issue': {
    const targetDir = args[1] && !args[1].startsWith('-') ? args[1] : process.cwd();
    const out = runDoctor(targetDir, { issue: true });
    console.log(out);
    break;
  }
  case '--version':
  case '-v':
  case 'version': {
    console.log('runrepo v0.1.0');
    break;
  }
  case 'help':
  case '--help':
  case '-h':
  default: {
    printHelp();
    break;
  }
}
