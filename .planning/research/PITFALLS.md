# Pitfalls Research

**Domain:** Russian-language, browser-local resume builder with vacancy matching and PDF export  
**Researched:** 2026-11-04  
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Treating browser-local resume data as durable

**Severity:** High — the core user artifact can be lost without recovery.

**What goes wrong:** A user returns to find the resume or tailored versions missing after clearing site data, using private browsing, changing browser/device, storage pressure, or a failed save. Browser-managed data is best-effort by default; browser limits and eviction policies vary, and writes can fail with quota errors. `localStorage` is also synchronous and intended for small key/value data.

**Why it happens:** “No account” is mistaken for “automatically safe and permanent.” A prototype often saves one large JSON string without checking write errors or designing a recovery path.

**How to avoid:** Use IndexedDB for structured resume and version records. Make saves transactional and visibly confirm success; handle quota and storage failures without silently dropping edits. Offer portable export/import of the user’s data, a clear delete-data action, and a plain-language notice that browser-local data does not sync and can be removed by the browser or user. `navigator.storage.persist()` can be considered, but browsers may deny the request and it must not replace backups.

**Warning signs:** Save controls have no status; a reload is the only persistence check; save errors disappear; a tailored version is not included in export; product copy promises permanent storage or cross-device access.

**Phase to address:** Data model and local persistence, before building resume editing on top of storage.

---

### Pitfall 2: Matching Russian vacancy terms with exact or Latin-only token rules

**Severity:** High — unreliable recommendations undermine the product’s main promise.

**What goes wrong:** Useful skills are missed because the resume and vacancy use different inflected forms, spelling variants, or synonyms. Conversely, substring matching can count unrelated words and create misleading matches. Basic ASCII-oriented token rules can mishandle Cyrillic text.

**Why it happens:** A quick `split(" ")`, `\w`, or literal substring implementation looks convincing on a few examples. Locale-aware word segmentation is mistaken for stemming or semantic understanding.

**How to avoid:** Normalize case and Unicode consistently; tokenize Russian with locale-aware segmentation or Unicode letter properties; use a deliberately small, reviewable skills/synonym list for supported variants. Keep exact matches distinct from normalized or synonym matches. Show the source text and the matching rule for each result, let users correct or dismiss suggestions, and describe the score as a heuristic signal rather than a prediction of hiring or ATS success. Test with real, varied Russian vacancies and resumes before expanding the dictionary.

**Warning signs:** One match percentage is shown without explanation; “аналитик” and “аналитика” behave inconsistently; mixed Latin/Cyrillic abbreviations break; every keyword contributes equally; users cannot mark a suggested skill irrelevant.

**Phase to address:** Vacancy analysis, with a small Russian-language evaluation set defined before tuning the matching rules.

---

### Pitfall 3: Rendering pasted vacancy text or resume content as HTML

**Severity:** Critical — same-origin script execution could expose or alter personal resume data.

**What goes wrong:** Crafted pasted text can execute as markup or script if inserted as HTML. A script running on the site can read or alter resume data in the page and browser storage, exposing sensitive personal information.

**Why it happens:** Rich-text previews are convenient, and imported/pasted content is treated as trusted because it came from the user’s clipboard. Local-only storage is incorrectly assumed to make script injection harmless.

**How to avoid:** Treat vacancy text and user-entered resume fields as untrusted plain text and render them through text-safe UI paths. Avoid raw HTML insertion for this MVP. If rich text becomes necessary, use a vetted sanitizer with a narrow allowlist and add a strict Content Security Policy as defense in depth. Keep analytics and network requests from receiving resume content; make the local-only data boundary clear in product copy.

**Warning signs:** Raw HTML insertion is used for pasted text; links or tags from a vacancy become active in a preview; a resume field is included in telemetry; “stored locally” is presented as equivalent to encrypted or protected from same-origin scripts.

**Phase to address:** App foundation and data handling, before accepting or previewing user text.

---

### Pitfall 4: Saving tailored resumes as references to a mutable master

**Severity:** High — users can lose the application-specific version they intend to use.

**What goes wrong:** Editing the base resume unexpectedly changes an older vacancy-specific version, or two browser tabs overwrite one another. Users lose the tailored wording they intended to send for a particular role.

**Why it happens:** Versions are modeled as labels pointing at one shared mutable object, or writes replace the entire database record without checking which revision was edited.

**How to avoid:** Give each tailored version its own stable ID, vacancy text or vacancy label, creation/update timestamps, and a snapshot of the resume content at the time it was tailored. Define whether later master edits are copied into a version only by an explicit user action. Use IndexedDB transactions for related updates and detect stale edits from another tab; preserve a recoverable prior revision when replacing data.

**Warning signs:** Updating the master changes every saved version; the version list cannot identify its vacancy; edits from another tab silently disappear; deleting a vacancy label deletes resume content.

**Phase to address:** Resume/version data modeling, before implementing multiple saved variants.

---

### Pitfall 5: Calling PDF export complete after testing only a short sample

**Severity:** High — the primary output may be unusable despite appearing successful in the editor.

**What goes wrong:** A PDF has clipped or split sections, awkward blank pages, missing Cyrillic glyphs, or includes editor controls. Long work histories expose failures that a one-page demo misses.

**Why it happens:** The screen editor is reused as the print layout, and export is judged only on one browser and one short resume.

**How to avoid:** Create a dedicated print stylesheet with `@media print` and page rules; hide navigation/editor controls, manage page breaks around semantic sections, and verify the selected font covers Cyrillic characters. Check both the browser’s print-to-PDF flow and the generated PDF at realistic short and multi-page lengths, with long titles, dates, links, and empty optional fields. Provide a preview before download.

**Warning signs:** No print-specific CSS exists; layout depends on viewport height; the only sample fits one page; exported Cyrillic is represented by missing glyphs or fallback fonts; there is no visual check of the resulting PDF.

**Phase to address:** PDF/export, after the resume data shape and content sections stabilize.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store all resumes and versions in one `localStorage` string | Fast prototype | Synchronous parsing/writes, brittle migrations, quota failures, and one failed write can affect everything | Only for a disposable prototype with no real user data |
| Use exact substring matching for every term | Minimal matching code | Russian inflections, abbreviations, and synonyms create false misses and false positives | Acceptable as an explicitly labeled demo, not as a recommendation score |
| Let each tailored version point to the live master | Avoids copying data | Later edits mutate the user’s supposedly saved application version | Never for a user-facing saved-version feature |
| Treat the screen layout as the PDF layout | Reuses existing UI | Print pagination and controls produce an unreliable deliverable | Only for a throwaway internal sketch |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Browser storage | Assume data is permanent or that quota errors cannot happen | Handle save failures, explain device/browser scope, and provide export/restore; persistence requests are best-effort |
| Browser text APIs | Assume word segmentation also handles Russian morphology | Treat segmentation, normalization, morphology, and synonym mapping as separate concerns; evaluate each with representative text |
| Browser print-to-PDF | Assume the responsive editor will paginate correctly | Use print-specific styles and inspect multi-page PDFs with Cyrillic content in supported browsers |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous serialization and writes for the entire resume/version history on every keystroke | Typing pauses or the tab freezes, especially on slower devices | Use asynchronous structured storage; debounce persistence while keeping clear saved/unsaved status | As soon as saved content/history grows or writes run frequently; no single browser threshold is reliable |
| Re-tokenize and rescan the entire vacancy and every resume field after each keystroke | Recommendations visibly lag while editing | Debounce analysis, pre-normalize stable fields, and recompute only affected sections | Long vacancy text, many versions, or slower phones |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Insert vacancy/resume input as raw HTML | Cross-site scripting can alter the UI and read or modify locally stored personal data | Render as text; sanitize only if rich HTML is an explicit requirement; use CSP as a secondary defense |
| Claim “private” or “secure” solely because data stays in the browser | Users may misunderstand that browser cleanup, shared profiles, extensions, or same-origin script execution can expose/remove it | State precisely what remains local and what is sent to the server; avoid unsupported encryption/privacy claims |
| Send resume fields or vacancy text to analytics/error logging | Personally identifying work/contact history leaves the promised local boundary | Exclude content fields from telemetry and error payloads; test network requests with realistic data |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Opaque “match percentage” | Users may treat a rough heuristic as an ATS pass probability | Show matched, missing, and uncertain terms with the evidence and let the user edit the selected skills |
| No visible save state or backup route | A user may close the tab believing important edits are safe | Show saved/unsaved/error states and offer export/restore before users rely on local storage |
| Base resume and vacancy versions are hard to distinguish | User may download or send the wrong variant | Label each version with role/company or a user-provided vacancy title and show which resume snapshot it contains |
| Export uses editor wording or controls | The PDF looks unfinished to an employer | Preview a clean print layout and suppress editor-only labels and actions |

## “Looks Done But Isn’t” Checklist

- [ ] **Local save:** Reload after edits and verify success/failure states, storage errors, and export/restore behavior.
- [ ] **Resume versions:** Change the master after creating a vacancy version and verify the saved version remains intact until the user explicitly updates it.
- [ ] **Russian matching:** Check inflection, `ё`/`е`, Cyrillic and Latin abbreviations, punctuation, and synonyms; inspect why each term was marked.
- [ ] **Vacancy input:** Paste HTML-like text and confirm it remains inert plain text.
- [ ] **PDF:** Export both short and multi-page resumes with Cyrillic names, long descriptions, links, dates, and optional fields; inspect the actual PDF.
- [ ] **Local-only promise:** Inspect network requests and confirm resume/vacancy content is not sent to analytics or error services.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Browser storage lost or save failed | HIGH if no export exists | Restore from a user export if available; otherwise explain the data cannot be recovered from the app and add export/restore plus write-failure handling before onboarding users |
| Matching produces misleading suggestions | MEDIUM | Remove unsupported aggregate claims, retain explainable term-level matches, gather anonymized or consented examples, and adjust the tested dictionary/rules |
| Tailored version was overwritten | MEDIUM/HIGH | Restore a prior revision if retained; separate version snapshots and add stale-tab conflict handling before further editing features |
| Unsafe HTML reached the preview | HIGH | Remove raw HTML rendering, audit every content sink, clear affected local data if appropriate, and add malicious-input regression cases before release |
| PDF output is broken | MEDIUM | Keep the underlying resume data intact, correct print styles/fonts, and re-export; do not ask users to rebuild the resume to work around layout defects |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Browser data loss and quota failures | Data model and local persistence | Force a write error, reload saved data, and complete export/restore round-trip |
| Russian keyword false matches/misses | Vacancy analysis | Evaluate against a small representative Russian vacancy set and inspect explainable term-level output |
| Pasted-content XSS and privacy boundary | App foundation and data handling | Paste executable-looking markup; confirm it remains inert and no resume content appears in network traffic |
| Version mutation and multi-tab overwrite | Resume and tailored-version model | Edit master/version independently and create conflicting edits in two tabs; confirm no silent mutation/loss |
| Broken Cyrillic or multi-page PDF | PDF/export | Inspect actual PDF output across supported browsers and representative short/long resumes |

## Sources

- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — browser-dependent limits, best-effort persistence, eviction, and quota errors.
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — asynchronous structured client-side storage.
- [MDN: IndexedDB key characteristics and terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology) — transactions and concurrent-tab considerations.
- [MDN: StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) — persistence may be denied by the browser.
- [MDN: Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) — locale-sensitive word segmentation.
- [MDN: String.prototype.normalize()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) — Unicode normalization forms.
- [MDN: Unicode character class escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) — Unicode letters/scripts including Cyrillic; ordinary `\w` is ASCII-oriented.
- [MDN: Cross-site scripting (XSS)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS) — untrusted input handling and defenses.
- [MDN: Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) — print styles and `@page` controls.

---
*Pitfalls research for: Russian-language resume builder*
*Researched: 2026-11-04*
