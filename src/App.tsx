import { BackupPanel } from './features/backup/BackupPanel';
import './styles.css';

export default function App() {
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">Локальный конструктор резюме</p>
        <h1>Резюме под вакансию</h1>
        <p className="lede">Подготовьте и сохраните резервную копию своих данных.</p>
      </header>
      <BackupPanel />
    </main>
  );
}
