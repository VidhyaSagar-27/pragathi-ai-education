export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'PARENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface StudentDetails {
  classGrade: string;
  section?: string;
  schoolName: string;
  parentName: string;
  location: string;
  group: string;
  photoUrl?: string;
  familyId?: string;
  studentId?: string;
  studentCode?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface InstructorDetails {
  designation: string;
  assignedModules: number[];
  assignedGroups: string[];
  photoUrl?: string;
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

export type ExamQuestionType = 'MCQ' | 'FILL_IN_BLANK' | 'THEORY' | 'ASSIGNMENT';

export interface QuizQuestion {
  id: string;
  type?: ExamQuestionType;
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  acceptableAnswers?: string[]; // for FILL_IN_BLANK
  theoryKeywords?: string[]; // key concepts for auto-evaluating THEORY questions
  modelAnswer?: string; // explanation or ideal model answer
  marks: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  moduleId: number;
  instructions: string;
  mode?: 'MCQ' | 'FILL_IN_BLANK' | 'THEORY' | 'ASSIGNMENT' | 'MIXED';
  timeLimitMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  autoDeclareResults?: boolean;
  questions: QuizQuestion[];
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface QuestionResultDetail {
  questionId: string;
  question: string;
  type: ExamQuestionType;
  studentAnswer: string | number;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  feedback?: string;
  modelAnswer?: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  moduleId: number;
  studentId: string;
  studentName: string;
  answers: Record<string, any>;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  detailedResults?: QuestionResultDetail[];
}

export interface StudentAssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  moduleId: number;
  studentId: string;
  studentName: string;
  submissionText?: string;
  submissionUrl?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
  score?: number;
  maxScore?: number;
  feedback?: string;
}

export interface NotificationLog {
  id: string;
  type: 'EMAIL' | 'SMS' | 'OTP' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  timestamp: string;
}

export interface Family {
  id: string;
  familyName: string;
  parentName: string;
  parentPhones: string[];
  parentEmails: string[];
  studentIds: string[];
  registrationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateAttemptLog {
  id: string;
  studentName: string;
  existingStudentId?: string;
  existingRegistrationId?: string;
  parentPhone: string;
  parentEmail?: string;
  submittedAt: string;
  reason: string;
  confidence: number;
  matchSignals: string[];
  rawPayload?: any;
  status: 'BLOCKED' | 'FLAGGED_FOR_REVIEW' | 'RESOLVED';
}

export interface DuplicateMatchInfo {
  matchedRecordId: string;
  type: 'STUDENT' | 'REGISTRATION';
  studentName: string;
  studentId?: string;
  registrationId?: string;
  classGrade?: string;
  guardianPhone: string;
  guardianEmail?: string;
  matchedFields: ('PHONE' | 'EMAIL' | 'NAME')[];
  matchDescription: string;
  reason?: string;
}

export interface StudentRegistration {
  id: string;
  registrationId?: string; // Sequential format: REG-2026-0001
  studentName: string;
  classGrade: string;
  section?: string;
  schoolName: string;
  parentName: string;
  mobileNumber: string;
  email?: string;
  location: string;
  photoUrl?: string;
  status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
  studentId?: string; // Permanent format: PAI26-0001
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  acceptedAt?: string;
  assignedEmail?: string;
  temporaryPassword?: string;
  familyId?: string;
  studentCode?: string;
  duplicateMatches?: DuplicateMatchInfo[];
  duplicateConfidence?: number;
  duplicateStatus?: 'NONE' | 'POSSIBLE_DUPLICATE' | 'CONFIRMED_DUPLICATE';
  flaggedMatchId?: string;
  matchSignals?: string[];
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

export interface AdminHelpRequest {
  id: string;
  requesterName: string;
  requesterRole: 'STUDENT' | 'INSTRUCTOR' | 'APPLICANT' | 'OTHER';
  requesterPhone?: string;
  requesterEmail?: string;
  studentId?: string;
  type: 'PASSWORD_RESET' | 'USER_ID_REQUEST' | 'CREDENTIALS_REQUEST' | 'GENERAL_HELP' | 'OTHER';
  subject: string;
  message: string;
  status: 'PENDING' | 'RESOLVED' | 'IN_PROGRESS';
  adminNotes?: string;
  resolvedAt?: string;
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

export interface WhatsAppConfig {
  provider?: 'META' | 'TWILIO' | 'ULTRAMSG';
  metaApiToken?: string;
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  twilioFromNumber?: string;
  ultramsgInstanceId?: string;
  ultramsgToken?: string;
}

export interface GmailConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: number;
  authorizedEmail?: string;
  connectedAt?: string;
}

export interface EmailConfig {
  provider?: 'RESEND' | 'SMTP' | 'GMAIL_API';
  resendApiKey?: string;
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
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
  whatsappConfig?: WhatsAppConfig;
  emailConfig?: EmailConfig;
  gmailConfig?: GmailConfig;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export type AutomationChannel = 'WHATSAPP' | 'EMAIL' | 'IN_APP' | 'PUSH';
export type AutomationStatus = 'SENT' | 'DELIVERED' | 'FAILED' | 'NOT_CONFIGURED' | 'RETRYING';
export type AutomationEventName =
  | 'REGISTRATION_SUBMITTED'
  | 'REGISTRATION_ACCEPTED'
  | 'REGISTRATION_REJECTED'
  | 'PASSWORD_RESET'
  | 'CREDENTIALS_DISPATCH'
  | 'CUSTOM_MESSAGE'
  | 'CLASS_REMINDER'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_REMINDER'
  | 'QUIZ_CREATED'
  | 'QUIZ_REMINDER'
  | 'RESULT_PUBLISHED'
  | 'PAYMENT_CONFIRMED'
  | 'IMPORTANT_ANNOUNCEMENT';

export interface AutomationLog {
  id: string;
  event: AutomationEventName;
  channel: AutomationChannel;
  recipient: string;
  recipientName?: string;
  studentId?: string;
  registrationId?: string;
  status: AutomationStatus;
  providerMessageId?: string;
  errorReason?: string;
  retryCount: number;
  payload?: any;
  timestamp: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  targetType?: 'REGISTRATION' | 'STUDENT' | 'AUTOMATION' | string;
  targetEntity?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface PushSubscriptionItem {
  id: string;
  studentId: string;
  subscription?: any;
  endpoint?: string;
  keys?: { p256dh: string; auth: string };
  createdAt: string;
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
  assignmentSubmissions?: StudentAssignmentSubmission[];
  notifications?: NotificationLog[];
  inAppNotifications?: InAppNotification[];
  automationLogs?: AutomationLog[];
  auditLogs?: AuditLogEntry[];
  pushSubscriptions?: PushSubscriptionItem[];
  families?: Family[];
  duplicateLogs?: DuplicateAttemptLog[];
  helpRequests?: AdminHelpRequest[];
}
