---
phase: "01"
slug: "hranilische-dannyh-i-rezervnye-kopii"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-04"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with TypeScript/TSX, using `fake-indexeddb` for IndexedDB integration checks |
| **Config file** | `vite.config.ts` (`test` configuration) |
| **Quick run command** | `npm test` (all focused unit/integration tests; target under 30 seconds) |
| **Full suite command** | `npm run build && npm test` |
| **Estimated runtime** | Under 30 seconds for quick suite; measure during Wave 0 |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- <changed test file>` for code behavior or `npm run build` for UI/config-only changes
- **After every plan wave:** Run `npm run build && npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** Set after Wave 0 runner setup; keep the quick suite under 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01 | 01 | 1 | DATA-01, DATA-02 | T-01-01 | No SUS package is installed before user verifies the upstream and npm records | provenance gate | `node -e "const s=require('node:fs').readFileSync('.planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-RESEARCH.md','utf8');const n=['vite','react','react-dom','@vitejs/plugin-react','vitest','fake-indexeddb'];const q=String.fromCharCode(96);const rows=s.split(/\r?\n/).filter(x=>x.startsWith('|'));const missing=n.filter(p=>!rows.some(r=>r.includes(q+p+q)));if(missing.length){console.error(missing.join(', '));process.exit(1)}console.log('all SUS package audit rows present')"` | ✅ | ⬜ pending |
| 01-02 | 01 | 1 | DATA-01, DATA-02 | T-01-01 / T-01-SC | The Vite/React/TypeScript shell and test scripts build from the locked manifest | build | `npm run build` | ❌ W0 | ⬜ pending |
| 01-03 | 01 | 1 | DATA-01, DATA-02 | — | Master/profile/version contracts have independent empty data and snapshot shapes | unit | `npm test -- src/data/resume-model.test.ts` | ❌ W0 | ⬜ pending |
| 01-04 | 02 | 2 | DATA-01, DATA-02 | T-01-02 / T-01-SC | IndexedDB stores and atomically replaces one complete state record | IndexedDB integration | `npm test -- src/data/indexed-db.test.ts` | ❌ W0 | ⬜ pending |
| 01-05 | 02 | 2 | DATA-02 | T-01-02 / T-01-03 | Invalid, unsupported, or over-limit JSON is rejected before persistence | unit | `npm test -- src/backup/backup-validation.test.ts` | ❌ W0 | ⬜ pending |
| 01-06 | 02 | 2 | DATA-01, DATA-02 | T-01-02 / T-01-05 | Import does not partially write; export honors per-version choices and dates | unit + IndexedDB integration | `npm test -- src/backup/backup-import.test.ts src/backup/backup-export.test.ts` | ❌ W0 | ⬜ pending |
| 01-07 | 03 | 3 | DATA-02 | T-01-04 / T-01-02 | Preview is redacted, current backup is offered, invalid/cancelled imports preserve current data | browser acceptance | Manual browser check in `01-03-PLAN.md` | ❌ W0 | ⬜ pending |
| 01-08 | 03 | 3 | DATA-01 | T-01-06 / T-01-05 | Repeated warning and fresh per-version choices control the downloaded JSON | browser acceptance | Manual browser check in `01-03-PLAN.md` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Install/configure Vitest and `fake-indexeddb` only after the blocking package-provenance approvals; make `npm test` run the configured tests.
- [ ] Add fixtures for a valid v1 backup, malformed JSON, unknown versions, invalid field types, over-limit input, and vacancy text included/excluded.
- [ ] Add parser/schema/current-version dispatch/export unit checks.
- [ ] Add IndexedDB integration checks for read/write, successful replacement, transaction abort/error, and unchanged state after rejection/cancellation.
- [ ] Measure that the full `npm test` quick suite stays under 30 seconds.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import preview and replacement safeguards | DATA-02 | User-facing wording and privacy exposure need a browser-level acceptance pass | Import a valid backup into a browser with existing data; confirm only counts and company/job names appear, offer current-data download, then cancel and confirm existing data remains. Repeat and confirm replacement. |
| Personal-data export warning and downloaded file | DATA-01 | Browser download behavior and the warning’s clarity require an end-to-end browser check | Start export twice; verify the warning appears on each attempt, select vacancy-text inclusion/exclusion, download and inspect the JSON filename and contents. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for quick suite
- [ ] `nyquist_compliant: true` set in frontmatter after validation

**Approval:** pending
