/* ------------------------------------------------------------------ */
/*  Typed service layer — one function per backend endpoint.          */
/* ------------------------------------------------------------------ */

import { apiRequest, authRequest } from "./api";
import type {
  AdminUser,
  AttendanceRecord,
  AuditLog,
  CheckoutResult,
  Course,
  DashboardStats,
  Department,
  Enrollment,
  Exam,
  InitiatePaymentResponse,
  Paginated,
  Payment,
  Program,
  Result,
  RosterStudent,
  Section,
  Semester,
  SemesterStatus,
  Transcript,
  User,
} from "./types";

type Params = Record<string, unknown>;

/* -------------------------------- Auth ------------------------------ */

export const authApi = {
  /** Sets httpOnly session cookies via the /api/auth route handler. */
  login: (email: string, password: string) =>
    authRequest<{ user: User }>("login", { email, password }),
  register: (input: { name: string; email: string; password: string; programId: string; admissionYear: number }) =>
    authRequest<{ user: User }>("register", input),
  logout: () => authRequest<Record<string, never>>("logout"),
};

/* -------------------------------- Users ----------------------------- */

export const userApi = {
  me: () => apiRequest<User>("GET", "/users/me"),
  updateMe: (input: { name?: string; avatar?: string }) =>
    apiRequest<User>("PATCH", "/users/me", { body: input }),
  createStudentProfile: (input: { programId: string; admissionYear: number }) =>
    apiRequest<User["studentProfile"]>("POST", "/users/me/student-profile", { body: input }),
};

/* ---------------------------- Departments --------------------------- */

export const departmentApi = {
  list: (params?: Params) => apiRequest<Paginated<Department>>("GET", "/departments", { params }),
  create: (input: { name: string; code: string; description?: string }) =>
    apiRequest<Department>("POST", "/departments", { body: input }),
};

/* ------------------------------ Programs ---------------------------- */

export const programApi = {
  list: (params?: Params) => apiRequest<Paginated<Program>>("GET", "/programs", { params }),
  create: (input: { name: string; code: string; departmentId: string; durationYears: number }) =>
    apiRequest<Program>("POST", "/programs", { body: input }),
};

/* ------------------------------ Courses ----------------------------- */

export const courseApi = {
  list: (params?: Params) => apiRequest<Paginated<Course>>("GET", "/courses", { params }),
  get: (id: string) => apiRequest<Course>("GET", `/courses/${id}`),
  create: (input: {
    code: string; title: string; description?: string; credits: number;
    departmentId: string; programId: string; prerequisiteIds?: string[];
  }) => apiRequest<Course>("POST", "/courses", { body: input }),
  update: (id: string, input: Partial<{
    code: string; title: string; description: string; credits: number;
    departmentId: string; programId: string; prerequisiteIds: string[];
  }>) => apiRequest<Course>("PATCH", `/courses/${id}`, { body: input }),
  remove: (id: string) => apiRequest<Record<string, never>>("DELETE", `/courses/${id}`),
};

/* ----------------------------- Semesters ---------------------------- */

export const semesterApi = {
  list: (params?: Params) => apiRequest<Paginated<Semester>>("GET", "/semesters", { params }),
  get: (id: string) => apiRequest<Semester>("GET", `/semesters/${id}`),
  create: (input: { name: string; code: string; startDate: string; endDate: string; tuitionFee: number; maxCredits?: number }) =>
    apiRequest<Semester>("POST", "/semesters", { body: input }),
  update: (id: string, input: Partial<{ name: string; startDate: string; endDate: string; tuitionFee: number; maxCredits: number }>) =>
    apiRequest<Semester>("PATCH", `/semesters/${id}`, { body: input }),
  updateStatus: (id: string, status: SemesterStatus) =>
    apiRequest<Semester>("PATCH", `/semesters/${id}/status`, { body: { status } }),
  remove: (id: string) => apiRequest<{ id: string; deletedAt: string }>("DELETE", `/semesters/${id}`),
};

/* ------------------------------ Sections ---------------------------- */

export const sectionApi = {
  list: (params?: Params) => apiRequest<Paginated<Section>>("GET", "/sections", { params }),
  get: (id: string) => apiRequest<Section>("GET", `/sections/${id}`),
  create: (input: {
    courseId: string; semesterId: string; instructorProfileId?: string;
    sectionCode: string; capacity: number; schedule?: string;
  }) => apiRequest<Section>("POST", "/sections", { body: input }),
  update: (id: string, input: { capacity?: number; schedule?: string | null }) =>
    apiRequest<Section>("PATCH", `/sections/${id}`, { body: input }),
  assignInstructor: (id: string, instructorProfileId: string | null) =>
    apiRequest<Section>("PATCH", `/sections/${id}/assign-instructor`, { body: { instructorProfileId } }),
  remove: (id: string) => apiRequest<{ id: string; deletedAt: string }>("DELETE", `/sections/${id}`),
  /**
   * Roster of enrolled students. The real backend has no dedicated roster
   * endpoint, so in real mode we derive it from attendance + exam results.
   */
  roster: (sectionId: string): Promise<RosterStudent[]> =>
    apiRequest<RosterStudent[]>(
      "GET",
      `/sections/${sectionId}/roster`,
    ),
};

/* ---------------------------- Enrollments --------------------------- */

export const enrollmentApi = {
  enroll: (sectionId: string) =>
    apiRequest<Enrollment>("POST", "/enrollments", { body: { sectionId } }),
  mine: (params?: Params) => apiRequest<Paginated<Enrollment>>("GET", "/enrollments/my", { params }),
  drop: (id: string) => apiRequest<Enrollment>("POST", `/enrollments/${id}/drop`, { body: {} }),
};

/* ----------------------------- Attendance --------------------------- */

export const attendanceApi = {
  mark: (sectionId: string, input: { date: string; records: { studentId: string; status: string }[] }) =>
    apiRequest<{ date: string; savedCount: number }>("POST", `/sections/${sectionId}/attendance`, { body: input }),
  listForSection: (sectionId: string, params?: Params) =>
    apiRequest<Paginated<AttendanceRecord>>("GET", `/sections/${sectionId}/attendance`, { params }),
  mine: (params?: Params) => apiRequest<Paginated<AttendanceRecord>>("GET", "/attendance/me", { params }),
};

/* -------------------------------- Exams ----------------------------- */

export const examApi = {
  create: (sectionId: string, input: { title: string; type: string; examDate: string; maxMarks: number; weight: number }) =>
    apiRequest<Exam>("POST", `/sections/${sectionId}/exams`, { body: input }),
  listForSection: (sectionId: string) =>
    apiRequest<Exam[]>("GET", `/sections/${sectionId}/exams`),
  remove: (examId: string) => apiRequest<{ id: string; deletedAt: string }>("DELETE", `/exams/${examId}`),
};

/* ------------------------------- Results ---------------------------- */

export const resultApi = {
  save: (examId: string, entries: { studentId: string; marks: number; remarks?: string }[]) =>
    apiRequest<{ examId: string; savedCount: number; published: boolean }>("POST", `/exams/${examId}/results`, { body: { entries } }),
  publish: (examId: string) =>
    apiRequest<{ examId: string; publishedStudentCount: number }>("POST", `/exams/${examId}/results/publish`, { body: {} }),
  listForExam: (examId: string, params?: Params) =>
    apiRequest<Paginated<Result>>("GET", `/exams/${examId}/results`, { params }),
  mine: (params?: Params) => apiRequest<Paginated<Result>>("GET", "/results/me", { params }),
};

/* ----------------------------- Transcript --------------------------- */

export const transcriptApi = {
  mine: () => apiRequest<Transcript>("GET", "/transcript/me"),
};

/* ------------------------------ Payments ---------------------------- */

export const paymentApi = {
  initiate: (semesterId: string) =>
    apiRequest<InitiatePaymentResponse>("POST", "/payments/initiate", { body: { semesterId } }),
  mine: (params?: Params) => apiRequest<Paginated<Payment>>("GET", "/payments/my", { params }),
  get: (id: string) => apiRequest<Payment>("GET", `/payments/${id}`),
  cancel: (id: string) => apiRequest<Payment>("POST", `/payments/${id}/cancel`, { body: {} }),
  refund: (id: string) => apiRequest<{ paymentId: string; refundId: string; refundStatus: string; status?: string }>("POST", `/payments/${id}/refund`, { body: {} }),
  checkoutSuccess: (sessionId: string) =>
    apiRequest<CheckoutResult>("GET", "/payments/checkout-success", { params: { session_id: sessionId } }),
  checkoutCancel: (sessionId: string) =>
    apiRequest<CheckoutResult>("GET", "/payments/checkout-cancel", { params: { session_id: sessionId } }),
};

/* -------------------------------- Admin ----------------------------- */

export const adminApi = {
  dashboardStats: () => apiRequest<DashboardStats>("GET", "/admin/dashboard-stats"),
  users: (params?: Params) =>
    apiRequest<{ users: AdminUser[]; meta: Paginated<AdminUser>["meta"] }>("GET", "/admin/users", { params }),
  user: (id: string) => apiRequest<AdminUser>("GET", `/admin/users/${id}`),
  updateRole: (id: string, role: string) =>
    apiRequest<AdminUser>("PATCH", `/admin/users/${id}/role`, { body: { role } }),
  updateStatus: (id: string, isActive: boolean) =>
    apiRequest<AdminUser>("PATCH", `/admin/users/${id}/status`, { body: { isActive } }),
  auditLogs: (params?: Params) =>
    apiRequest<{ logs: AuditLog[]; meta: Paginated<AuditLog>["meta"] }>("GET", "/admin/audit-logs", { params }),
};
