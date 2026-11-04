import type { ResumeRepository } from '../data/resume-repository';
import type { ResumeData } from '../data/resume-model';
import type { BackupEnvelope } from './backup-format';
import { migrateBackup } from './backup-migrations';
import { BackupValidationError, MAX_BACKUP_BYTES } from './backup-validation';

export interface BackupPreview {
  resumeCount: 1;
  versionCount: number;
  vacancies: Array<{ company: string; title: string }>;
}

export async function parseBackupFile(file: File): Promise<BackupEnvelope> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new BackupValidationError('limit-exceeded', `Размер файла превышает ${MAX_BACKUP_BYTES / (1024 * 1024)} МБ.`);
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new BackupValidationError('invalid-json', 'Не удалось прочитать файл резервной копии.');
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new BackupValidationError('invalid-json', 'Файл не содержит корректный JSON.');
  }
  return migrateBackup(value);
}

export function buildBackupPreview(backup: BackupEnvelope): BackupPreview {
  return {
    resumeCount: 1,
    versionCount: backup.data.versions.length,
    vacancies: backup.data.versions.map(({ vacancy }) => ({ company: vacancy.company, title: vacancy.title })),
  };
}

export async function restoreBackup(
  draft: unknown,
  confirmed: boolean,
  repository: Pick<ResumeRepository, 'replaceCurrent'>,
): Promise<void> {
  const backup = migrateBackup(draft);
  if (!confirmed) return;
  const completeData: ResumeData = {
    masterResume: structuredClone(backup.data.masterResume),
    versions: backup.data.versions.map((version) => ({
      ...structuredClone(version),
      vacancy: { ...version.vacancy, text: version.vacancy.text ?? '' },
    })),
  };
  await repository.replaceCurrent(completeData);
}
