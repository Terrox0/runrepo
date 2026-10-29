# runrepo 🚀

> **Turn any messy codebase into a 1-command runnable repo.**  
> Stop wasting hours fixing broken environments, missing `.env` files, and outdated docs.

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue?style=flat-square&logo=npm)](https://www.npmjs.com/package/runrepo)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](#architecture)
[![runrepo: 1-command](https://img.shields.io/badge/runrepo-1--command%20runnable-brightgreen?style=flat-square&logo=github)](#quickstart)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](docs/CONTRIBUTING.md)

---

## The Problem: The "Clone & Pray" Nightmare

Every developer, student, and open-source contributor knows the feeling:

> *"It just doesn't work. Broken env, missing files, zero docs, and you end up spending hours digging through messy code just to make it run."*  
> *"I got tired of opening 10 tabs just to understand one repo..."*  
> *"I kept ending up with rough notes that were too vague to become useful issues..."*

```
BEFORE runrepo:
  git clone https://github.com/user/project
  npm start               ──► Error: Node version incompatible
  docker-compose up       ──► Error: Missing .env variable 'API_SECRET'
  python main.py          ──► Error: ModuleNotFoundError: 'uvicorn'
  (2 hours spent opening 10 browser tabs and reading broken setup guides)

AFTER runrepo:
  npx runrepo init        ──► Auto-detects runtime, writes Dockerfile, devcontainer,
                              run scripts, .env.example, and README badge.
  ./run.sh                ──► Boots cleanly in 1 command anywhere.
```

---

## ⚡ Quickstart

### 1. Make Any Repo Runnable in 30 Seconds
Run this inside any repository (Node, Python, Go, Rust, or Docker):

```bash
# Auto-detects stack and generates the complete reproducibility suite
npx runrepo init
```

### 2. Run Pre-flight Diagnostics
Audit your environment for missing files, port collisions, or unmapped `.env` secrets:

```bash
npx runrepo doctor
```

### 3. Launch with One Command
Execute natively on your host with automatic fallback to an isolated container:

```bash
# Universal POSIX runner (auto-copies .env if missing)
./run.sh

# Or force containerized execution
./run.sh --container

# Or zero-install CLI runner
npx runrepo run
```

---

## 🌟 Key Features

### 1. 🔍 AST & Manifest Stack Detection
Zero manual configuration. `runrepo` inspects your directory manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `compose.yaml`) and source code ASTs to infer:
- Exact language, runtime version, and package manager.
- Default dev and start scripts (`npm run dev`, `uvicorn`, `go run`, `cargo run`).
- Default server ports (`3000`, `5173`, `8000`, `8080`).

### 2. 🐳 Automated Devcontainer & Dockerfile Generation
Generates lightweight, multi-stage, layer-cached `Dockerfile`s and `.devcontainer/devcontainer.json` compatible with:
- **VS Code Remote Containers**
- **GitHub Codespaces**
- **Docker Desktop & Podman**

### 3. 🛡️ The Repo Doctor (`runrepo doctor`)
No more silent crashes:
- **Variable Audit**: Scans code for `process.env.*`, `os.environ[*]`, `os.getenv(*)`, and verifies they are mapped in `.env.example`.
- **Port Conflict Check**: Detects occupied ports before launching and suggests free ports.
- **Runtime Verification**: Checks whether native compilers/interpreters exist on the host PATH.

### 4. 📝 Structured Issue Composer (`runrepo issue`)
Turns vague bug reports into crisp, actionable GitHub issues. Running `runrepo issue` outputs a privacy-redacted diagnostic block containing OS specs, runtime versions, stack metadata, and health check pass/fails ready to paste directly into GitHub Issues.

### 5. 🏷️ Automated README & Badge Composer (`runrepo readme`)
Injects a verified `1-command runnable` badge and standardized quickstart block into your `README.md`, giving new contributors instant clarity.

### 6. 🚦 CI Reproducibility Gate (GitHub Action)
Generates `.github/workflows/verify-reproducibility.yml` to automatically test Docker builds and environment templates on incoming PRs.

---

## 📊 Supported Ecosystems

| Ecosystem | Detected Manifests | Package Managers | Default Frameworks |
| :--- | :--- | :--- | :--- |
| **Node.js / TypeScript** | `package.json`, lockfiles | `npm`, `pnpm`, `yarn`, `bun` | Next.js, Vite, Express, Fastify, Nuxt, Astro |
| **Python** | `requirements.txt`, `pyproject.toml`, `Pipfile` | `pip`, `poetry`, `pipenv`, `uv` | FastAPI, Flask, Django |
| **Go** | `go.mod`, `main.go` | `go` | Standard Library, Gin, Fiber |
| **Rust** | `Cargo.toml`, `Cargo.lock` | `cargo` | Actix, Axum, Tokio |
| **Containers** | `docker-compose.yml`, `compose.yaml` | `docker-compose` | Multi-service stacks |
| **Static Web** | `index.html` | None | Pure HTML/CSS/JS with zero-config preview |

---

## 💻 CLI Commands & Options

```text
runrepo <command> [directory] [options]

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
  --help, -h      Display help menu
  --version, -v   Print version number
```

---

## 🛠️ Architecture & Philosophy

- **Zero Runtime Dependencies**: Written entirely in vanilla Node.js ES modules using standard libraries (`node:fs`, `node:path`, `node:child_process`, `node:os`).
- **Non-Destructive**: Never overwrites existing configs without explicit `--force`.
- **Privacy-First**: Environment secret values are stripped and redacted before generating diagnostic reports.
- Read more in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📄 Documentation Links
- [Detailed Architecture & Flowcharts](docs/ARCHITECTURE.md)
- [Complete CLI Reference](docs/CLI_REFERENCE.md)
- [Research Note 01: Stack Detection Heuristics](research/01_stack_detection_heuristics.md)
- [Research Note 02: Reproducibility Benchmarks](research/02_reproducibility_benchmarks.md)
- [Research Note 03: Structured Issue Intake](research/03_issue_intake_and_diagnostics.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

---

## 📜 License

[MIT License](LICENSE) © 2026 [Terrox0](https://github.com/Terrox0)
