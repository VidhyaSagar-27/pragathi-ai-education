export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface StudentDetails {
  classGrade: string;
  schoolName: string;
  parentName: string;
  location: string;
  group: string;
}

export interface InstructorDetails {
  designation: string;
  assignedModules: number[];
  assignedGroups: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  studentDetails?: StudentDetails;
  instructorDetails?: InstructorDetails;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleItem {
  id: number;
  number: number;
  title: string;
  iconName: string;
  topics: string[];
  learningOutcome: string;
  description?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  moduleId: number;
  type: 'NOTE' | 'PDF' | 'DOCUMENT';
  description: string;
  fileUrl: string;
  fileName: string;
  isPublished: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  moduleId: number;
  description: string;
  url: string;
  provider: 'YOUTUBE' | 'GOOGLE_DRIVE' | 'DIRECT';
  isPublished: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  moduleId: number;
  instructions: string;
  dueDate: string;
  targetGroup: string;
  attachmentUrl?: string;
  isPublished: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  moduleId: number;
  instructions: string;
  timeLimitMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  questions: QuizQuestion[];
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  moduleId: number;
  studentId: string;
  studentName: string;
  answers: Record<string, number>;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface StudentRegistration {
  id: string;
  studentName: string;
  classGrade: string;
  schoolName: string;
  parentName: string;
  mobileNumber: string;
  email?: string;
  location: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface SchoolPartnership {
  id: string;
  schoolName: string;
  contactPerson: string;
  designation: string;
  mobileNumber: string;
  email: string;
  schoolLocation: string;
  message: string;
  status: 'PENDING' | 'CONTACTED' | 'IN_DISCUSSION' | 'CONFIRMED';
  adminNotes?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  description: string;
  learningOutcomes: string;
  isPublished: boolean;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  caption: string;
  isPublished: boolean;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  isPublished: boolean;
  createdAt: string;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  schoolOrOrg: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetRole: 'ALL' | 'STUDENT' | 'INSTRUCTOR';
  targetGroup: string;
  authorName: string;
  createdAt: string;
}

export interface CertificateItem {
  id: string;
  studentId: string;
  studentName: string;
  certificateNumber: string;
  programName: string;
  issueDate: string;
  status: 'ISSUED';
}

export interface WebsiteSettings {
  websiteName: string;
  programName: string;
  tagline: string;
  heroHeading: string;
  heroTagline: string;
  heroDescription: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  aboutOverview: string;
  missionStatement: string;
  visionStatement: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  settings: WebsiteSettings;
  users: User[];
  modules: ModuleItem[];
  materials: StudyMaterial[];
  videos: VideoItem[];
  assignments: Assignment[];
  quizzes: Quiz[];
  quizSubmissions: QuizSubmission[];
  registrations: StudentRegistration[];
  partnerships: SchoolPartnership[];
  messages: ContactMessage[];
  activities: ActivityItem[];
  gallery: GalleryItem[];
  achievements: AchievementItem[];
  testimonials: TestimonialItem[];
  announcements: Announcement[];
  certificates: CertificateItem[];
}
