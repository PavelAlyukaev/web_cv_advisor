import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, type BackupData, type BackupEnvelope, type BackupVersion } from './backup-format';
import type { EducationEntry, ResumeProfile, WorkExperience } from '../data/resume-model';

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const MAX_SAVED_VERSIONS = 500;
export const MAX_PROFILE_ENTRIES = 500;
export const MAX_TEXT_LENGTH = 100_000;

export type BackupValidationCategory =
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-version'
  | 'invalid-data'
  | 'limit-exceeded';

export class BackupValidationError extends Error {
  readonly category: BackupValidationCategory;

  constructor(category: BackupValidationCategory, message: string) {
    super(message);
    this.name = 'BackupValidationError';
    this.category = category;
  }
}

function invalid(message: string): never {
  throw new BackupValidationError('invalid-data', `Резервная копия повреждена: ${message}`);
}

function limit(message: string): never {
  throw new BackupValidationError('limit-exceeded', `Резервная копия превышает допустимый объём: ${message}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    invalid(`неверный набор полей (${label}).`);
  }
}

function string(value: unknown, label: string, max = MAX_TEXT_LENGTH): asserts value is string {
  if (typeof value !== 'string') invalid(`поле «${label}» должно быть строкой.`);
  if (value.length > max) limit(`поле «${label}» длиннее ${max} символов.`);
}

function isoDate(value: unknown, label: string): asserts value is string {
  string(value, label, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    invalid(`поле «${label}» должно содержать дату ISO 8601.`);
  }
}

function validateStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value)) invalid(`поле «${label}» должно быть массивом.`);
  if (value.length > MAX_PROFILE_ENTRIES) limit(`слишком много значений в «${label}».`);
  value.forEach((item, index) => string(item, `${label}[${index}]`));
}

function validateWork(value: unknown, ids: Set<string>): asserts value is WorkExperience[] {
  if (!Array.isArray(value)) invalid('опыт работы должен быть массивом.');
  if (value.length > MAX_PROFILE_ENTRIES) limit('слишком много записей об опыте работы.');
  value.forEach((entry, index) => {
    if (!isObject(entry)) invalid(`запись опыта ${index + 1} имеет неверный формат.`);
    exactKeys(entry, ['id', 'company', 'position', 'location', 'startDate', 'endDate', 'isCurrent', 'description'], 'опыт работы');
    string(entry.id, 'id опыта', 200);
    uniqueId(entry.id, ids);
    for (const key of ['company', 'position', 'location', 'startDate', 'endDate', 'description']) string(entry[key], key);
    if (typeof entry.isCurrent !== 'boolean') invalid('поле «isCurrent» должно быть логическим.');
  });
}

function validateEducation(value: unknown, ids: Set<string>): asserts value is EducationEntry[] {
  if (!Array.isArray(value)) invalid('образование должно быть массивом.');
  if (value.length > MAX_PROFILE_ENTRIES) limit('слишком много записей об образовании.');
  value.forEach((entry, index) => {
    if (!isObject(entry)) invalid(`запись образования ${index + 1} имеет неверный формат.`);
    exactKeys(entry, ['id', 'institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'description'], 'образование');
    string(entry.id, 'id образования', 200);
    uniqueId(entry.id, ids);
    for (const key of ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'description']) string(entry[key], key);
  });
}

function uniqueId(value: string, ids: Set<string>): void {
  if (!value.trim() || ids.has(value)) invalid('идентификаторы записей должны быть непустыми и уникальными.');
  ids.add(value);
}

function validateProfile(value: unknown, ids: Set<string>, label: string): asserts value is ResumeProfile {
  if (!isObject(value)) invalid(`профиль «${label}» имеет неверный формат.`);
  exactKeys(value, ['contacts', 'summary', 'skills', 'workExperience', 'education'], `профиль ${label}`);
  if (!isObject(value.contacts)) invalid(`контакты профиля «${label}» имеют неверный формат.`);
  exactKeys(value.contacts, ['fullName', 'email', 'phone', 'location'], 'контакты');
  for (const field of ['fullName', 'email', 'phone', 'location']) string(value.contacts[field], field, 10_000);
  string(value.summary, 'краткое описание');
  validateStringArray(value.skills, 'навыки');
  validateWork(value.workExperience, ids);
  validateEducation(value.education, ids);
}

function validateVersion(value: unknown, ids: Set<string>): asserts value is BackupVersion {
  if (!isObject(value)) invalid('сохранённая версия имеет неверный формат.');
  exactKeys(value, ['id', 'name', 'resume', 'vacancy', 'createdAt', 'updatedAt'], 'версия');
  string(value.id, 'id версии', 200);
  uniqueId(value.id, ids);
  string(value.name, 'название версии', 10_000);
  validateProfile(value.resume, new Set(), 'сохраненная версия');
  if (!isObject(value.vacancy)) invalid('описание вакансии имеет неверный формат.');
  const vacancyKeys = Object.keys(value.vacancy);
  if (vacancyKeys.length !== 2 && vacancyKeys.length !== 3) invalid('неверный набор полей (вакансия).');
  if (!vacancyKeys.includes('title') || !vacancyKeys.includes('company') || vacancyKeys.some((key) => !['title', 'company', 'text'].includes(key))) {
    invalid('неверный набор полей (вакансия).');
  }
  for (const field of ['title', 'company']) string(value.vacancy[field], `вакансия.${field}`);
  if ('text' in value.vacancy) string(value.vacancy.text, 'вакансия.text');
  isoDate(value.createdAt, 'createdAt');
  isoDate(value.updatedAt, 'updatedAt');
}

function validateData(value: unknown): asserts value is BackupData {
  if (!isObject(value)) invalid('данные резюме отсутствуют.');
  exactKeys(value, ['masterResume', 'versions'], 'данные резюме');
  const ids = new Set<string>();
  validateProfile(value.masterResume, new Set(), 'основное резюме');
  if (!Array.isArray(value.versions)) invalid('список версий имеет неверный формат.');
  if (value.versions.length > MAX_SAVED_VERSIONS) limit(`допускается не более ${MAX_SAVED_VERSIONS} версий.`);
  value.versions.forEach((version) => validateVersion(version, ids));
}

export function validateBackup(value: unknown): BackupEnvelope {
  if (!isObject(value)) throw new BackupValidationError('invalid-format', 'Файл не является резервной копией резюме.');
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError('unsupported-version', `Версия резервной копии ${String(value.schemaVersion)} не поддерживается.`);
  }
  if (value.format !== BACKUP_FORMAT) throw new BackupValidationError('invalid-format', 'Формат файла не поддерживается.');
  exactKeys(value, ['format', 'schemaVersion', 'exportedAt', 'data'], 'конверт резервной копии');
  isoDate(value.exportedAt, 'exportedAt');
  validateData(value.data);
  return value as unknown as BackupEnvelope;
}
