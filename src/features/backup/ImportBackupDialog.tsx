import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { buildBackupPreview, parseBackupFile, restoreBackup, type BackupPreview } from '../../backup/backup-import';
import type { BackupEnvelope } from '../../backup/backup-format';
import { createEmptyResumeData } from '../../data/resume-model';
import type { ResumeRepository } from '../../data/resume-repository';

interface ImportBackupDialogProps {
  repository: ResumeRepository;
  onClose: () => void;
  onRequestCurrentBackup: () => void;
  suspended: boolean;
}

function hasSavedData(value: Awaited<ReturnType<ResumeRepository['readCurrent']>>): boolean {
  return JSON.stringify(value) !== JSON.stringify(createEmptyResumeData());
}

export function ImportBackupDialog({ repository, onClose, onRequestCurrentBackup, suspended }: ImportBackupDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const currentBackupButton = useRef<HTMLButtonElement>(null);
  const wasSuspended = useRef(false);
  const [backup, setBackup] = useState<BackupEnvelope | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [currentDataExists, setCurrentDataExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    if (wasSuspended.current && !suspended) currentBackupButton.current?.focus();
    wasSuspended.current = suspended;
  }, [suspended]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !saving) {
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setBackup(null);
    setPreview(null);
    setCurrentDataExists(false);
    setError('');
    setStatus('');
    if (!file) return;

    setLoading(true);
    try {
      const parsed = await parseBackupFile(file);
      const current = await repository.readCurrent();
      setBackup(parsed);
      setPreview(buildBackupPreview(parsed));
      setCurrentDataExists(hasSavedData(current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось проверить файл резервной копии.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!backup) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await restoreBackup(backup, true, repository);
      setStatus('Данные восстановлены.');
      window.setTimeout(onClose, 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось восстановить резервную копию.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop" hidden={suspended} aria-hidden={suspended}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-title" aria-describedby="import-description" onKeyDown={handleDialogKeyDown}>
        <div className="dialog__header">
          <div>
            <p className="eyebrow">Восстановление</p>
            <h2 id="import-title">Импорт резервной копии</h2>
          </div>
          <button ref={closeButton} className="icon-button" type="button" onClick={onClose} disabled={saving} aria-label="Закрыть окно">×</button>
        </div>
        <p id="import-description" className="dialog__intro">Выберите JSON-файл. Текущие данные будут заменены только после проверки файла и вашего подтверждения.</p>

        <label className="field-label" htmlFor="backup-file">Файл резервной копии</label>
        <input ref={fileInput} id="backup-file" className="file-input" type="file" accept="application/json,.json" onChange={handleFileChange} disabled={loading || saving} />
        {loading && <p className="inline-status" role="status">Проверяем файл…</p>}
        {error && <p className="notice notice--error" role="alert">{error}</p>}

        {preview && backup && (
          <div className="preview-panel">
            <h3>Содержимое файла</h3>
            <dl className="preview-counts">
              <div><dt>Основных резюме</dt><dd>{preview.resumeCount}</dd></div>
              <div><dt>Сохранённых версий</dt><dd>{preview.versionCount}</dd></div>
            </dl>
            {preview.vacancies.length > 0 && (
              <div>
                <h4>Компании и вакансии</h4>
                <ul className="preview-list">
                  {preview.vacancies.map(({ company, title }, index) => (
                    <li key={`${company}-${title}-${index}`}>
                      <strong>{company || 'Компания не указана'}</strong>
                      <span>{title || 'Название вакансии не указано'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentDataExists && (
              <div className="notice notice--neutral">
                <p>В браузере уже есть данные. Перед заменой можно скачать их резервную копию.</p>
                <button ref={currentBackupButton} className="text-button" type="button" onClick={onRequestCurrentBackup}>
                  Скачать текущие данные
                </button>
              </div>
            )}
            <p className="notice notice--warning">После подтверждения данные из этого файла заменят все текущие данные.</p>
            {status && <p className="notice notice--success" role="status">{status}</p>}
            <div className="dialog__actions">
              <button className="button button--secondary" type="button" onClick={onClose} disabled={saving}>Отмена</button>
              <button className="button button--danger" type="button" onClick={handleRestore} disabled={saving}>
                {saving ? 'Восстанавливаем…' : 'Заменить данные'}
              </button>
            </div>
          </div>
        )}
        {!preview && <div className="dialog__actions"><button className="button button--secondary" type="button" onClick={onClose}>Закрыть</button></div>}
      </section>
    </div>
  );
}
