export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeProfile {
  contacts: ContactInfo;
  summary: string;
  skills: string[];
  workExperience: WorkExperience[];
  education: EducationEntry[];
}

export interface VacancySnapshot {
  title: string;
  company: string;
  text: string;
}

export interface ResumeVersion {
  id: string;
  name: string;
  resume: ResumeProfile;
  vacancy: VacancySnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  masterResume: ResumeProfile;
  versions: ResumeVersion[];
}

export function createEmptyResumeData(): ResumeData {
  return {
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
  };
}
