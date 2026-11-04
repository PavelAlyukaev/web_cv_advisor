---
phase: "01"
slug: "hranilische-dannyh-i-rezervnye-kopii"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-11-04"
---

# Phase 01 — Security

> Ретроспективная проверка мер защиты по threat register планов фазы.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → developer build | Установка сторонних пакетов в проект | Код зависимостей и lockfile |
| User-selected JSON file → parser/validator → IndexedDB | Импорт недоверенного файла после проверки и подтверждения пользователя | Персональные данные резюме |
| IndexedDB → backup serializer → downloaded file | Явный экспорт данных пользователем | Резюме, версии, при выборе — текст вакансии |
| Backup metadata → rendered preview | Значения компаний и вакансий из файла отображаются в браузере | Недоверенные текстовые метки |
| User decision → import/export side effect | Действие зависит от явного выбора в диалоге | Замена локальных данных или загрузка файла |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | npm dependencies | high | mitigate | Версии прямых зависимостей зафиксированы; `package-lock.json` включён в проект. Установка прошла после подтверждения пользователем пакетов. | closed |
| T-01-SC | Tampering | npm package installation | high | mitigate | Gate легитимности пакетов и явное подтверждение установки соблюдены; lockfile сохранён. | closed |
| T-01-02 | Tampering | backup parser, dispatcher, restore service | high | mitigate | Валидатор проверяет формат, версию, типы, поля и пределы до записи; импорт заменяет единое состояние только после подтверждения через одну IndexedDB транзакцию. Невалидные и неподдерживаемые файлы отклонены в UAT без изменения данных. | closed |
| T-01-03 | Denial of Service | selected backup file and nested arrays/strings | high | mitigate | Файлы больше 10 MiB и поля/коллекции выше ограничений отклоняются до записи. Покрыто тестами валидации и импорта. | closed |
| T-01-04 | Tampering | Import preview rendering | medium | mitigate | Метки предпросмотра выводятся как React text; UAT подтвердил предпросмотр только с количеством записей и названиями компании/вакансии, без контактных данных и полного текста. | closed |
| T-01-05 | Information Disclosure | export serializer | high | mitigate | Текст вакансии включается только при явном выборе для конкретной версии; по умолчанию исключён. Сериализатор покрыт тестами и проверен в UAT на нескольких версиях. | closed |
| T-01-06 | Information Disclosure | export dialog and browser download | high | mitigate | Перед каждым экспортом показывается предупреждение; выбор текста раздельный для версий и сбрасывается после успеха/повторного открытия. Пользователь подтвердил успешный повторный UAT после исправления поведения чекбоксов. | closed |

## Accepted Risks Log

No accepted risks.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-04 | 7 | 7 | 0 | Codex; ASVS L1 artifact and implementation review |

## Sign-Off

- [x] All threats have a disposition.
- [x] Accepted risks documented; none accepted.
- [x] `threats_open: 0` confirmed.
- [x] `status: verified` set in frontmatter.

**Approval:** verified 2026-11-04
