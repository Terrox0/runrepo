# Research Note 01: Multi-Ecosystem Stack Detection Heuristics

**Date**: October 2026  
**Status**: Approved Specification  
**Project**: `runrepo` (One-Command Reproducible Repository Engine)

---

## 1. Executive Summary
A core failure mode of modern developer onboarding is the "Implicit Knowledge Barrier": repository authors assume users know which runtime version, task runner, and port a project expects. Stack detection must be completely automated, deterministic, and resilient to messy, partially configured codebases.

This document establishes the heuristic detection hierarchy and decision trees implemented in `runrepo`.

---

## 2. Detection Decision Hierarchy

Detection operates in three prioritized passes:

```
Pass 1: Container & Multi-Service Manifests (compose.yaml, docker-compose.yml)
                           │ (if absent)
                           ▼
Pass 2: Language Manifests & Lockfiles (package.json, pyproject.toml, Cargo.toml, go.mod)
                           │ (if absent)
                           ▼
Pass 3: Structural File Fingerprints (main.py, index.js, src/main.rs, cmd/main.go)
```

---

## 3. Language & Package Manager Signatures

### 3.1 Node.js / JavaScript / TypeScript
| File Signal | Inferred Package Manager | Fallback Binary |
| :--- | :--- | :--- |
| `bun.lockb` or `bun.lock` | `bun` | `bun run dev` / `bun start` |
| `pnpm-lock.yaml` | `pnpm` | `pnpm run dev` / `pnpm start` |
| `yarn.lock` | `yarn` | `yarn dev` / `yarn start` |
| `package-lock.json` | `npm` | `npm run dev` / `npm start` |
| `package.json` (no lock) | `npm` | `npm install && npm start` |

**Script Prioritization Matrix**:
1. `dev` or `develop`
2. `start`
3. `serve`
4. `preview`

**Default Ports**: `3000` (Next/React), `5173` (Vite), `8080` (Express/Webpack), `4200` (Angular), `8000` (Gatsby).

### 3.2 Python
| File Signal | Inferred Toolchain | Preferred Execution |
| :--- | :--- | :--- |
| `poetry.lock` / `poetry.toml` | Poetry | `poetry run python ...` |
| `Pipfile` / `Pipfile.lock` | Pipenv | `pipenv run python ...` |
| `pyproject.toml` | `pip` / `uv` | `python -m pip install -e .` |
| `requirements.txt` | `pip` | `pip install -r requirements.txt` |
| `setup.py` / `setup.cfg` | `setuptools` | `pip install -e .` |

**Framework & Entry Detection**:
- Contains `fastapi` in requirements $\rightarrow$ `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Contains `django` $\rightarrow$ `python manage.py runserver 0.0.0.0:8000`
- Contains `flask` $\rightarrow$ `flask run --host=0.0.0.0 --port=5000`
- Default fallback $\rightarrow$ Look for `main.py`, `app.py`, `server.py`, `run.py`.

### 3.3 Go
| File Signal | Toolchain | Inferred Command |
| :--- | :--- | :--- |
| `go.mod` | Go 1.22+ | `go run .` or `go run ./cmd/...` |
| `main.go` | Go | `go run main.go` |

**Default Port**: `8080`.

### 3.4 Rust
| File Signal | Toolchain | Inferred Command |
| :--- | :--- | :--- |
| `Cargo.toml` | Cargo | `cargo run` |

**Default Ports**: `8080`, `3000`, `8000`.

### 3.5 Ruby
| File Signal | Toolchain | Inferred Command |
| :--- | :--- | :--- |
| `Gemfile` + `config.ru` | Bundler / Rack | `bundle exec rackup -p 9292 -o 0.0.0.0` |
| `Gemfile` + `bin/rails` | Rails | `bin/rails server -b 0.0.0.0 -p 3000` |

---

## 4. Environment Variable Extraction Heuristics

To prevent silent boot crashes from unconfigured secrets, the detector extracts required environment variables without executing code:

1. **AST / Regex Scans**:
   - JavaScript/TypeScript: `/\bprocess\.env\.([A-Z0-9_]+)\b/g`
   - Python: `/\bos\.(?:environ(?:\[['"]|(?:\.get\(['"]))([A-Z0-9_]+)['"]\)/g`
   - Go: `/\bos\.Getenv\(["']([A-Z0-9_]+)["']\)/g`
   - Rust: `/\benv::var\(["']([A-Z0-9_]+)["']\)/g`

2. **Template Comparison**:
   - Compare extracted identifiers against `.env.example`, `.env.sample`, `.env.template`, or `.env.local.example`.
   - Any identifier present in source code but missing from the template is flagged as an **unadorned secret dependency**.

---

## 5. Port Conflict & Bound Socket Detection
`runrepo` inspects local listening ports before running:
- macOS/Linux: `lsof -i :<port>` or `ss -tulpn`
- Windows: `netstat -ano | findstr :<port>`
- If occupied, the runner auto-proposes an incremented port (e.g., `3000 -> 3001`) and sets `PORT=<new>` in the environment override.
