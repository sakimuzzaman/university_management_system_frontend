"use client";

/* ------------------------------------------------------------------ */
/*  Student pages: Dashboard, Browse & Enroll, Tuition Payments.      */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState as useSearchParams } from "../hooks/hooks";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  PaginationControls,
  SearchInput,
  StatCard,
  StatusBadge,
  TableSkeleton,
} from "../components/shared";
import {
  attendanceApi,
  enrollmentApi,
  examApi,
  paymentApi,
  semesterApi,
  sectionApi,
  transcriptApi,
} from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { toastApiError, useDebounce, usePagination } from "../hooks/hooks";
import { fmtDate, fmtMoney, num } from "../lib/utils";
import type { Enrollment, Section } from "../lib/types";

/* --------------------------- Student Dashboard ----------------------- */

export function StudentDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { page, setPage } = usePagination();

  const enrollments = useQuery({
    queryKey: ["my-enrollments", page],
    queryFn: () => enrollmentApi.mine({ page, limit: 10 }),
  });
  const allEnrollments = useQuery({
    queryKey: ["my-enrollments-all"],
    queryFn: () => enrollmentApi.mine({ limit: 100 }),
  });
  const attendance = useQuery({
    queryKey: ["my-attendance-all"],
    queryFn: () => attendanceApi.mine({ limit: 100 }),
  });
  const transcript = useQuery({
    queryKey: ["my-transcript"],
    queryFn: () => transcriptApi.mine(),
  });

  const drop = useMutation({
    mutationFn: (id: string) => enrollmentApi.drop(id),
    onSuccess: () => {
      toast.success("Enrollment dropped");
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments-all"] });
    },
    onError: (e) => toastApiError(e, "Could not drop enrollment"),
  });
  const [dropping, setDropping] = React.useState<Enrollment | null>(null);

  const activeEnrollments = (allEnrollments.data?.items ?? []).filter((e) => e.status === "ENROLLED");
  const credits = activeEnrollments.reduce((t, e) => t + e.section.course.credits, 0);

  const attItems = attendance.data?.items ?? [];
  const presentCount = attItems.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = attItems.length ? Math.round((presentCount / attItems.length) * 100) : null;

  const upcomingExams = useQuery({
    queryKey: ["upcoming-exams", activeEnrollments.map((e) => e.section.id).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(
        activeEnrollments.map(async (e) => {
          const exams = await examApi.listForSection(e.section.id).catch(() => []);
          return exams.map((exam) => ({ exam, enrollment: e }));
        }),
      );
      return lists
        .flat()
        .filter(({ exam }) => new Date(exam.examDate) >= new Date())
        .sort((a, b) => a.exam.examDate.localeCompare(b.exam.examDate))
        .slice(0, 5);
    },
    enabled: activeEnrollments.length > 0,
  });

  const cgpa = transcript.data?.cumulativeGpa;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "Student"}`}
        description={
          user?.studentProfile
            ? `${user.studentProfile.studentId} · ${user.studentProfile.program.name}`
            : "Complete your student profile to unlock enrollment and payments."
        }
        actions={
          <Button asChild>
            <Link href="/dashboard/browse">Browse courses <ArrowRight /></Link>
          </Button>
        }
      />

      {!user?.studentProfile && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Profile incomplete.</span> Add your program and admission year to enroll in courses and pay tuition.
            </p>
            <Button asChild>
              <Link href="/dashboard/profile">Complete profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active enrollments" value={activeEnrollments.length} icon={BookOpen} sub={`${credits} credits this term`} />
        <StatCard label="Attendance rate" value={attendanceRate !== null ? `${attendanceRate}%` : "—"} icon={ClipboardCheck} sub={`${attItems.length} recorded sessions`} accent="bg-sky-50 text-sky-700" />
        <StatCard label="Cumulative GPA" value={cgpa !== null && cgpa !== undefined ? cgpa.toFixed(2) : "—"} icon={GraduationCap} sub={`${transcript.data?.totalAttemptedCredits ?? 0} credits attempted`} accent="bg-violet-50 text-violet-700" />
        <StatCard label="Upcoming exams" value={upcomingExams.data?.length ?? 0} icon={FileText} sub="across enrolled sections" accent="bg-amber-50 text-amber-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My enrollments</CardTitle>
              <CardDescription>Your course registrations</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/browse">Enroll more <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {enrollments.isLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : enrollments.isError ? (
              <ErrorState message="Could not load enrollments." onRetry={() => enrollments.refetch()} />
            ) : enrollments.data && enrollments.data.items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.data.items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <p className="font-semibold text-zinc-900">
                            <span className="text-emerald-700">{e.section.course.code}</span> — {e.section.course.title}
                          </p>
                          <p className="text-xs text-zinc-500">Section {e.section.sectionCode} · {e.section.course.credits} credits</p>
                        </TableCell>
                        <TableCell className="text-zinc-500">{e.section.semester.name}</TableCell>
                        <TableCell><StatusBadge status={e.status} /></TableCell>
                        <TableCell className="text-right">
                          {e.status === "ENROLLED" && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDropping(e)}>
                              Drop
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls page={enrollments.data.meta.page} totalPages={enrollments.data.meta.totalPages} onChange={setPage} />
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No enrollments yet"
                description="Browse the course catalog and enroll in your first section."
                action={<Button asChild><Link href="/dashboard/browse">Browse courses</Link></Button>}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming exams</CardTitle>
            <CardDescription>From your enrolled sections</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.isLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-xl bg-zinc-200/70" />
                <div className="h-16 animate-pulse rounded-xl bg-zinc-200/70" />
              </div>
            ) : upcomingExams.data && upcomingExams.data.length > 0 ? (
              <ul className="space-y-3">
                {upcomingExams.data.map(({ exam, enrollment }) => (
                  <li key={exam.id} className="rounded-xl border border-zinc-200 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{exam.title}</p>
                      <StatusBadge status={exam.type} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {enrollment.section.course.code} · {fmtDate(exam.examDate)} · {num(exam.maxMarks)} marks · {num(exam.weight)}% weight
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarDays} title="No upcoming exams" description="Exams for your enrolled sections will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!dropping}
        onOpenChange={(open) => !open && setDropping(null)}
        title="Drop enrollment?"
        description={`Drop ${dropping?.section.course.code} — ${dropping?.section.course.title} (Section ${dropping?.section.sectionCode})? Your seat will be released.`}
        confirmLabel="Drop course"
        destructive
        loading={drop.isPending}
        onConfirm={() => dropping && drop.mutate(dropping.id)}
      />
    </div>
  );
}

/* --------------------------- Browse & Enroll ------------------------- */

export function BrowsePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const q = searchParams.get("q") ?? "";
  const debouncedQ = useDebounce(q, 400);

  const semesters = useQuery({
    queryKey: ["browse-semesters"],
    queryFn: () => semesterApi.list({ limit: 100 }),
  });
  const openSemester = semesters.data?.items.find((s) => s.status === "REGISTRATION_OPEN");
  const semesterId = searchParams.get("semesterId") ?? openSemester?.id ?? "";

  const sections = useQuery({
    queryKey: ["browse-sections", page, debouncedQ, semesterId],
    queryFn: () => sectionApi.list({ page, limit: 12, q: debouncedQ || undefined, semesterId: semesterId || undefined }),
    enabled: !!semesterId,
  });
  const myEnrollments = useQuery({
    queryKey: ["browse-my-enrollments", semesterId],
    queryFn: () => enrollmentApi.mine({ limit: 100, semesterId: semesterId || undefined }),
    enabled: !!semesterId,
  });

  const enrolledSectionIds = new Set(
    (myEnrollments.data?.items ?? []).filter((e) => e.status === "ENROLLED").map((e) => e.section.id),
  );
  const enrolledCourseIds = new Set(
    (myEnrollments.data?.items ?? []).filter((e) => e.status === "ENROLLED").map((e) => e.section.course.id),
  );
  const creditsUsed = (myEnrollments.data?.items ?? [])
    .filter((e) => e.status === "ENROLLED")
    .reduce((t, e) => t + e.section.course.credits, 0);
  const selectedSemester = semesters.data?.items.find((s) => s.id === semesterId);
  const maxCredits = selectedSemester?.maxCredits ?? 18;

  const [enrolling, setEnrolling] = React.useState<Section | null>(null);
  const enroll = useMutation({
    mutationFn: (sectionId: string) => enrollmentApi.enroll(sectionId),
    onSuccess: () => {
      toast.success("Enrolled successfully!");
      setEnrolling(null);
      queryClient.invalidateQueries({ queryKey: ["browse-sections"] });
      queryClient.invalidateQueries({ queryKey: ["browse-my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (e) => {
      toastApiError(e, "Enrollment failed");
      setEnrolling(null);
    },
  });

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params, { replace: true });
  };

  return (
    <div>
      <PageHeader title="Browse courses" description="Find sections and enroll — seats, prerequisites, and credits are checked live." />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <Select value={semesterId || "none"} onValueChange={(v) => setParam("semesterId", v === "none" ? "" : v)}>
            <SelectTrigger className="sm:w-64" aria-label="Select semester">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.data?.items.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.status.replace(/_/g, " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchInput value={q} onChange={(v) => setParam("q", v)} placeholder="Search course code or title…" className="sm:max-w-xs sm:flex-1" />
          {selectedSemester && (
            <div className="flex items-center gap-3 sm:ml-auto">
              <StatusBadge status={selectedSemester.status} />
              <div className="min-w-32">
                <p className="text-xs font-medium text-zinc-500">Credits {creditsUsed}/{maxCredits}</p>
                <Progress value={Math.min(100, (creditsUsed / maxCredits) * 100)} className="mt-1 h-1.5" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSemester && selectedSemester.status !== "REGISTRATION_OPEN" && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            Registration is <span className="font-semibold">{selectedSemester.status.replace(/_/g, " ").toLowerCase()}</span> for {selectedSemester.name} — enrollment is only available while registration is open.
          </CardContent>
        </Card>
      )}

      {sections.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-200/70" />
          ))}
        </div>
      ) : sections.isError ? (
        <ErrorState message="Could not load sections." onRetry={() => sections.refetch()} />
      ) : sections.data && sections.data.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.data.items.map((s) => {
              const isEnrolled = enrolledSectionIds.has(s.id);
              const sameCourse = enrolledCourseIds.has(s.course.id);
              const full = s.availableSeats <= 0;
              const canEnroll = selectedSemester?.status === "REGISTRATION_OPEN" && !isEnrolled && !sameCourse && !full;
              const pct = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;
              return (
                <Card key={s.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-bold text-zinc-900">
                          <span className="text-emerald-700">{s.course.code}</span>
                        </p>
                        <p className="text-sm font-medium text-zinc-700">{s.course.title}</p>
                      </div>
                      <Badge variant="secondary">{s.course.credits} cr</Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-zinc-500">
                      <p>Section <span className="font-semibold text-zinc-800">{s.sectionCode}</span> · {s.semester.name}</p>
                      <p>{s.instructor ? `${s.instructor.user.name} — ${s.instructor.designation}` : "Instructor TBA"}</p>
                      <p>{s.schedule ?? "Schedule TBA"}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{s.enrolledCount}/{s.capacity} enrolled</span>
                        <span className={full ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
                          {full ? "Full" : `${s.availableSeats} seats left`}
                        </span>
                      </div>
                      <Progress value={pct} className="mt-1.5 h-1.5" />
                    </div>
                    <div className="mt-5 flex-1" />
                    {isEnrolled ? (
                      <Button variant="secondary" disabled className="w-full">
                        <CheckCircleIcon /> Enrolled
                      </Button>
                    ) : sameCourse ? (
                      <Button variant="outline" disabled className="w-full">
                        Enrolled in another section
                      </Button>
                    ) : full ? (
                      <Button variant="outline" disabled className="w-full">
                        Section full
                      </Button>
                    ) : (
                      <Button className="w-full" disabled={!canEnroll} onClick={() => setEnrolling(s)}>
                        Enroll
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls page={sections.data.meta.page} totalPages={sections.data.meta.totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState icon={BookOpen} title="No sections available" description="Try another semester or search term." />
      )}

      <ConfirmDialog
        open={!!enrolling}
        onOpenChange={(open) => !open && setEnrolling(null)}
        title="Confirm enrollment"
        description={
          enrolling
            ? `Enroll in ${enrolling.course.code} — ${enrolling.course.title} (Section ${enrolling.sectionCode}) for ${enrolling.semester.name}? This uses ${enrolling.course.credits} of your ${maxCredits} credit limit.`
            : ""
        }
        confirmLabel="Confirm enrollment"
        loading={enroll.isPending}
        onConfirm={() => enrolling && enroll.mutate(enrolling.id)}
      />
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* --------------------------- Tuition Payments ------------------------ */

export function PaymentsPage() {
  const { page, setPage } = usePagination();
  const [paying, setPaying] = React.useState<string | null>(null);
  const [canceling, setCanceling] = React.useState<string | null>(null);

  const semesters = useQuery({
    queryKey: ["payments-semesters"],
    queryFn: () => semesterApi.list({ limit: 100 }),
  });
  const myPayments = useQuery({
    queryKey: ["my-payments", page],
    queryFn: () => paymentApi.mine({ page, limit: 10 }),
  });
  const allPayments = useQuery({
    queryKey: ["my-payments-all"],
    queryFn: () => paymentApi.mine({ limit: 100 }),
  });

  const paymentBySemester = new Map(
    (allPayments.data?.items ?? []).map((p) => [p.semesterId, p]),
  );

  const initiate = async (semesterId: string) => {
    setPaying(semesterId);
    try {
      const res = await paymentApi.initiate(semesterId);
      toast.success("Redirecting to Stripe Checkout…");
      window.location.href = res.checkoutUrl;
    } catch (error) {
      toastApiError(error, "Could not start payment");
      setPaying(null);
    }
  };

  const cancel = async (paymentId: string) => {
    setCanceling(paymentId);
    try {
      await paymentApi.cancel(paymentId);
      toast.success("Payment canceled");
      myPayments.refetch();
      allPayments.refetch();
    } catch (error) {
      toastApiError(error, "Could not cancel payment");
    } finally {
      setCanceling(null);
    }
  };

  return (
    <div>
      <PageHeader title="Tuition payments" description="Pay semester tuition securely via Stripe Checkout. Enrollment unlocks once payment succeeds." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {semesters.isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-zinc-200/70" />
        ))}
        {semesters.data?.items.map((s) => {
          const payment = paymentBySemester.get(s.id);
          const paid = payment?.status === "SUCCEEDED";
          const isPaying = paying === s.id;
          return (
            <Card key={s.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-zinc-900">{s.name}</h2>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-900">{fmtMoney(s.tuitionFee)}</p>
                <p className="text-sm text-zinc-500">{fmtDate(s.startDate)} — {fmtDate(s.endDate)}</p>
                <div className="mt-3 flex items-center gap-2">
                  {payment ? (
                    <StatusBadge status={payment.status} />
                  ) : (
                    <Badge variant="outline">Not paid</Badge>
                  )}
                </div>
                <div className="flex-1" />
                <Button
                  className="mt-4 w-full"
                  disabled={paid || s.status === "COMPLETED" || isPaying}
                  onClick={() => initiate(s.id)}
                >
                  {isPaying ? <Loader2 className="animate-spin" /> : <CreditCard />}
                  {paid ? "Paid" : s.status === "COMPLETED" ? "Semester completed" : "Pay with Stripe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>All your tuition payments and their statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {myPayments.isLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : myPayments.isError ? (
            <ErrorState message="Could not load payments." onRetry={() => myPayments.refetch()} />
          ) : myPayments.data && myPayments.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid at</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myPayments.data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-semibold text-zinc-900">{p.semester.name}</p>
                        <p className="font-mono text-xs text-zinc-500">{p.semester.code}</p>
                      </TableCell>
                      <TableCell className="font-semibold">{fmtMoney(p.amount)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-zinc-500">{p.paidAt ? fmtDate(p.paidAt) : "—"}</TableCell>
                      <TableCell className="text-right">
                        {p.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={canceling === p.id}
                            onClick={() => cancel(p.id)}
                          >
                            {canceling === p.id ? <Loader2 className="animate-spin" /> : null} Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls page={myPayments.data.meta.page} totalPages={myPayments.data.meta.totalPages} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={Wallet} title="No payments yet" description="Your tuition payments will appear here after you pay for a semester." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
