import { describe, expect, it } from 'vitest';
import { createEmptyResumeData } from './resume-model';

describe('createEmptyResumeData', () => {
  it('creates an empty master profile and no saved versions', () => {
    expect(createEmptyResumeData()).toEqual({
      masterResume: {
        contacts: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
        },
        summary: '',
        skills: [],
        workExperience: [],
        education: [],
      },
      versions: [],
    });
  });

  it('returns independent nested objects and collections for each call', () => {
    const first = createEmptyResumeData();
    const second = createEmptyResumeData();

    expect(first).not.toBe(second);
    expect(first.masterResume).not.toBe(second.masterResume);
    expect(first.masterResume.contacts).not.toBe(second.masterResume.contacts);
    expect(first.masterResume.skills).not.toBe(second.masterResume.skills);
    expect(first.masterResume.workExperience).not.toBe(second.masterResume.workExperience);
    expect(first.masterResume.education).not.toBe(second.masterResume.education);
    expect(first.versions).not.toBe(second.versions);
  });
});
