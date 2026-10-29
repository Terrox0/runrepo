import fs from 'node:fs';
import path from 'node:path';
import { detectStack } from './detector.js';

export function composeReadme(projectDir = process.cwd(), options = {}) {
  const detected = detectStack(projectDir);
  const readmePath = path.join(projectDir, 'README.md');
  const port = detected.defaultPort || 3000;

  const badge = `[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-2ea44f?logo=github)](https://github.com/Terrox0/runrepo)`;

  const quickstartBlock = `<!-- runrepo:start -->
## Quickstart (1-Command Run)
${badge}

This repository is configured with [runrepo](https://github.com/Terrox0/runrepo). You can launch it with one command:

\`\`\`bash
# Native host execution (auto-copies .env if missing, falls back to Docker if runtime is absent)
./run.sh

# Or force containerized execution
./run.sh --container

# Or zero-install CLI runner
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
### Troubleshooting
Run the pre-flight doctor to diagnose any missing files, unmapped variables, or port collisions:
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

${quickstartBlock}

## Development
- **Devcontainer**: Open in VS Code using \`Remote - Containers: Reopen in Container\`
- **Container Build**: \`docker build -t ${projectName} .\`

## License
MIT
`;
  }

  fs.writeFileSync(readmePath, content, 'utf8');
  return { readmePath, detected };
}
