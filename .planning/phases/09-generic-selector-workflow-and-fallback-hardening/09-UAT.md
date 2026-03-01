---
status: complete
phase: 09-generic-selector-workflow-and-fallback-hardening
source:
  - 09-01-SUMMARY.md
  - 09-02-SUMMARY.md
started: "2026-03-01T18:56:36Z"
updated: "2026-03-01T19:04:37Z"
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Generic mode help output
expected: Running `npm run health:selectors -- --help` should show `--generic, --pick-any` with representative-path wording and `--sample <n|all>`.
result: pass

### 2. Generic dry-run mode signal
expected: Running `npm run health:selectors -- --dry-run --scope countries --scope leagues --scope seasons --generic` should end with `RESULT: pass` and print `Target mode: generic (representative discovered path)`.
result: pass

### 3. Guardrail for ambiguous flags
expected: Running `npm run health:selectors -- --scope leagues --generic --sample 2` should fail fast with error `--pick-any cannot be combined with --sample`.
result: pass

### 4. Generic quiet execution
expected: Running `npm run health:selectors -- --scope countries --generic --quiet` should complete successfully and print `RESULT: pass`.
result: pass

### 5. Discovery breadth and fallback chain
expected: Running the phase runtime chain check should yield broad country coverage plus usable Argentina league/season discovery (>=100 countries, >=5 leagues, >=1 season).
result: pass

### 6. Regression check for sample mode
expected: Running `npm run health:selectors -- --scope leagues --sample 2 --quiet` should still pass (`RESULT: pass`), confirming sample mode behavior is preserved.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
