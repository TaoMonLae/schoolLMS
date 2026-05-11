export const roles = ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT", "CASE_MANAGER"] as const;

export type Role = (typeof roles)[number];

export type SchoolSummary = {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  customDomain?: string;
  subdomain?: string;
  city: string;
  country: string;
  activeStudents: number;
  activeClasses: number;
};

export type TenantScoped = {
  schoolId: string;
};

export const genders = ["FEMALE", "MALE", "NON_BINARY", "NOT_SPECIFIED"] as const;
export type Gender = (typeof genders)[number];

export const studentStatuses = ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN"] as const;
export type StudentStatus = (typeof studentStatuses)[number];

export const refugeeDocumentTypes = ["UNHCR_CARD", "ASYLUM_SEEKER_CERTIFICATE", "COMMUNITY_LETTER", "PASSPORT", "OTHER"] as const;
export type RefugeeDocumentType = (typeof refugeeDocumentTypes)[number];

export const attendanceStatuses = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const videoProviders = ["YOUTUBE", "VIMEO", "PRIVATE"] as const;
export type VideoProvider = (typeof videoProviders)[number];

export const videoVisibilities = ["CLASS_ONLY", "SCHOOL", "PRIVATE"] as const;
export type VideoVisibility = (typeof videoVisibilities)[number];

export const assignmentStatuses = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export type AssignmentStatus = (typeof assignmentStatuses)[number];

export const submissionStatuses = ["NOT_SUBMITTED", "SUBMITTED", "GRADED", "LATE"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const examStatuses = ["DRAFT", "SCHEDULED", "COMPLETED"] as const;
export type ExamStatus = (typeof examStatuses)[number];

export const caseNoteSensitivities = ["BASIC", "SENSITIVE"] as const;
export type CaseNoteSensitivity = (typeof caseNoteSensitivities)[number];

export const referralStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export type ReferralStatus = (typeof referralStatuses)[number];

export const sponsorSupportStatuses = ["ACTIVE", "PAUSED", "ENDED"] as const;
export type SponsorSupportStatus = (typeof sponsorSupportStatuses)[number];

export type SchoolClassOption = {
  id: string;
  name: string;
  teacherId?: string;
};

export type StudentRecord = TenantScoped & {
  id: string;
  studentNumber: string;
  legalName: string;
  preferredName: string;
  gender: Gender;
  status: StudentStatus;
  photoUrl?: string;
  dateOfBirth?: string;
  primaryLanguage?: string;
  classId: string;
  className: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  homeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRelationship?: string;
  unhcrStatus?: string;
  documentType?: RefugeeDocumentType;
  documentNumber?: string;
  documentExpiryDate?: string;
  deletedAt?: string;
};

export type AppUser = {
  id: string;
  schoolId?: string;
  role: Role;
  assignedClassIds: string[];
  studentId?: string;
  approvedForSensitiveCaseNotes?: boolean;
};
