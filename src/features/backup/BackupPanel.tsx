import { useMemo, useRef, useState } from 'react';
import { createResumeRepository } from '../../data/resume-repository';
import { ExportBackupDialog } from './ExportBackupDialog';
import { ImportBackupDialog } from './ImportBackupDialog';

export function BackupPanel() {
  const repository = useMemo(() => createResumeRepository(), []);
  const exportTrigger = useRef<HTMLButtonElement>(null);
  const importTrigger = useRef<HTMLButtonElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  function closeImport() {
    setImportOpen(false);
    window.setTimeout(() => importTrigger.current?.focus(), 0);
  }

  function closeExport() {
    setExportOpen(false);
    if (!importOpen) window.setTimeout(() => exportTrigger.current?.focus(), 0);
  }

  return (
    <section className="backup-card" aria-labelledby="backup-heading">
      <div className="backup-card__copy">
        <p className="eyebrow">Ваши данные остаются в этом браузере</p>
        <h2 id="backup-heading">Резервная копия</h2>
        <p>Сохраните файл на своём устройстве или восстановите данные из копии.</p>
      </div>
      <div className="backup-actions">
        <button ref={exportTrigger} className="button button--primary" type="button" onClick={() => setExportOpen(true)}>
          Скачать копию
        </button>
        <button ref={importTrigger} className="button button--secondary" type="button" onClick={() => setImportOpen(true)}>
          Восстановить из файла
        </button>
      </div>
      {importOpen && (
        <ImportBackupDialog
          repository={repository}
          onClose={closeImport}
          onRequestCurrentBackup={() => setExportOpen(true)}
          suspended={exportOpen}
        />
      )}
      {exportOpen && (
        <ExportBackupDialog repository={repository} onClose={closeExport} />
      )}
    </section>
  );
}
