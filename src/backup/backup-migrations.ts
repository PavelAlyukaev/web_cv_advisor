import { BACKUP_SCHEMA_VERSION, type BackupEnvelope } from './backup-format';
import { BackupValidationError, validateBackup } from './backup-validation';

export function migrateBackup(value: unknown): BackupEnvelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BackupValidationError('invalid-format', 'Файл не является резервной копией резюме.');
  }
  const schemaVersion = (value as Record<string, unknown>).schemaVersion;
  if (schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError('unsupported-version', `Версия резервной копии ${String(schemaVersion)} не поддерживается.`);
  }
  return structuredClone(validateBackup(value));
}
