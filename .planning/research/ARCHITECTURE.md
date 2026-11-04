# Architecture Patterns

**Domain:** Local-first web resume builder with vacancy matching and tailored resume versions
**Researched:** 2026-11-04
**Confidence:** MEDIUM

## Recommended Architecture

Start as a browser-only, single-page application with a clear separation between presentation, resume/vacancy domain logic, persistence, and export. The base resume is the canonical profile. A tailored version is an independent snapshot of the content the user chose for one vacancy, with a link to that vacancy and optional provenance back to the base profile. Keep matching deterministic and local: normalize vacancy text and resume skills/experience into comparable tokens, then return matches and gaps as structured results for the UI to explain. Do not let matching code mutate resume data.

```text
Editor / Vacancy / Version screens
               │ user actions and view models
               ▼
        Application services
       ┌───────┼─────────┐
       ▼       ▼         ▼
 Resume and  Matching   Export
 version    service    renderer
 domain       │         │
       │       └── local text only
       ▼
 Resume repository interface
               │
               ▼
          IndexedDB
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Resume editor | Edit contact details, summary, skills, work entries, education, and section order; validate required fields | Application services, resume domain |
| Vacancy and matching view | Store pasted vacancy text, show explainable matched/missing terms, allow the user to select edits | Matching service, vacancy/version services |
| Resume domain | Typed entities and pure operations for editing, cloning a snapshot, and validating a resume | Application services; no browser APIs |
| Matching service | Normalize Russian text and compare explicit skill terms/phrases against selected resume content; return evidence and counts | Resume and vacancy domain values; no persistence/UI dependencies |
| Application services | Coordinate save, create-version, edit-version, and export flows | Domain, repository, exporter |
| Resume repository | Load and persist the base profile, vacancies, and versions; encapsulate schema upgrades and storage errors | IndexedDB adapter |
| Export renderer | Render a selected saved version consistently for print or PDF | Resume domain and presentation styles |

### Data Flow

1. On startup, the app opens its local database and loads the master resume and saved versions. If no profile exists, it presents an empty editor.
2. Each edit updates application state and is saved through the repository. Do not rely on a browser-close/unload handler for saving; IndexedDB operations are asynchronous and can be aborted during shutdown. Save after an explicit change or a debounced edit, and show saved/error state.
3. The user pastes vacancy text. The matching service normalizes text and compares it with the current profile's skills and relevant work descriptions. It returns matches, gaps, and the source phrases used as evidence. Keep this service deterministic so the user can understand why each recommendation appeared.
4. The user chooses changes in the editor. Saving a tailored version creates a new resume snapshot and vacancy association; subsequent edits to that version must not silently modify the master profile or earlier versions.
5. Export reads the selected version as a snapshot and sends it to the print/PDF renderer. Export should never serialize hidden UI controls, unsaved editor state, or matching scores into the resume by accident.

### Suggested Data Model

- `ResumeProfile`: stable ID, schema version, updated timestamp, contact/profile fields, skills, work entries, education entries, and section order.
- `Vacancy`: stable ID, title/company if entered, original pasted text, and created timestamp.
- `ResumeVersion`: stable ID, vacancy ID, optional source profile ID, created/updated timestamps, and a full resume-content snapshot.
- `AppSettings`: presentation preferences only; keep them separate from resume content so reset/export semantics are clear.

Use IDs for work and education entries rather than array positions. Treat the version snapshot as the source for its later edits and exports. This avoids fragile diffs or accidental coupling between a changing master resume and a version already prepared for an application.

## Patterns to Follow

### Local repository boundary
**What:** Define storage operations such as `loadProfile`, `saveProfile`, `listVersions`, `saveVersion`, and `deleteVersion` behind one repository interface. Use IndexedDB for structured records and atomic updates; keep the matching service unaware of IndexedDB.
**When:** From the first persistence feature. This keeps storage errors and future migration/sync changes out of UI components.
**Example:**

```typescript
interface ResumeRepository {
  loadProfile(): Promise<ResumeProfile | null>;
  saveProfile(profile: ResumeProfile): Promise<void>;
  listVersions(): Promise<ResumeVersion[]>;
  saveVersion(version: ResumeVersion): Promise<void>;
  deleteVersion(id: string): Promise<void>;
}
```

### Version snapshots
**What:** Copy the selected resume fields into a saved version at the moment the user creates it; store vacancy association separately.
**When:** Whenever the user starts a tailored application version.
**Why:** A stable snapshot gives predictable revision and export behavior. A pointer-only overlay would make a previously prepared version drift when the master profile changes.

### Explainable matching
**What:** Return a structured list of matched phrases and missing phrases, with a source section and normalized comparison key for each result.
**When:** For first-release vacancy analysis.
**Why:** This supports manual control and lets the interface explain the recommendation without claiming semantic understanding or generating unsupported resume content.

## Anti-Patterns to Avoid

### Keeping all resume data in localStorage
**What:** Serializing the whole profile, vacancy text, and every version into one large localStorage string.
**Why bad:** Web Storage is synchronous, stores strings, and has a comparatively small quota; large reads/writes can block the UI. The application also gets brittle whole-document overwrite behavior as more entities are added.
**Instead:** Use IndexedDB for structured records behind a repository. localStorage can remain suitable for tiny non-sensitive UI preferences.

### Mutating the master profile while tailoring
**What:** Editing the master profile directly and relying on the user to remember what changed for a specific vacancy.
**Why bad:** It makes previously prepared applications drift and causes accidental cross-contamination between versions.
**Instead:** Create an explicit snapshot for every vacancy and edit that snapshot independently.

### Selling local browser storage as a backup
**What:** Implying that “saved in the browser” means permanent storage or availability on another device.
**Why bad:** Browser storage is origin-specific and best-effort by default; clearing site data, private browsing, device loss, quota, or browser eviction can remove it. It does not synchronize devices.
**Instead:** Explain the limitation in plain language, provide a user-controlled export/import backup, provide a clear-all action, and handle storage failures. Consider requesting persistent storage only as an enhancement; do not make it a guarantee.

### Overbuilding text analysis
**What:** Adding an AI service or elaborate NLP pipeline before measuring whether simple matching helps.
**Why bad:** It expands cost, privacy, and product expectations while the user explicitly selected simple recommendations for the first release.
**Instead:** Start with an editable Russian keyword/skill vocabulary and deterministic normalization; evaluate false matches and missed synonyms before expanding.

## Scalability Considerations

| Concern | MVP | Growth path | Trigger to change |
|---------|-----|-------------|------------------|
| Storage volume | A few text records per browser profile in IndexedDB | Add indexed lookups, data export/import, and migration tooling | Profile grows to include many large attachments or repeated quota/write errors |
| Matching latency | Pure synchronous matching for short vacancy text | Move normalization/matching to a Web Worker | Profiling shows matching delays input/rendering or matching gains heavier parsing |
| Cross-device access | Explain browser-local scope and offer backup file | Add optional account-backed sync with explicit privacy/security design | Users validate the core workflow and request multi-device continuity |
| PDF layout | One semantic resume template with print-specific CSS and preview | Add named templates or a dedicated client PDF generator | Browser print output fails consistent pagination or one-click download is required |

## Build Order Implications

1. Define resume, vacancy, and version types plus validation rules. This gives matching, persistence, and output one stable data contract.
2. Build the editable master resume and its preview. The profile must exist before tailoring can provide useful comparisons.
3. Add IndexedDB persistence, save/error feedback, schema versioning, and explicit backup/reset controls before relying on saved versions.
4. Implement local vacancy parsing and explainable matching as a pure service; then connect recommendations to manual edits.
5. Add independent vacancy-linked snapshots and a version list. Confirm that changing the master does not alter a saved version.
6. Add print/PDF output using the same version snapshot, then check Cyrillic text, page breaks, margins, selectable text, and long entries in browser print preview.

## Sources

- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — asynchronous structured storage, transactions, indexes, and same-origin limits.
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) — schema/version handling, transactions, and shutdown caveat.
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — synchronous behavior and limits of localStorage/sessionStorage.
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — best-effort persistence, quota variability, eviction, and persistence requests.
- [MDN: Printing with CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) — print stylesheets and `@page` controls.
- [MDN: `window.print()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/print) — built-in print dialog behavior.
- [MDN: Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — background processing and message passing constraints.
- [pdf-lib documentation](https://pdf-lib.js.org/) — browser-side PDF generation and custom font embedding if print CSS does not meet validated export needs.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Browser storage | MEDIUM | Based on current MDN documentation; exact quota/eviction behavior varies by browser and device. |
| Component boundaries and snapshots | MEDIUM | Architecture recommendation inferred from the product's local-first and per-vacancy version requirements. |
| Print/PDF choice | MEDIUM | Native print is documented and low-complexity; output quality and exact UX need testing in target browsers. |
| Matching and worker placement | MEDIUM | Deterministic matching fits the explicit first-release scope; performance choice should be confirmed by profiling real vacancy text. |
