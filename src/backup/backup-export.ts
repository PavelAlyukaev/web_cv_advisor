import type { ResumeRepository } from '../data/resume-repository';
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, type BackupEnvelope } from './backup-format';

export interface BackupExport {
  envelope: BackupEnvelope;
  json: string;
  filename: string;
}

export interface DownloadAdapter {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  clickDownload(url: string, filename: string): void;
  schedule(callback: () => void): unknown;
}

const browserDownloadAdapter: DownloadAdapter = {
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  clickDownload(url, filename) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  },
  schedule: (callback) => globalThis.setTimeout(callback, 0),
};

function filenameDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `resume-backup-${year}-${month}-${day}.json`;
}

export async function createBackupExport(
  repository: Pick<ResumeRepository, 'readCurrent'>,
  includeVacancyText: Record<string, boolean>,
  now = new Date(),
): Promise<BackupExport> {
  const data = await repository.readCurrent();
  const exportData = structuredClone(data);
  const versions = exportData.versions.map((version) => {
    const vacancy: { title: string; company: string; text?: string } = {
      title: version.vacancy.title,
      company: version.vacancy.company,
    };
    if (includeVacancyText[version.id] === true) vacancy.text = version.vacancy.text;
    return { ...version, vacancy };
  });
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: { masterResume: exportData.masterResume, versions },
  };
  return { envelope, json: JSON.stringify(envelope, null, 2), filename: filenameDate(now) };
}

export function startBackupDownload(blob: Blob, filename: string, adapter = browserDownloadAdapter): void {
  const url = adapter.createObjectURL(blob);
  try {
    adapter.clickDownload(url, filename);
  } finally {
    adapter.schedule(() => adapter.revokeObjectURL(url));
  }
}
