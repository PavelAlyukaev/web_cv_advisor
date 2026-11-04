# Feature Landscape

**Domain:** Russian-language resume builder with vacancy-specific tailoring
**Researched:** 2026-11-04
**Confidence:** MEDIUM — common resume workflow expectations are supported by career-service guidance and current product documentation; exact priorities for Russian-speaking users still need user validation.

## Table Stakes

Features users expect from the core workflow. Missing one makes the main promise difficult to deliver.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Structured, editable master resume | The user needs one source of accurate facts before creating job-specific versions. | Medium | Start with contact details, professional summary, skills, work history, and education. Work entries need employer, title, dates, and editable accomplishment/description text; education needs institution, program/qualification, and dates. Support multiple entries and reverse-chronological display. |
| Vacancy-specific keyword and skill analysis | Matching the resume to a job description is the product's central value. Career guidance recommends identifying requirements and comparing them with the candidate's experience. | Medium | Accept pasted vacancy text; show matched terms and terms not found in the resume, grouped by skills, role/qualification, and other phrases where practical. Show the source phrase and where a match occurs. |
| Manual, user-controlled tailoring | Users need to decide which real experience is relevant and preserve accuracy. Current guidance stresses adapting relevant experience while proofreading for accuracy. | Medium | Let users edit text and choose which skills, experience entries, and sections appear in each version. Recommendations should lead to edits the user can review; they must not silently rewrite facts. |
| Separate versions linked to vacancies | Job-specific editing should not overwrite the master resume or another application version. Multiple saved resumes are a documented feature in job-application products. | Medium | Store a version snapshot with vacancy title/company, source vacancy text (optional but useful), last-updated date, and link to the master. Support reopen, rename, duplicate, and delete. |
| PDF export with preview | A shareable, printable document is an expected outcome for resume builders. CareerOneStop recommends PDF when no format is specified, and Resume.com documents PDF as its format-preserving download. | Medium | Preview before export; preserve section order and line breaks, use a readable standard layout, and verify Cyrillic rendering and selectable text. PDF should contain only the selected version's content. |
| Browser-local persistence | No-account use only works if a returning user can find their resume in the same browser. | Medium | Prefer structured browser storage over a small synchronous key/value store as the data model grows. Explain that browser data can be cleared or evicted; provide backup/export and restore or import so local-only storage does not imply guaranteed backup. |
| Clear, standard section labels and readable formatting | Resume readers need to locate experience, education, and skills quickly; standard labels and simple layouts are recommended by CareerOneStop. | Low | Avoid presenting an “ATS pass” guarantee. A readable PDF and standard headings are practical formatting choices, not proof of compatibility with every employer system. |

## Differentiators

Valuable ways to make this product especially trustworthy and useful. These are recommendations, not assumptions that every resume builder includes them.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explainable match results | Users can see why a phrase was counted and decide what to do next. | Medium | Display exact vacancy terms, resume locations, and whether a term is an exact match or a likely variation. Avoid a single opaque “ATS score” or promises of interview outcomes. |
| Russian-aware matching | Russian inflection, spelling variants, and abbreviations can make literal string comparison miss relevant matches. | Medium–High | Begin with normalization (case, punctuation, whitespace) and a small, editable synonym/abbreviation map. Treat broader stemming or lemmatization as an upgrade after testing against real Russian vacancy text; show users uncertain matches for review. |
| Honest “not found” recommendations | Helps candidates identify evidence they may have forgotten without inventing qualifications. | Low–Medium | For each unmatched requirement, ask the user whether they have relevant evidence. Allow adding it only through an explicit edit; otherwise retain the gap as a gap. |
| Base-to-version change summary | Reduces mistakes when adapting several resumes and helps users remember what changed for each application. | Medium | Show included/hidden sections and text differences, with a way to restore content from the master. This complements the requested saved versions. |
| Local-first privacy and user ownership | A no-account workflow avoids asking for an account before the user can try the core value. | Low–Medium | State plainly that data stays in this browser and that clearing browser data or switching devices can remove or strand it. Keep backup/restore and clear-all controls visible. Do not claim privacy/security guarantees beyond the actual implementation. |
| Several simple, text-first layouts | Lets users choose a polished look without undermining readability. | Medium | Start with one dependable layout and add a small set of variations only after export quality is stable. Standard headings, restrained typography, and predictable text flow should remain consistent. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Claiming a score predicts ATS success, interview probability, or hiring outcome | A keyword comparison cannot reproduce every employer's screening configuration or hiring decision. | Describe results as a transparent text/skill comparison. Explain that a match does not guarantee selection. |
| Automatically inserting missing skills or rewriting achievements as facts | This can make a candidate's experience inaccurate or misleading. LinkedIn's current resume guidance tells users to verify suggestions for authenticity. | Show suggestions as prompts, require explicit user edits, and preserve the original text for review. |
| Keyword stuffing or blindly repeating every vacancy phrase | Career advice warns against unnatural keyword stuffing; relevance and truthful evidence matter. | Prioritize terms backed by the user's actual experience and let them dismiss irrelevant requirements. |
| Destructive edits to the master resume | Tailoring one application could remove facts needed for a later application. | Keep a master record and create independent vacancy-specific snapshots or overrides. |
| Requiring registration before a first resume or analysis | It conflicts with the selected friction-light, local-first first release. | Let users reach the core workflow without an account. Consider optional sync/accounts only after validating the workflow. |
| Cloud upload or third-party analysis without an explicit need and clear disclosure | Resumes contain contact and employment data; remote processing would contradict the first-release local-storage decision. | Keep analysis client-side for v1. If remote features are introduced later, disclose what is sent and ask for consent. |
| Complex templates that depend on graphics, columns, or icons to convey essential facts | Decorative layouts can reduce readability and make exported documents harder to parse consistently. | Use simple layouts with standard headings and preserve all key information in text. |
| Expanding v1 into job-board search, applications, messaging, or a full job tracker | These do not establish whether resume creation and tailoring solve the core problem. | Keep the first release focused on resume creation, comparison, tailoring, saved versions, and PDF export. |

## Feature Dependencies

```text
Resume data model and master editor
  → browser persistence and backup/restore
  → vacancy text input and comparison
  → manual per-vacancy edits and version snapshots
  → preview and PDF export

Standard resume sections and layout
  → consistent vacancy comparison across structured fields
  → predictable PDF output
```

## MVP Recommendation

Prioritize:

1. A structured, editable master resume with contact information, skills, work history, and education.
2. Local persistence with a clear backup/restore path and a way to delete stored data.
3. Pasted vacancy text with transparent matched and unmatched terms, plus user-controlled edits.
4. Independent, named versions tied to vacancies so adapting one application never damages the master.
5. A preview and readable Russian-language PDF export.

Defer synonym/lemmatization coverage beyond basic Russian-aware normalization, multiple elaborate templates, AI-generated rewriting, accounts/synchronization, job tracking, and application submission. Validate matching quality with real Russian job descriptions before making stronger claims.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core resume sections and readability | HIGH | CareerOneStop explicitly covers education, standard headings, and readable formatting. |
| Vacancy tailoring and keyword comparison | MEDIUM | Current career guidance supports identifying requirements and tailoring; product examples confirm the match/report pattern, but specific matching quality varies. |
| PDF and saved versions | MEDIUM | PDF download and multiple saved resume workflows are documented in product help. Exact user expectations in the Russian market are unvalidated. |
| Local storage durability | HIGH | MDN documents browser persistence limitations and user/browser deletion or eviction scenarios. |
| Russian-language matching quality | LOW–MEDIUM | Inflection and terminology variation are a product-specific risk inferred from the chosen language; validate with Russian vacancy examples and users. |

## Sources

- [Indeed: Tailoring Your Resume to a Job Description](https://www.indeed.com/career-advice/resumes-cover-letters/tailoring-resume) — updated August 12, 2026; analyze requirements, emphasize relevant experience, use keywords carefully, proofread, and avoid relying on inaccurate generated content.
- [CareerOneStop: Education](https://cloudfront.careeronestop.org/JobSearch/Resumes/ResumeGuide/education.aspx) — standard education entries and ordering guidance.
- [CareerOneStop: Formatting](https://cloudfront.careeronestop.org/JobSearch/Resumes/ResumeGuide/formatting.aspx) — standard section headings, readable formatting, and PDF guidance when no format is specified.
- [Resume.com Help Center: Download or print a resume](https://support.resume.com/hc/en-us/articles/360008081051-How-do-I-print-or-download-my-resume) — PDF preserves the selected template's presentation.
- [LinkedIn Help: Reuse a recently used resume](https://www.linkedin.com/help/linkedin/answer/a512405/reusing-a-recently-used-resume-for-a-job-application-on-linkedin?lang=en) — documents retaining multiple resumes for reuse.
- [LinkedIn Help: Resume Tips](https://www.linkedin.com/help/linkedin/answer/a6861967) — current tailored feedback and export workflow; explicitly advises verifying authenticity and accuracy.
- [MDN: IndexedDB key characteristics and limitations](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology) — browser-local persistence, same-origin scope, no built-in synchronization, and possible browser/user data removal.
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — browser-specific quotas and best-effort persistence/eviction behavior.
