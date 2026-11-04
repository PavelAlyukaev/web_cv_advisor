import { createEmptyResumeData, type ResumeData } from './resume-model';
import {
  CURRENT_RESUME_KEY,
  openResumeDatabase,
  RESUME_OBJECT_STORE,
  ResumeStorageError,
  type StorageErrorCategory,
} from './indexed-db';

export interface ResumeRepository {
  readCurrent(): Promise<ResumeData>;
  replaceCurrent(data: ResumeData): Promise<void>;
}

function transactionError(transaction: IDBTransaction, fallback: StorageErrorCategory): ResumeStorageError {
  if (transaction.error?.name === 'AbortError') {
    return new ResumeStorageError('transaction-aborted', 'Изменения не сохранены: транзакция была отменена.', {
      cause: transaction.error,
    });
  }
  if (transaction.error?.name === 'QuotaExceededError') {
    return new ResumeStorageError('quota-exceeded', 'Недостаточно места в браузерном хранилище.', {
      cause: transaction.error,
    });
  }
  return new ResumeStorageError(fallback, 'Не удалось выполнить операцию с локальными данными.', {
    cause: transaction.error ?? undefined,
  });
}

export function createResumeRepository(factory?: IDBFactory): ResumeRepository {
  return {
    async readCurrent() {
      const database = await openResumeDatabase(factory);
      return new Promise<ResumeData>((resolve, reject) => {
        let data: ResumeData | undefined;
        let settled = false;
        const fail = (error: Error) => {
          if (!settled) {
            settled = true;
            database.close();
            reject(error);
          }
        };
        let transaction: IDBTransaction;
        try {
          transaction = database.transaction(RESUME_OBJECT_STORE, 'readonly');
        } catch (error) {
          fail(new ResumeStorageError('read-failed', 'Не удалось открыть данные резюме.', { cause: error }));
          return;
        }

        const request = transaction.objectStore(RESUME_OBJECT_STORE).get(CURRENT_RESUME_KEY);
        request.onsuccess = () => {
          data = request.result as ResumeData | undefined;
        };
        request.onerror = () => fail(transactionError(transaction, 'read-failed'));
        transaction.oncomplete = () => {
          settled = true;
          database.close();
          resolve(data ?? createEmptyResumeData());
        };
        transaction.onerror = () => fail(transactionError(transaction, 'read-failed'));
        transaction.onabort = () => fail(transactionError(transaction, 'read-failed'));
      });
    },

    async replaceCurrent(data) {
      const database = await openResumeDatabase(factory);
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const fail = (error: Error) => {
          if (!settled) {
            settled = true;
            database.close();
            reject(error);
          }
        };
        let transaction: IDBTransaction;
        try {
          transaction = database.transaction(RESUME_OBJECT_STORE, 'readwrite');
        } catch (error) {
          database.close();
          fail(new ResumeStorageError('write-failed', 'Не удалось начать сохранение резюме.', { cause: error }));
          return;
        }

        transaction.oncomplete = () => {
          if (!settled) {
            settled = true;
            database.close();
            resolve();
          }
        };
        transaction.onerror = () => fail(transactionError(transaction, 'write-failed'));
        transaction.onabort = () => fail(transactionError(transaction, 'transaction-aborted'));
        try {
          transaction.objectStore(RESUME_OBJECT_STORE).put(data, CURRENT_RESUME_KEY);
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            // The transaction may already have aborted after the request error.
          }
          fail(new ResumeStorageError('write-failed', 'Не удалось записать данные резюме.', { cause: error }));
        }
      });
    },
  };
}
