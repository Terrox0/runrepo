# `runrepo` CLI Command Reference

Full command syntax, options, and operational parameters for the `runrepo` CLI.

---

## Global Syntax

```bash
runrepo <command> [directory] [options]
npx runrepo <command> [directory] [options]
```

If `[directory]` is omitted, `runrepo` operates on `process.cwd()`.

---

## Commands

### `runrepo init [dir]`
Inspects the target repository, detects the language and framework stack, and generates the complete reproducibility suite.

**Generated Artifacts**:
- `Dockerfile`
- `.devcontainer/devcontainer.json`
- `run.sh` (POSIX bash with executable permissions)
- `run.bat` (Windows batch script)
- `.env.example` (if missing, populated with extracted codebase variables)
- `.github/workflows/verify-reproducibility.yml` (CI reproducibility gate)
- `README.md` (Updated with 1-command runnable badge and quickstart)

**Options**:
- `--force`, `-f`: Overwrite existing files if they already exist.

---

### `runrepo doctor [dir]`
Runs pre-flight diagnostic audits on the target repository and host environment.

**Audits Performed**:
1. Host native runtime availability (`node`, `python`, `go`, `cargo`).
2. Container engine availability (`docker`).
3. Universal run script presence (`run.sh` / `run.bat`).
4. Dockerfile presence.
5. Environment configuration status (`.env` vs `.env.example`).
6. Unmapped environment variables audit (code vs template).

**Options**:
- `--json`: Output raw JSON report for CI pipelines or scripts.
- `--issue`: Output sanitized Markdown diagnostics ready to paste into GitHub issues.

---

### `runrepo run [dir]`
Executes the project using the inferred run command. Attempts native execution first, automatically falling back to an isolated Docker container if native dependencies fail.

**Options**:
- `--container`, `-c`: Bypass native host execution and launch immediately inside an isolated Docker container with port forwarding.

---

### `runrepo readme [dir]`
Injects or updates the standardized 1-command runnable badge and quickstart block in `README.md` without modifying other files.

---

### `runrepo issue [dir]`
Generates a sanitized, privacy-safe Markdown diagnostics block containing operating system details, runtime versions, stack metadata, and health check statuses.
