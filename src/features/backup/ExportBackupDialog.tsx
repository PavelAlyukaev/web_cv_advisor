import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createBackupExport, startBackupDownload } from '../../backup/backup-export';
import type { ResumeRepository } from '../../data/resume-repository';

interface ExportBackupDialogProps {
  repository: ResumeRepository;
  onClose: () => void;
}

export function ExportBackupDialog({ repository, onClose }: ExportBackupDialogProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [versions, setVersions] = useState<Array<{ id: string; name: string; company: string; title: string }>>([]);
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !exporting) {
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

  useEffect(() => {
    let active = true;
    repository.readCurrent().then((data) => {
      if (!active) return;
      setVersions(data.versions.map(({ id, name, vacancy }) => ({ id, name, company: vacancy.company, title: vacancy.title })));
      setChoices(Object.fromEntries(data.versions.map(({ id }) => [id, false])));
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Не удалось прочитать данные для экспорта.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [repository]);

  async function handleExport() {
    setExporting(true);
    setError('');
    setStatus('');
    try {
      const result = await createBackupExport(repository, choices);
      startBackupDownload(new Blob([result.json], { type: 'application/json;charset=utf-8' }), result.filename);
      setStatus(`Файл ${result.filename} подготовлен к скачиванию.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подготовить резервную копию.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="dialog-backdrop">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" aria-describedby="export-description" onKeyDown={handleDialogKeyDown}>
        <div className="dialog__header">
          <div>
            <p className="eyebrow">Экспорт данных</p>
            <h2 id="export-title">Скачать резервную копию</h2>
          </div>
          <button ref={closeButton} className="icon-button" type="button" onClick={onClose} disabled={exporting} aria-label="Закрыть окно">×</button>
        </div>
        <p id="export-description" className="notice notice--warning">JSON-файл содержит личные данные и не защищён паролем. Храните его в надёжном месте.</p>
        {loading && <p className="inline-status" role="status">Загружаем список версий…</p>}
        {error && <p className="notice notice--error" role="alert">{error}</p>}
        {!loading && versions.length > 0 && (
          <fieldset className="choice-list">
            <legend>Текст вакансии в каждой версии</legend>
            <p className="field-hint">По умолчанию полный текст вакансии не включается в копию.</p>
            {versions.map((version) => (
              <label className="choice-item" key={version.id}>
                <input
                  type="checkbox"
                  checked={choices[version.id] === true}
                  onChange={(event) => setChoices((current) => ({ ...current, [version.id]: event.currentTarget.checked }))}
                />
                <span>
                  <strong>{version.name}</strong>
                  <small>{[version.company, version.title].filter(Boolean).join(' · ') || 'Вакансия не указана'}</small>
                  <span className="choice-item__question">Включить полный текст вакансии?</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {!loading && versions.length === 0 && <p className="field-hint">Будет сохранено основное резюме. Сохранённых версий пока нет.</p>}
        {status && <p className="notice notice--success" role="status">{status}</p>}
        <div className="dialog__actions">
          <button className="button button--secondary" type="button" onClick={onClose} disabled={exporting}>Отмена</button>
          <button className="button button--primary" type="button" onClick={handleExport} disabled={loading || exporting || Boolean(error)}>
            {exporting ? 'Готовим файл…' : 'Подтвердить и скачать'}
          </button>
        </div>
      </section>
    </div>
  );
}
