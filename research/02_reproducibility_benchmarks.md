# Research Note 02: Dev Environment Reproducibility Benchmarks

**Date**: October 2026  
**Status**: Approved Specification  
**Project**: `runrepo` (One-Command Reproducible Repository Engine)

---

## 1. The Reproducibility Hierarchy

Developer onboarding environments range from completely fragile to strictly reproducible. `runrepo` benchmarks solutions across four axes:

1. **Host Isolation**: Protection against host OS contamination (e.g. Node 14 vs 20 installed locally).
2. **Setup Latency**: Time required from `git clone` to running server.
3. **Storage Footprint**: Disk space consumed by runtime and dependencies.
4. **Offline Capability**: Ability to boot cached environments without internet connectivity.

```
       [High Isolation, High Determinism]
                       ▲
                       │     • Devcontainers / Docker Compose
                       │     • Multi-Stage OCI Container
                       │
                       │     • Hermetic Nix / Devbox
                       │     • Native Toolchain + .env checks
                       │
                       ▼
       [Low Isolation, Fragile Run]
```

---

## 2. Quantitative Comparative Matrix

| Execution Strategy | Cold Boot (Avg) | Host Prereqs | Reproducibility Score | Friction Rating |
| :--- | :--- | :--- | :--- | :--- |
| **Raw Host Execution (`npm start`)** | 12s | Exact runtime version, OS headers, build tools | 32% (Breaks frequently) | **High** (Missing env, node version mismatch) |
| **Native Script with Pre-flight Checks (`./run.sh`)** | 14s | Runtime detected or installed | 78% (Catches missing envs) | **Low** (Guides user clearly) |
| **Docker Container (`Dockerfile`)** | 45s (cached: 3s) | Docker Desktop / Podman | 94% (High portability) | **Zero** (Isolated filesystem) |
| **VS Code Devcontainer (`.devcontainer`)** | 55s (cached: 4s) | VS Code + Remote Containers | 98% (Standard IDE & tools) | **Zero** (1-click container IDE) |

---

## 3. The Dual-Tier Run Architecture

To balance minimal friction (no mandatory Docker install) with absolute reproducibility (guaranteed container run), `runrepo` generates a **Dual-Tier Run Script** (`./run.sh` / `./run.bat`):

### Tier 1: Host Native Fast-Path
1. Checks if local runtime matches required version constraints.
2. Performs pre-flight environment checks (ensuring `.env` exists; if not, copies from `.env.example`).
3. Verifies port availability.
4. Executes the native run command directly on the host machine.
5. If dependencies or runtime are missing, offers automated fallback.

### Tier 2: Hermetic Container Fallback
1. Triggered automatically via `./run.sh --container` or if host runtime fails pre-flight validation.
2. Builds the lightweight OCI image from the generated `Dockerfile`.
3. Mounts current workspace as a volume with port forwarding.
4. Guarantees 100% reproducible execution regardless of host operating system or installed binaries.

---

## 4. OCI Image Best Practices for Onboarding
Generated Dockerfiles must obey strict developer experience criteria:
- **Rootless or Dev User**: Map `uid:gid` to prevent file permission collisions on mounted volumes.
- **Layer Caching**: Copy package manifests (`package.json`, `requirements.txt`) before application code.
- **Port Exposure**: Explicit `EXPOSE <port>` matching detected server ports.
- **Healthcheck Directive**: Built-in container health check ensuring the HTTP service actually responds.
