# node-express-sample

[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-brightgreen?style=flat-square&logo=github)](https://github.com/Terrox0/runrepo)

> Auto-generated reproducible project layout built with [runrepo](https://github.com/Terrox0/runrepo).

<!-- runrepo:start -->
## 🚀 Quickstart (1-Command Run)
[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-brightgreen?style=flat-square&logo=github)](https://github.com/Terrox0/runrepo)

This repository is powered by [runrepo](https://github.com/Terrox0/runrepo). You can launch it immediately on any machine with zero manual configuration:

```bash
# Option 1: Universal run script (Auto-checks .env & falls back to Docker if runtime is absent)
./run.sh

# Option 2: Force isolated Docker container
./run.sh --container

# Option 3: Zero-install CLI runner
npx runrepo run
```

### Environment Details
- **Stack**: `NODE` (Express)
- **Run Command**: `npm run dev`
- **Default Port**: `http://localhost:8080`

### Environment Variables
Configure the following in your `.env` file (initialized from `.env.example`):

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Configures database url | `your_database_url_here` |
| `SESSION_SECRET` | Configures session secret | `your_session_secret_here` |

### Troubleshooting & Health Check
Run the pre-flight doctor to diagnose any missing files or port collisions:
```bash
npx runrepo doctor
```
<!-- runrepo:end -->

## 🛠️ Architecture & Development
- **Devcontainer**: Open in VS Code with `Remote - Containers: Reopen in Container`
- **Container Build**: `docker build -t node-express-sample .`

## 📄 License
MIT
