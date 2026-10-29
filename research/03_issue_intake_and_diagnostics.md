# Research Note 03: Structured Issue Intake & Runtime Diagnostics

**Date**: October 2026  
**Status**: Approved Specification  
**Project**: `runrepo` (One-Command Reproducible Repository Engine)

---

## 1. Problem: The "Vague Issue" Trap

Open source maintainers spend countless hours dealing with unhelpful bug reports:
> *"It doesn't work. I cloned it and ran npm start and got an error."*

The reporter provides:
- No operating system details
- No runtime versions (`node -v`, `python -V`)
- No indication of whether environment variables were populated
- Truncated or missing terminal stack traces
- Zero reproduction steps

---

## 2. The Structured Intake Protocol

`runrepo` introduces an integrated diagnostic engine (`runrepo doctor`) and automated issue composer (`runrepo issue`):

```
Developer Encounters Error
           │
           ▼
[ runrepo doctor --issue ]
           │
 ┌─────────┴─────────────────────────────────────────────┐
 │ 1. Collects sanitized system telemetry (OS, CPU, RAM)  │
 │ 2. Inspects runtime versions and lockfiles             │
 │ 3. Validates required vs present .env variables        │
 │ 4. Tests port availability and socket status           │
 │ 5. Captures redacted tail of last execution logs       │
 └─────────┬─────────────────────────────────────────────┘
           │
           ▼
Generates Markdown Issue Draft + 1-Click GitHub New Issue Link
```

---

## 3. Redaction & Privacy Guardrails

Diagnostics must **never** leak sensitive credentials:
- Strip all values in `.env` matching patterns: `KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `AUTH`, `PRIVATE`, `CREDENTIAL`.
- Replace sensitive values with `[REDACTED_LEN_<n>]`.
- Retain only variable keys and presence flags.
- Normalize absolute local file paths (e.g. `/Users/johndoe/projects/...` $\rightarrow$ `<workspace>/...`).

---

## 4. GitHub Issue Template Integration

When `runrepo init` runs, it writes `.github/ISSUE_TEMPLATE/bug_report.yml` structured form, encouraging reporters to attach their `runrepo doctor` diagnostic block:

```yaml
name: Bug Report / Setup Failure
description: File an environment or startup failure
body:
  - type: markdown
    attributes:
      value: "Thanks for reporting! Run `npx runrepo doctor --copy` and paste the output below."
  - type: textarea
    id: diagnostics
    attributes:
      label: Diagnostics Report
      description: Paste the output of `runrepo doctor`
      render: shell
    validations:
      required: true
```
