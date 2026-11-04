import { useMemo, useState } from 'react';
import { createResumeRepository } from '../../data/resume-repository';
import { ExportBackupDialog } from './ExportBackupDialog';
import { ImportBackupDialog } from './ImportBackupDialog';

export function BackupPanel() {
  const repository = useMemo(() => createResumeRepository(), []);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <section className="backup-card" aria-labelledby="backup-heading">
      <div className="backup-card__copy">
        <p className="eyebrow">Ваши данные остаются в этом браузере</p>
        <h2 id="backup-heading">Резервная копия</h2>
        <p>Сохраните файл на своём устройстве или восстановите данные из копии.</p>
      </div>
      <div className="backup-actions">
        <button className="button button--primary" type="button" onClick={() => setExportOpen(true)}>
          Скачать копию
        </button>
        <button className="button button--secondary" type="button" onClick={() => setImportOpen(true)}>
          Восстановить из файла
        </button>
      </div>
      {importOpen && (
        <ImportBackupDialog
          repository={repository}
          onClose={() => setImportOpen(false)}
          onRequestCurrentBackup={() => setExportOpen(true)}
          suspended={exportOpen}
        />
      )}
      {exportOpen && (
        <ExportBackupDialog repository={repository} onClose={() => setExportOpen(false)} />
      )}
    </section>
  );
}
