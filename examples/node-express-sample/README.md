# node-express-sample

[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-2ea44f?logo=github)](https://github.com/Terrox0/runrepo)

<!-- runrepo:start -->
## Quickstart (1-Command Run)
[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20run-2ea44f?logo=github)](https://github.com/Terrox0/runrepo)

This repository is configured with [runrepo](https://github.com/Terrox0/runrepo). You can launch it with one command:

```bash
# Native host execution (auto-copies .env if missing, falls back to Docker if runtime is absent)
./run.sh

# Or force containerized execution
./run.sh --container

# Or zero-install CLI runner
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

### Troubleshooting
Run the pre-flight doctor to diagnose any missing files, unmapped variables, or port collisions:
```bash
npx runrepo doctor
```
<!-- runrepo:end -->

## Development
- **Devcontainer**: Open in VS Code using `Remote - Containers: Reopen in Container`
- **Container Build**: `docker build -t node-express-sample .`

## License
MIT
