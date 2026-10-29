# Contributing to `runrepo`

Thank you for helping make open source repositories instantly runnable!

---

## 1. Development Setup

`runrepo` has **zero external runtime dependencies**. It runs on native Node.js 18+ utilizing built-in ES modules.

```bash
# Clone the repository
git clone https://github.com/Terrox0/runrepo.git
cd runrepo

# Run unit tests
npm test

# Run the doctor on the local repo
node bin/runrepo.js doctor .
```

---

## 2. Adding a New Language / Framework Detector

Stack detectors reside in [`src/detector.js`](../src/detector.js):

1. Add your file detection rules to `detectStack(projectDir)`.
2. Ensure you return:
   - `type`: Language / ecosystem slug (e.g., `ruby`, `php`, `elixir`).
   - `runtime`: Canonical runtime name.
   - `packageManager`: Inferred package manager.
   - `runCommand`: Canonical dev or start command.
   - `defaultPort`: Inferred listening port.
3. Add corresponding container generation logic in [`src/generator.js`](../src/generator.js).
4. Add a sample fixture in [`examples/`](../examples/) and register an automated test in [`test/runrepo.test.js`](../test/runrepo.test.js).

---

## 3. Pull Request Guidelines

- Follow Conventional Commits:
  - `feat: add Elixir / Phoenix stack detector`
  - `fix: handle pnpm workspace lockfile resolution`
  - `docs: update CLI reference with issue composer examples`
- Ensure `npm test` passes before opening a PR.
