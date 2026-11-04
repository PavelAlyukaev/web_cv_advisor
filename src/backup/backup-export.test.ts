import { describe, expect, it, vi } from 'vitest';
import { createEmptyResumeData, type ResumeData } from '../data/resume-model';
import { createBackupExport, startBackupDownload } from './backup-export';

function data(): ResumeData {
  const value = createEmptyResumeData();
  value.masterResume.contacts.fullName = 'Анна Иванова';
  value.versions = [
    { id: 'v1', name: 'Включена', resume: structuredClone(value.masterResume), vacancy: { title: 'Senior', company: 'A', text: 'Secret text A' }, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
    { id: 'v2', name: 'Исключена', resume: structuredClone(value.masterResume), vacancy: { title: 'Middle', company: 'B', text: 'Secret text B' }, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' },
  ];
  return value;
}

describe('backup export', () => {
  it('includes master and every version, preserving dates and per-version text choices', async () => {
    const repository = { readCurrent: vi.fn(async () => data()), replaceCurrent: vi.fn() };
    const result = await createBackupExport(repository, { v1: true, v2: false }, new Date(2026, 10, 4, 23, 59));
    const json = JSON.parse(result.json);

    expect(result.filename).toBe('resume-backup-2026-11-04.json');
    expect(json.data.masterResume.contacts.fullName).toBe('Анна Иванова');
    expect(json.data.versions).toHaveLength(2);
    expect(json.data.versions[0].vacancy.text).toBe('Secret text A');
    expect(json.data.versions[1].vacancy).toEqual({ title: 'Middle', company: 'B' });
    expect(json.data.versions[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(json.data.versions[1].updatedAt).toBe('2026-02-02T00:00:00.000Z');
  });

  it('creates a browser download and revokes the object URL afterward', () => {
    const calls: string[] = [];
    const adapter = {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn((url: string) => calls.push(`revoke:${url}`)),
      clickDownload: vi.fn((url: string, filename: string) => calls.push(`click:${url}:${filename}`)),
      schedule: (callback: () => void) => callback(),
    };
    startBackupDownload(new Blob(['{}'], { type: 'application/json' }), 'resume-backup-2026-11-04.json', adapter);

    expect(calls).toEqual(['click:blob:test:resume-backup-2026-11-04.json', 'revoke:blob:test']);
  });
});
