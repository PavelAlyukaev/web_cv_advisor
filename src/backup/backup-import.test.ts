import { describe, expect, it, vi } from 'vitest';
import validBackup from './fixtures/valid-v1.json';
import { BackupValidationError } from './backup-validation';
import { buildBackupPreview, parseBackupFile, restoreBackup } from './backup-import';
import type { ResumeData } from '../data/resume-model';

function repository() {
  return { readCurrent: vi.fn(async () => ({ masterResume: {} }) as unknown as ResumeData), replaceCurrent: vi.fn(async () => undefined) };
}

describe('backup import', () => {
  it('checks file size before reading content', async () => {
    const text = vi.fn(async () => JSON.stringify(validBackup));
    await expect(parseBackupFile({ size: 10 * 1024 * 1024 + 1, text } as unknown as File)).rejects.toMatchObject({
      category: 'limit-exceeded',
    });
    expect(text).not.toHaveBeenCalled();
  });

  it('builds a preview with only counts and vacancy labels', async () => {
    const parsed = await parseBackupFile(new Blob([JSON.stringify(validBackup)]) as File);
    const preview = buildBackupPreview(parsed);
    expect(preview).toEqual({
      resumeCount: 1,
      versionCount: 1,
      vacancies: [{ company: 'Пример', title: 'Frontend-разработчик' }],
    });
    expect(JSON.stringify(preview)).not.toContain('Ищем React-разработчика');
    expect(preview).not.toHaveProperty('masterResume');
  });

  it('rejects malformed and unsupported backups before repository access', async () => {
    const repo = repository();
    await expect(parseBackupFile(new Blob(['{broken']) as File)).rejects.toMatchObject({ category: 'invalid-json' });
    const unsupported = { ...validBackup, schemaVersion: 2 };
    await expect(parseBackupFile(new Blob([JSON.stringify(unsupported)]) as File)).rejects.toBeInstanceOf(BackupValidationError);
    expect(repo.replaceCurrent).not.toHaveBeenCalled();
  });

  it('does not write on cancel and replaces the full state exactly once after confirmation', async () => {
    const parsed = await parseBackupFile(new Blob([JSON.stringify(validBackup)]) as File);
    const repo = repository();
    await restoreBackup(parsed, false, repo);
    expect(repo.replaceCurrent).not.toHaveBeenCalled();

    await restoreBackup(parsed, true, repo);
    expect(repo.replaceCurrent).toHaveBeenCalledTimes(1);
    expect(repo.replaceCurrent).toHaveBeenCalledWith(parsed.data);
  });
});
