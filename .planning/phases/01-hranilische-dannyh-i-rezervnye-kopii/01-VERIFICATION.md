---
phase: 01-hranilische-dannyh-i-rezervnye-kopii
verified: 2026-11-04T10:49:09Z
status: human_needed
score: 7/10 must-haves verified
covered_files:
  - .gitignore
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/WINDOWS.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-01-PLAN.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-01-SUMMARY.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-02-PLAN.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-02-SUMMARY.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-03-PLAN.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-03-SUMMARY.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-REVIEW-DISPOSITION.md
  - .planning/phases/01-hranilische-dannyh-i-rezervnye-kopii/01-REVIEW.md
  - README.md
  - index.html
  - package-lock.json
  - package.json
  - src/App.tsx
  - src/backup/backup-export.test.ts
  - src/backup/backup-export.ts
  - src/backup/backup-format.ts
  - src/backup/backup-import.test.ts
  - src/backup/backup-import.ts
  - src/backup/backup-migrations.ts
  - src/backup/backup-validation.test.ts
  - src/backup/backup-validation.ts
  - src/backup/fixtures/invalid-fields.json
  - src/backup/fixtures/malformed.json
  - src/backup/fixtures/over-limit.json
  - src/backup/fixtures/unsupported-version.json
  - src/backup/fixtures/valid-v1.json
  - src/data/indexed-db.test.ts
  - src/data/indexed-db.ts
  - src/data/resume-model.test.ts
  - src/data/resume-model.ts
  - src/data/resume-repository.ts
  - src/features/backup/BackupPanel.tsx
  - src/features/backup/ExportBackupDialog.tsx
  - src/features/backup/ImportBackupDialog.tsx
  - src/main.tsx
  - src/styles.css
  - src/test/setup.ts
  - tsconfig.json
  - vite.config.ts
covered_digest: "v4:sha256:e75b0df7249860462bf8d6ee4a4c3c01fdaeecaafa268416b802f607209bb375"
behavior_unverified: 3
overrides_applied: 0
behavior_unverified_items:
  - truth: "The user can review a safe import summary and confirm or cancel before current data is replaced."
    test: "Import a valid JSON backup through the browser, inspect preview, then cancel and confirm replacement in separate attempts."
    expected: "Preview excludes full resume/vacancy text; cancel leaves the prior dataset unchanged; confirmation replaces the complete dataset."
    why_human: "The service tests cover validation and replacement semantics, but the real browser file-picker and UI state flow were not exercised with seeded data."
  - truth: "The user sees a fresh vacancy-text choice for every version on each export."
    test: "Import a backup containing at least two saved versions, export once with different choices, then export again."
    expected: "Every new attempt starts unchecked; the file contains all versions and timestamps and only the selected full vacancy texts."
    why_human: "Serializer tests cover inclusion/exclusion, while the multi-version UI selection and downloaded file were not inspected in a browser."
  - truth: "When current browser data exists, import offers a backup of it before replacement."
    test: "With a non-empty local dataset, select another valid backup and use the current-data backup offer before confirming replacement."
    expected: "The shared export warning and choices appear; declining the download still leaves an explicit replacement confirmation."
    why_human: "The callback is wired in code, but the offer depends on non-empty IndexedDB state that was not seeded in the browser."
human_verification:
  - test: "Восстановление и защита текущих данных в браузере"
    expected: "Загрузить валидную копию, затем другую копию: предпросмотр показывает только счётчики и названия; до подтверждения доступно скачивание текущих данных; отмена сохраняет исходные данные, подтверждение заменяет полный набор. Невалидная и неподдерживаемая копии не изменяют данные."
    why_human: "Сервисные тесты проверяют валидацию, отсутствие записи при отмене и одну атомарную замену, но браузерный сценарий с выбранным файлом и существующими данными не был выполнен."
  - test: "Экспорт нескольких версий с выбором текста вакансии"
    expected: "Для двух и более версий предупреждение показывается при каждой попытке, каждый новый экспорт начинает с неотмеченных вариантов, в скачанном JSON остаются все версии и даты, а полный текст есть только у отмеченных версий."
    why_human: "Тесты сериализатора покрывают включение/исключение текста и сохранение дат; браузерная проверка выбора нескольких версий и проверки скачанного файла не выполнена."
  - test: "Предложение сохранить текущую копию перед заменой"
    expected: "Когда в IndexedDB уже есть данные, диалог импорта предлагает скачать текущую копию через общий экспортный диалог до подтверждения замены."
    why_human: "Код связан через callback, но UI с непустым текущим хранилищем не проверен в браузере."
---

# Фаза 1: проверка хранилища и резервных копий

**Цель фазы:** подготовить локальную основу для приёма, сохранения и переноса профиля резюме и связанных версий.

**Статус:** `human_needed` — реализация и автоматические проверки проходят; три пользовательских сценария с выбранными файлами и несколькими версиями ожидают ручной проверки.

## Проверяемые истины

| # | Истина | Статус | Фактическое свидетельство |
|---:|---|---|---|
| 1 | Приложение собирается как локальный Vite + React + TypeScript проект без сервера аккаунтов. | VERIFIED | `npm run build` завершился успешно; `src/main.tsx` монтирует локальный `App`, удалённых API вызовов нет. |
| 2 | Модель представляет основное резюме и независимые сохранённые версии с данными вакансии и датами. | VERIFIED | `src/data/resume-model.ts`; `src/data/resume-model.test.ts` проверяет пустую модель и независимые вложенные объекты. |
| 3 | Приложение читает и атомарно заменяет весь набор резюме в IndexedDB. | VERIFIED | `src/data/indexed-db.ts` и `src/data/resume-repository.ts`; named test `keeps the previously committed state when a replacement cannot be cloned` прошёл, также есть тест сохранения/повторного чтения. |
| 4 | Резервная копия содержит явный формат и schema version, основное резюме, все версии и их даты. | VERIFIED | `backup-format.ts`, строгая runtime-валидация, тест `includes master and every version, preserving dates and per-version text choices` прошёл. |
| 5 | Данные полностью валидируются до записи, а подтверждённый импорт заменяет набор ровно один раз. | VERIFIED | `backup-import.ts` вызывает валидацию до preview/restore; named test `does not write on cancel and replaces the full state exactly once after confirmation` прошёл. UI-клик по подтверждению дополнительно проверяется в ручном сценарии ниже. |
| 6 | Экспорт включает все версии, но может исключить полный текст вакансии по отдельному выбору. | VERIFIED | Сервисный тест экспорта проверяет обе версии, даты и per-version выбор текста; диалог передаёт `choices` в `createBackupExport`. |
| 7 | Пользователь видит безопасный предпросмотр и может отменить замену до перезаписи данных. | PRESENT_BEHAVIOR_UNVERIFIED | `ImportBackupDialog.tsx` рендерит только счётчики/названия и вызывает restore только отдельной кнопкой; сервисный тест отмены проходит, но загрузка файла через реальный file picker не проверена. См. ручной сценарий 1. |
| 8 | При наличии текущих данных импорт предлагает скачать их до замены. | PRESENT_BEHAVIOR_UNVERIFIED | В диалоге условие `currentDataExists` показывает callback в общий экспорт. UI с непустой IndexedDB пока не проверен. См. ручной сценарий 3. |
| 9 | Каждая попытка экспорта показывает предупреждение и требует свежего выбора текста для каждой версии. | PRESENT_BEHAVIOR_UNVERIFIED | Предупреждение повторно показано при повторном открытии диалога; после успешного экспорта choices сбрасываются. Для нескольких версий и содержимого скачанного файла требуется ручная проверка. См. ручной сценарий 2. |
| 10 | Скачиваемый файл использует дату в имени и несёт выбранные данные. | VERIFIED | UI smoke показал статус `resume-backup-2026-11-04.json`; сериализаторный тест проверяет выбранные данные и сохранение версий/дат. |

**Результат:** 7/10 истин подтверждены полностью; 3 поведения реализации присутствуют и связаны, но UI end-to-end требует ручного подтверждения.

## Артефакты и связи

Все обязательные артефакты трёх планов существуют и прошли проверки GSD `verify.artifacts` (9/9). Все ключевые связи прошли `verify.key-links` (6/6): entry point → React app, import UI → validated restore → repository и export UI → serializer → repository.

Цепочка данных проходит от выбранного JSON файла через размерную и структурную проверку к redacted preview и атомарному IndexedDB replacement. Экспорт читает весь набор из репозитория, применяет выбор для каждого version ID и передаёт JSON в browser download adapter, который отзывает object URL.

## Автоматические и браузерные проверки

| Проверка | Результат |
|---|---|
| `npm run build` | PASS — `tsc --noEmit` и Vite production build. |
| `npm test` | PASS — 5 файлов, 21 тест; отключённых тестов не найдено. |
| Named import test | PASS — отмена не пишет, подтверждение вызывает одну замену всего состояния. |
| Named export test | PASS — все версии/даты сохранены, текст включается отдельно для каждой версии. |
| Named IndexedDB rollback test | PASS — предыдущая запись остаётся доступной после неудачной замены. |
| Browser smoke | PASS — диалоги открываются, повторное предупреждение отображается, имя файла содержит локальную дату, фокус возвращается на кнопки-триггеры. |
| Seeded import и multi-version UI acceptance | NEEDS HUMAN — детальные шаги указаны выше. |

Проверка review замечаний: чистый повторный `01-REVIEW.md`; все 3 прежних замечания имеют `fixed` disposition в `01-REVIEW-DISPOSITION.md`.

## Покрытие требований

| Требование | План | Статус | Свидетельство |
|---|---|---|---|
| DATA-01 — экспорт основного резюме и сохранённых версий в JSON | 01-01, 01-02, 01-03 | NEEDS HUMAN | Тесты сериализатора и smoke имени/предупреждения проходят; выбор нескольких версий в скачанном browser JSON ожидает ручной проверки. |
| DATA-02 — импорт ранее созданной JSON-копии | 01-01, 01-02, 01-03 | NEEDS HUMAN | Validator, preview/restore service, cancellation и atomic replace проверены unit-тестами; файловый UI flow ожидает ручной проверки. |

Таблица прослеживаемости `REQUIREMENTS.md` синхронизирована с текущим состоянием: DATA-01/02 реализованы, браузерное подтверждение осталось.

### Аудит качества тестов

| Файл | Связанные требования | Активные тесты | Пропущенные | Уровень утверждений | Итог |
|---|---|---:|---:|---|---|
| `src/data/indexed-db.test.ts` | DATA-02 | 4 | 0 | Поведенческий: чтение/запись/повторное чтение, rollback | PASS |
| `src/backup/backup-validation.test.ts` | DATA-01, DATA-02 | 9 | 0 | Значения и граничные условия схемы | PASS |
| `src/backup/backup-import.test.ts` | DATA-02 | 4 | 0 | Поведенческий: invalid/cancel/one replacement | PASS |
| `src/backup/backup-export.test.ts` | DATA-01 | 2 | 0 | Поведенческий: версии/даты/выбор текста/download cleanup | PASS |
| `src/data/resume-model.test.ts` | DATA-01, DATA-02 | 2 | 0 | Значения и независимость модели | PASS |

**Отключённых тестов:** 0. **Циклических проверок:** 0 выявлено. **Недостаточных утверждений:** нет для проверяемых сервисных контрактов; UI acceptance остаётся отдельной ручной проверкой.

## Анти-паттерны

`TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, заглушек `placeholder`, `dangerouslySetInnerHTML`, `console.log` и удалённых `fetch()` в просмотренных source-файлах не найдено. Тесты содержат активные assertions; skipped/only тестов не обнаружено.

## Ручная проверка

1. Восстановление и защита текущих данных в браузере (подробности в frontmatter выше).
2. Экспорт нескольких версий с выбором текста вакансии (подробности в frontmatter выше).
3. Предложение сохранить текущую копию перед заменой (подробности в frontmatter выше).

До подтверждения этих сценариев фазу следует считать реализованной, но не принятой пользователем.
