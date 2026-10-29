import fs from 'node:fs';
import path from 'node:path';
import { detectStack } from './detector.js';

export function composeReadme(projectDir = process.cwd(), options = {}) {
  const detected = detectStack(projectDir);
  const readmePath = path.join(projectDir, 'README.md');
  const port = detected.defaultPort || 3000;

  const badge = `[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-brightgreen?style=flat-square&logo=github)](https://github.com/Terrox0/runrepo)`;

  const quickstartBlock = `<!-- runrepo:start -->
## 🚀 Quickstart (1-Command Run)
${badge}

This repository is powered by [runrepo](https://github.com/Terrox0/runrepo). You can launch it immediately on any machine with zero manual configuration:

\`\`\`bash
# Option 1: Universal run script (Auto-checks .env & falls back to Docker if runtime is absent)
./run.sh

# Option 2: Force isolated Docker container
./run.sh --container

# Option 3: Zero-install CLI runner
npx runrepo run
\`\`\`

### Environment Details
- **Stack**: \`${detected.type.toUpperCase()}\` (${detected.framework !== 'unknown' ? detected.framework : 'Standard'})
- **Run Command**: \`${detected.runCommand}\`
- **Default Port**: \`http://localhost:${port}\`
${detected.extractedEnvVars.length > 0 ? `
### Environment Variables
Configure the following in your \`.env\` file (initialized from \`.env.example\`):

| Variable | Description | Default |
| :--- | :--- | :--- |
${detected.extractedEnvVars.map(v => `| \`${v}\` | Configures ${v.toLowerCase().replace(/_/g, ' ')} | \`your_${v.toLowerCase()}_here\` |`).join('\n')}
` : ''}
### Troubleshooting & Health Check
Run the pre-flight doctor to diagnose any missing files or port collisions:
\`\`\`bash
npx runrepo doctor
\`\`\`
<!-- runrepo:end -->`;

  let content = '';
  if (fs.existsSync(readmePath)) {
    const existing = fs.readFileSync(readmePath, 'utf8');
    if (existing.includes('<!-- runrepo:start -->')) {
      content = existing.replace(/<!-- runrepo:start -->[\s\S]*?<!-- runrepo:end -->/, quickstartBlock);
    } else {
      content = `${badge}\n\n${existing}\n\n${quickstartBlock}\n`;
    }
  } else {
    // Generate fresh README
    const projectName = path.basename(path.resolve(projectDir));
    content = `# ${projectName}

${badge}

> Auto-generated reproducible project layout built with [runrepo](https://github.com/Terrox0/runrepo).

${quickstartBlock}

## 🛠️ Architecture & Development
- **Devcontainer**: Open in VS Code with \`Remote - Containers: Reopen in Container\`
- **Container Build**: \`docker build -t ${projectName} .\`

## 📄 License
MIT
`;
  }

  fs.writeFileSync(readmePath, content, 'utf8');
  return { readmePath, detected };
}
