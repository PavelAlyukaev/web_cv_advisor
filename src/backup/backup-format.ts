import type { ResumeProfile, ResumeVersion } from '../data/resume-model';

export const BACKUP_FORMAT = 'resume-backup' as const;
export const BACKUP_SCHEMA_VERSION = 1 as const;

export type BackupVersion = Omit<ResumeVersion, 'vacancy'> & {
  vacancy: { title: string; company: string; text?: string };
};

export interface BackupData {
  masterResume: ResumeProfile;
  versions: BackupVersion[];
}

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  data: BackupData;
}
