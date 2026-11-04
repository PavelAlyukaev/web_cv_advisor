/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import validV1 from './fixtures/valid-v1.json';
import manualMultiVersion from './fixtures/manual-multi-v1.json';
import unsupportedVersion from './fixtures/unsupported-version.json';
import invalidFields from './fixtures/invalid-fields.json';
import overLimit from './fixtures/over-limit.json';
import malformed from './fixtures/malformed.json?raw';
import { migrateBackup } from './backup-migrations';
import { BackupValidationError, validateBackup } from './backup-validation';

describe('backup format validation', () => {
  it('accepts the complete supported v1 envelope', () => {
    expect(validateBackup(validV1).schemaVersion).toBe(1);
  });

  it('accepts the manual two-version UAT fixture', () => {
    expect(validateBackup(manualMultiVersion).data.versions).toHaveLength(2);
  });

  it('rejects unsupported versions with an actionable category', () => {
    expect(() => migrateBackup(unsupportedVersion)).toThrowError(
      expect.objectContaining({ category: 'unsupported-version' }),
    );
  });

  it('rejects malformed JSON syntax', () => {
    expect(() => JSON.parse(malformed)).toThrow(SyntaxError);
  });

  it('rejects invalid fields and non-ISO dates', () => {
    expect(() => validateBackup(invalidFields)).toThrowError(
      expect.objectContaining({ category: 'invalid-data' }),
    );
  });

  it.each(['2025-02-30T12:00:00.000Z', '2025-04-31T12:00:00.000Z'])('rejects impossible calendar date %s', (date) => {
    const backup = structuredClone(validV1) as Record<string, any>;
    backup.exportedAt = date;
    expect(() => validateBackup(backup)).toThrowError(
      expect.objectContaining({ category: 'invalid-data' }),
    );
  });

  it('accepts leap day on a leap year', () => {
    const backup = structuredClone(validV1) as Record<string, any>;
    backup.exportedAt = '2024-02-29T12:00:00.000Z';
    expect(validateBackup(backup).exportedAt).toBe(backup.exportedAt);
  });

  it('rejects duplicate version identifiers and unknown object fields', () => {
    const backup = structuredClone(validV1) as Record<string, any>;
    backup.data.versions.push(structuredClone(backup.data.versions[0]));
    expect(() => validateBackup(backup)).toThrowError(BackupValidationError);

    const withUnknown = structuredClone(validV1) as Record<string, any>;
    withUnknown.extra = true;
    expect(() => validateBackup(withUnknown)).toThrowError(
      expect.objectContaining({ category: 'invalid-data' }),
    );
  });

  it('rejects content over declared structural limits', () => {
    const backup = structuredClone(overLimit) as Record<string, any>;
    backup.data.masterResume.summary = 'x'.repeat(100_001);
    expect(() => validateBackup(backup)).toThrowError(
      expect.objectContaining({ category: 'limit-exceeded' }),
    );
  });
});
