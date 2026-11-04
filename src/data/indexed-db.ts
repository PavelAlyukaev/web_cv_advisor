export const RESUME_DATABASE_NAME = 'resume-advisor';
export const RESUME_DATABASE_VERSION = 1;
export const RESUME_OBJECT_STORE = 'workspace';
export const CURRENT_RESUME_KEY = 'current';

export type StorageErrorCategory =
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'permission-denied'
  | 'transaction-aborted'
  | 'read-failed'
  | 'write-failed';

export class ResumeStorageError extends Error {
  readonly category: StorageErrorCategory;

  constructor(category: StorageErrorCategory, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ResumeStorageError';
    this.category = category;
  }
}

function categorize(error: DOMException | null, fallback: StorageErrorCategory): ResumeStorageError {
  if (error?.name === 'QuotaExceededError') {
    return new ResumeStorageError('quota-exceeded', 'Недостаточно места в браузерном хранилище.', { cause: error });
  }
  if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError') {
    return new ResumeStorageError('permission-denied', 'Браузер запретил доступ к локальному хранилищу.', { cause: error });
  }
  return new ResumeStorageError(fallback, 'Не удалось сохранить данные в браузере.', error ? { cause: error } : undefined);
}

export function openResumeDatabase(factory: IDBFactory | undefined = globalThis.indexedDB): Promise<IDBDatabase> {
  if (!factory) {
    return Promise.reject(new ResumeStorageError('storage-unavailable', 'IndexedDB недоступна в этом браузере.'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(RESUME_DATABASE_NAME, RESUME_DATABASE_VERSION);
    } catch (error) {
      reject(categorize(error instanceof DOMException ? error : null, 'storage-unavailable'));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RESUME_OBJECT_STORE)) {
        database.createObjectStore(RESUME_OBJECT_STORE);
      }
    };
    request.onerror = () => {
      if (!settled) {
        settled = true;
        reject(categorize(request.error, 'storage-unavailable'));
      }
    };
    request.onblocked = () => {
      if (!settled) {
        settled = true;
        reject(new ResumeStorageError(
          'storage-unavailable',
          'Доступ к хранилищу ожидает закрытия другой вкладки приложения.',
        ));
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) {
        database.close();
        return;
      }
      settled = true;
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
}
