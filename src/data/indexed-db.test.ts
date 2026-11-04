import { afterEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { createEmptyResumeData, type ResumeData } from './resume-model';
import { createResumeRepository } from './resume-repository';

const makeData = (): ResumeData => {
  const data = createEmptyResumeData();
  data.masterResume.contacts.fullName = 'Анна Иванова';
  data.versions.push({
    id: 'version-1',
    name: 'Версия frontend',
    resume: structuredClone(data.masterResume),
    vacancy: { title: 'Frontend-разработчик', company: 'Пример', text: 'React' },
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  });
  return data;
};

afterEach(async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('resume-advisor');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
});

describe('resume IndexedDB repository', () => {
  it('returns an independent empty model when there is no current record', async () => {
    const repository = createResumeRepository();
    const first = await repository.readCurrent();
    first.masterResume.contacts.fullName = 'Changed';
    const second = await repository.readCurrent();

    expect(second).toEqual(createEmptyResumeData());
    expect(second).not.toBe(first);
  });

  it('persists and reopens the complete master profile and versions', async () => {
    const repository = createResumeRepository();
    const expected = makeData();

    await repository.replaceCurrent(expected);

    expect(await createResumeRepository().readCurrent()).toEqual(expected);
  });

  it('keeps the previously committed state when a replacement cannot be cloned', async () => {
    const repository = createResumeRepository();
    const previous = makeData();
    await repository.replaceCurrent(previous);
    const invalid = makeData();
    (invalid.masterResume as unknown as { invalid: () => void }).invalid = () => undefined;

    await expect(repository.replaceCurrent(invalid)).rejects.toMatchObject({
      category: 'write-failed',
    });
    expect(await repository.readCurrent()).toEqual(previous);
  });

  it('surfaces browser storage permission failures with a stable category', async () => {
    const factory = {
      open: vi.fn(() => { throw new DOMException('blocked', 'SecurityError'); }),
    } as unknown as IDBFactory;

    await expect(createResumeRepository(factory).readCurrent()).rejects.toMatchObject({
      category: 'permission-denied',
    });
  });

  it('closes the database connection when a read request fails', async () => {
    const openRequestState = {
      result: undefined as IDBDatabase | undefined,
      onupgradeneeded: null,
      onerror: null,
      onblocked: null,
      onsuccess: null,
    };
    const openRequest = openRequestState as unknown as IDBOpenDBRequest;
    const readRequest = { onsuccess: null, onerror: null } as unknown as IDBRequest;
    const transaction = {
      error: new DOMException('read failed', 'UnknownError'),
      objectStore: vi.fn(() => ({ get: vi.fn(() => readRequest) })),
      oncomplete: null,
      onerror: null,
      onabort: null,
    } as unknown as IDBTransaction;
    const database = {
      objectStoreNames: { contains: () => true },
      close: vi.fn(),
      transaction: vi.fn(() => transaction),
      onversionchange: null,
    } as unknown as IDBDatabase;
    const factory = { open: vi.fn(() => openRequest) } as unknown as IDBFactory;
    const result = createResumeRepository(factory).readCurrent();

    openRequestState.result = database;
    openRequest.onsuccess?.(new Event('success'));
    await Promise.resolve();
    const rejected = expect(result).rejects.toMatchObject({ category: 'read-failed' });
    readRequest.onerror?.(new Event('error'));

    await rejected;
    expect(database.close).toHaveBeenCalledOnce();
  });
});
