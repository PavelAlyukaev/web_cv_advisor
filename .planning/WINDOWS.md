---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-11-04T10:20:40.141Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 1 | unrun-verify | src/features/backup/ImportBackupDialog.tsx |  | Seeded browser import/replacement and multi-version vacancy-text export checks remain unrun. | open |  | 2026-11-04T10:20:40.141Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "1",
    "file": "src/features/backup/ImportBackupDialog.tsx",
    "line": null,
    "description": "Seeded browser import/replacement and multi-version vacancy-text export checks remain unrun.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-11-04T10:20:40.141Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
