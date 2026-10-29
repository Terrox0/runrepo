# runrepo

Zero-config CLI that turns messy codebases into one-command runnable repositories.

[![npm version](https://img.shields.io/npm/v/runrepo.svg)](https://www.npmjs.com/package/runrepo)
[![license](https://img.shields.io/github/license/Terrox0/runrepo)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-2ea44f)](#design-principles)
[![tests](https://github.com/Terrox0/runrepo/actions/workflows/test.yml/badge.svg)](https://github.com/Terrox0/runrepo/actions)

---

Getting someone else's repository to run for the first time is often frustrating: undocumented native build tools, missing `.env` templates, port collisions, or mismatched runtime versions.

`runrepo` inspects an arbitrary codebase, detects its runtime and package manager, and generates the missing onboarding scaffolding:

- **Universal runner (`./run.sh` / `./run.bat`)**: Boots natively if your host has the required tools; automatically falls back to Docker if it doesn't.
- **Tested dev environment**: Lean `Dockerfile` and `.devcontainer/devcontainer.json` tailored to your detected framework.
- **Static `.env.example` generator**: Parses source code for `process.env`, `os.environ`, and `os.getenv` so secret dependencies are never missed.
- **Pre-flight doctor (`runrepo doctor`)**: Audits environment variables, ports, and host compilers before you hit startup errors.
- **Structured issue intake (`runrepo issue`)**: Dumps sanitized, copy-pasteable Markdown diagnostics to eliminate vague *"it doesn't work"* bug reports.
- **CI reproducibility gate**: A GitHub Action workflow that verifies your dev environment builds reproducibly on every PR.

---

## Quickstart

Run inside any project directory (Node, Python, Go, Rust, or Docker):

```bash
# 1. Inspect codebase and generate reproducibility suite
npx runrepo init

# 2. Verify environment readiness
npx runrepo doctor

# 3. Launch project
./run.sh
```

To install globally:

```bash
npm install -g runrepo
```

---

## What It Looks Like

```console
$ npx runrepo init

[runrepo] Inspecting: /home/alex/projects/acme-api
[runrepo] Detected stack: NODE (Express) via npm
[runrepo] Default port: 8080
[runrepo] Discovered 2 environment variables in source: DATABASE_URL, SESSION_SECRET

✓ Initialized reproducibility layer:
  + Dockerfile
  + .devcontainer/devcontainer.json
  + run.sh (chmod +x)
  + run.bat
  + .env.example
  + .github/workflows/verify-reproducibility.yml
  + README.md (injected 1-command quickstart)

Ready to boot:
  $ ./run.sh
```

---

## How It Works

### 1. Dual-Tier Run Architecture (`./run.sh`)
Rather than forcing everyone to install Docker or install local compilers, `runrepo` generates a dual-tier POSIX script:
1. **Tier 1 (Host Fast-Path)**: Checks if the required language runtime is on `$PATH`. If present, verifies `.env` exists (copying from `.env.example` if needed) and runs the native command directly.
2. **Tier 2 (Container Fallback)**: If native toolchains are missing or fail, it seamlessly drops into an isolated Docker container with port forwarding and volume mounts.

Pass `--container` or `-c` anytime to force containerized execution:
```bash
./run.sh --container
```

### 2. Static Environment Variable Extraction
Silent runtime crashes usually trace back to unconfigured environment variables. `runrepo` statically analyzes your codebase to identify referenced keys without executing untrusted code:
- JavaScript / TypeScript: `process.env.VAR_NAME`
- Python: `os.environ["VAR_NAME"]`, `os.getenv("VAR_NAME")`
- Go: `os.Getenv("VAR_NAME")`
- Rust: `env::var("VAR_NAME")`

If `.env.example` does not exist, `runrepo` generates one pre-populated with all detected keys and placeholder values.

### 3. Pre-Flight Health Check (`runrepo doctor`)
Run `runrepo doctor` to check repository readiness before launching:

```console
$ npx runrepo doctor

======================================================
  runrepo doctor -- Pre-flight Environment Diagnostic
======================================================

  Stack:     NODE (Express)
  Command:   npm run dev
  Port:      8080
  Host OS:   Linux 6.8.0-45-generic (x64)

------------------------------------------------------
  Health Checks:
------------------------------------------------------
  ✓ [PASS] Native Runtime (node)
      ↳ Found v20.18.0
  ✓ [PASS] Container Engine (Docker)
      ↳ Found Docker version 27.3.1
  ✓ [PASS] Universal Run Script (run.sh / run.bat)
      ↳ run.sh exists
  ✓ [PASS] Containerization (Dockerfile)
      ↳ Dockerfile exists
  ✓ [PASS] Environment Configuration (.env / .env.example)
      ↳ .env is present
  ✓ [PASS] Variable Audit (Code vs Template)
      ↳ All 2 detected code variables are mapped in template.

------------------------------------------------------
  STATUS: [READY] This repository is 100% reproducible.
  Run `./run.sh` or `npx runrepo run` to launch.
======================================================
```

Use `--json` for automation and CI, or `--issue` to format as GitHub-ready Markdown.

### 4. Structured Issue Intake (`runrepo issue`)
When contributors run into setup issues, they often submit vague reports lacking system context. Running `runrepo issue` generates a sanitized markdown block:

```console
$ npx runrepo issue
```

```markdown
### `runrepo` Diagnostics Report

| Property | Value |
| :--- | :--- |
| **Operating System** | `Linux 6.8.0-45-generic (x64)` |
| **Detected Runtime** | `node` (v20.18.0) |
| **Inferred Framework** | `Express` |
| **Default Run Command** | `npm run dev` |
| **Port** | `8080` |

#### Pre-flight Health Checks
- [x] **Native Runtime (node)**: Found v20.18.0
- [x] **Container Engine (Docker)**: Found Docker version 27.3.1
- [x] **Universal Run Script**: run.sh exists
- [ ] **Environment Configuration**: Missing .env file
```

Secret keys in `.env` are scrubbed and redacted automatically.

---

## Supported Ecosystems

| Ecosystem | Detected Manifests | Package Managers | Recognized Frameworks |
| :--- | :--- | :--- | :--- |
| **Node.js / TS** | `package.json`, lockfiles | `npm`, `pnpm`, `yarn`, `bun` | Next.js, Vite, Express, Fastify, Nuxt, Astro |
| **Python** | `requirements.txt`, `pyproject.toml`, `Pipfile` | `pip`, `poetry`, `pipenv`, `uv` | FastAPI, Flask, Django |
| **Go** | `go.mod`, `main.go` | `go` | Standard library, Gin, Fiber |
| **Rust** | `Cargo.toml`, `Cargo.lock` | `cargo` | Actix, Axum, Tokio |
| **Multi-Service** | `compose.yaml`, `docker-compose.yml` | `docker-compose` | Any multi-container layout |
| **Static Web** | `index.html` | None | Pure HTML/CSS/JS |

---

## Comparison With Alternatives

| Feature | `runrepo` | `docker init` | `nixpacks` | Devcontainers CLI |
| :--- | :---: | :---: | :---: | :---: |
| **Generates Dockerfile** | Yes | Yes | Yes | Yes |
| **Generates .devcontainer** | Yes | No | No | Yes |
| **Universal `./run.sh` (dual-tier)** | Yes | No | No | No |
| **Scans code for missing `.env` keys** | Yes | No | No | No |
| **Pre-flight health check (`doctor`)** | Yes | No | No | No |
| **Structured issue intake generator** | Yes | No | No | No |
| **CI reproducibility check workflow** | Yes | No | No | No |
| **Host dependencies required** | None (Node 18+) | Docker | Nix / Docker | Docker + Node |

---

## CLI Reference

```text
Usage:
  runrepo <command> [directory] [options]
  npx runrepo <command> [directory] [options]

Commands:
  init [dir]      Detect stack and generate Dockerfile, devcontainer,
                  run scripts, .env.example, and CI reproducibility action.
  doctor [dir]    Run pre-flight checks for missing files, unmapped env vars,
                  port collisions, and host compilers.
  run [dir]       Execute project natively with container fallback.
  readme [dir]    Inject or update 1-command quickstart block in README.md.
  issue [dir]     Output sanitized Markdown diagnostics for GitHub issues.

Options:
  --container, -c Force containerized execution (for 'run')
  --force, -f     Overwrite existing files (for 'init')
  --json          Output structured JSON (for 'doctor')
  --issue         Format output as Markdown issue block (for 'doctor')
  --help, -h      Display help menu
  --version, -v   Print version number
```

---

## Design Principles

- **Zero dependencies**: Built entirely with native Node.js ES modules (`node:fs`, `node:path`, `node:child_process`, `node:os`). No `node_modules` weight.
- **Non-destructive by default**: Never overwrites existing user files without `--force`.
- **Privacy first**: Redacts secret values and credentials from diagnostic outputs.
- **Fail closed to containers**: If a developer's host machine is messy or broken, fall back to an isolated container rather than failing silently.

---

## Technical Documentation
- [Architecture & State Machine](docs/ARCHITECTURE.md)
- [Complete CLI Reference](docs/CLI_REFERENCE.md)
- [Research 01: Detection Heuristics](research/01_stack_detection_heuristics.md)
- [Research 02: Reproducibility Benchmarks](research/02_reproducibility_benchmarks.md)
- [Research 03: Structured Issue Intake](research/03_issue_intake_and_diagnostics.md)
- [Contributing](docs/CONTRIBUTING.md)

---

## License

[MIT](LICENSE) © 2026 [Terrox0](https://github.com/Terrox0)
