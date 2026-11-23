
export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type SemesterStatus =
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "ONGOING"
  | "COMPLETED";

export type EnrollmentStatus = "ENROLLED" | "DROPPED" | "COMPLETED";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type ExamType = "QUIZ" | "MIDTERM" | "FINAL" | "ASSIGNMENT";

/** Prisma Decimal fields serialize as strings over JSON. */
export type Decimal = string | number;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  errors: { path?: string; message: string }[];
}

/* ------------------------------- Users ------------------------------ */

export interface ProgramRef {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  programId: string;
  admissionYear: number;
  program: ProgramRef;
}

export interface InstructorProfile {
  id: string;
  employeeId: string;
  designation: string;
  departmentId?: string;
  department: DepartmentRef;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  studentProfile: StudentProfile | null;
  instructorProfile: InstructorProfile | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  profileComplete?: boolean;
}

/* ---------------------------- Academics ----------------------------- */

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  durationYears: number;
  department: DepartmentRef;
}

export interface CoursePrerequisiteRef {
  prerequisite: { id: string; code: string; title: string };
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  createdAt: string;
  department: DepartmentRef;
  program: ProgramRef;
  prerequisites: CoursePrerequisiteRef[];
}

export interface Semester {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  tuitionFee: Decimal;
  maxCredits: number;
  createdAt: string;
}

export interface SectionInstructorRef {
  id: string;
  employeeId: string;
  designation: string;
  user: { id: string; name: string };
}

export interface Section {
  id: string;
  courseId: string;
  semesterId: string;
  instructorId: string | null;
  sectionCode: string;
  capacity: number;
  enrolledCount: number;
  schedule: string | null;
  createdAt: string;
  availableSeats: number;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
    departmentId?: string;
    programId?: string;
  };
  semester: {
    id: string;
    name: string;
    code: string;
    status: SemesterStatus;
    startDate?: string;
    endDate?: string;
    maxCredits?: number;
  };
  instructor: SectionInstructorRef | null;
}

export interface Enrollment {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  droppedAt: string | null;
  section: {
    id: string;
    sectionCode: string;
    course: { id?: string; code: string; title: string; credits: number };
    semester: { id?: string; name: string; code: string };
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  student?: {
    id: string;
    studentId: string;
    user: { id: string; name: string };
  };
  markedBy?: { id: string; name: string };
  section?: {
    id: string;
    sectionCode: string;
    course: { code: string; title: string };
    semester: { name: string; code: string };
  };
}

export interface Exam {
  id: string;
  sectionId: string;
  title: string;
  type: ExamType;
  examDate: string;
  maxMarks: Decimal;
  weight: Decimal;
  createdAt: string;
}

export interface Result {
  id: string;
  marks: Decimal;
  grade: string | null;
  remarks: string | null;
  published: boolean;
  student?: {
    id: string;
    studentId: string;
    user: { id: string; name: string; email: string };
  };
  exam?: {
    id: string;
    title: string;
    type: ExamType;
    examDate: string;
    maxMarks: Decimal;
    weight: Decimal;
    section: {
      sectionCode: string;
      course: { code: string; title: string };
      semester: { name: string; code: string };
    };
  };
}

export interface TranscriptCourse {
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatus;
  sectionCode: string;
  course: { id: string; code: string; title: string; credits: number };
  assessmentComplete: boolean;
  finalized: boolean;
  percentage: number | null;
  grade: string | null;
  gradePoints: number | null;
}

export interface TranscriptSemester {
  id: string;
  name: string;
  code: string;
  status: SemesterStatus;
  courses: TranscriptCourse[];
  gpa: number | null;
  attemptedCredits: number;
  earnedCredits: number;
}

export interface Transcript {
  studentId: string;
  cumulativeGpa: number | null;
  totalAttemptedCredits: number;
  semesters: TranscriptSemester[];
}

/* ----------------------------- Payments ----------------------------- */

export interface Payment {
  id: string;
  userId: string;
  semesterId: string;
  amount: Decimal;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  semester: { id: string; name: string; code: string; status?: SemesterStatus };
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string | null;
  user?: { id: string; name: string; email: string };
}

export interface InitiatePaymentResponse {
  paymentId: string;
  semester: { id: string; name: string; code: string };
  amount: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl: string;
  checkoutSessionId: string;
  expiresAt: string | null;
}

export interface CheckoutResult {
  id: string;
  status: PaymentStatus;
  amount: Decimal;
  currency: string;
  semester: { name: string; code: string };
  note?: string;
}

/* ------------------------------- Admin ------------------------------ */

export interface DashboardStats {
  users: { total: number; students: number; instructors: number; admins: number };
  academic: {
    departments: number;
    programs: number;
    courses: number;
    semesters: number;
    sections: number;
    enrollments: number;
  };
  payments: {
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
    canceled: number;
    refunded: number;
    totalRevenueUSD: number;
  };
  auditLogs: { total: number };
}

export interface AdminUser extends User {
  googleId?: string | null;
  payments?: Payment[];
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string; role: Role } | null;
}

/** Demo-only roster endpoint (not present on the real backend). */
export interface RosterStudent {
  studentProfileId: string;
  studentId: string;
  name: string;
  email: string;
  enrollmentId: string;
}
