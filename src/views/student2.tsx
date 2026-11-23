"use client";

/* ------------------------------------------------------------------ */
/*  Student pages: Attendance, Results, Transcript, Profile.          */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState as useSearchParams } from "../hooks/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  Printer,
  Save,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
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
  EmptyState,
  ErrorState,
  FormField,
  GradeBadge,
  PageHeader,
  PaginationControls,
  StatCard,
  StatusBadge,
  TableSkeleton,
  UserAvatar,
} from "../components/shared";
import { attendanceApi, programApi, resultApi, semesterApi, transcriptApi, userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { toastApiError, usePagination } from "../hooks/hooks";
import { fmtDate, fmtPercent, num } from "../lib/utils";

/* ------------------------------ Attendance --------------------------- */

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const semesterId = searchParams.get("semesterId") ?? "";

  const semesters = useQuery({
    queryKey: ["attendance-semesters"],
    queryFn: () => semesterApi.list({ limit: 100 }),
  });
  const records = useQuery({
    queryKey: ["my-attendance", page, semesterId],
    queryFn: () => attendanceApi.mine({ page, limit: 10, semesterId: semesterId || undefined }),
  });
  const allRecords = useQuery({
    queryKey: ["my-attendance-all", semesterId],
    queryFn: () => attendanceApi.mine({ limit: 100, semesterId: semesterId || undefined }),
  });

  const items = allRecords.data?.items ?? [];
  const counts = {
    PRESENT: items.filter((a) => a.status === "PRESENT").length,
    ABSENT: items.filter((a) => a.status === "ABSENT").length,
    LATE: items.filter((a) => a.status === "LATE").length,
    EXCUSED: items.filter((a) => a.status === "EXCUSED").length,
  };
  const rate = items.length
    ? Math.round(((counts.PRESENT + counts.LATE + counts.EXCUSED) / items.length) * 100)
    : null;

  return (
    <div>
      <PageHeader title="Attendance" description="Your recorded attendance across all sections." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={semesterId || "all"}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams);
            if (v === "all") params.delete("semesterId");
            else params.set("semesterId", v);
            params.delete("page");
            setSearchParams(params, { replace: true });
          }}
        >
          <SelectTrigger className="sm:w-64" aria-label="Filter by semester">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {semesters.data?.items.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendance rate" value={rate !== null ? `${rate}%` : "—"} icon={ClipboardCheck} sub={`${items.length} sessions recorded`} />
        <StatCard label="Present" value={counts.PRESENT} icon={ClipboardCheck} accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Absent" value={counts.ABSENT} icon={ClipboardCheck} accent="bg-red-50 text-red-700" />
        <StatCard label="Late" value={counts.LATE} icon={ClipboardCheck} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Excused" value={counts.EXCUSED} icon={ClipboardCheck} accent="bg-sky-50 text-sky-700" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Attendance records</CardTitle>
          <CardDescription>Most recent first</CardDescription>
        </CardHeader>
        <CardContent>
          {records.isLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : records.isError ? (
            <ErrorState message="Could not load attendance." onRetry={() => records.refetch()} />
          ) : records.data && records.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.data.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{fmtDate(r.date)}</TableCell>
                      <TableCell>
                        {r.section ? (
                          <>
                            <span className="font-semibold text-zinc-900">
                              <span className="text-emerald-700">{r.section.course.code}</span> — {r.section.course.title}
                            </span>
                            <span className="block text-xs text-zinc-500">Section {r.section.sectionCode}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500">{r.section?.semester.name ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls page={records.data.meta.page} totalPages={records.data.meta.totalPages} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={CalendarDays} title="No attendance records" description="Attendance marked by your instructors will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------- Results ----------------------------- */

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const semesterId = searchParams.get("semesterId") ?? "";

  const semesters = useQuery({
    queryKey: ["results-semesters"],
    queryFn: () => semesterApi.list({ limit: 100 }),
  });
  const results = useQuery({
    queryKey: ["my-results", page, semesterId],
    queryFn: () => resultApi.mine({ page, limit: 10, semesterId: semesterId || undefined }),
  });

  return (
    <div>
      <PageHeader title="Results" description="Published exam results — only results released by your instructors are shown." />

      <div className="mb-5">
        <Select
          value={semesterId || "all"}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams);
            if (v === "all") params.delete("semesterId");
            else params.set("semesterId", v);
            params.delete("page");
            setSearchParams(params, { replace: true });
          }}
        >
          <SelectTrigger className="sm:w-64" aria-label="Filter by semester">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {semesters.data?.items.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published results</CardTitle>
          <CardDescription>Marks, percentages, and letter grades</CardDescription>
        </CardHeader>
        <CardContent>
          {results.isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : results.isError ? (
            <ErrorState message="Could not load results." onRetry={() => results.refetch()} />
          ) : results.data && results.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.data.items.map((r) => {
                    const max = num(r.exam?.maxMarks ?? 0);
                    const pct = max > 0 ? (num(r.marks) / max) * 100 : 0;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-semibold text-zinc-900">{r.exam?.title ?? "—"}</p>
                          <p className="text-xs text-zinc-500">{r.exam ? fmtDate(r.exam.examDate) : ""}</p>
                        </TableCell>
                        <TableCell>
                          {r.exam ? (
                            <>
                              <span className="font-medium text-zinc-900">
                                <span className="text-emerald-700">{r.exam.section.course.code}</span> — {r.exam.section.course.title}
                              </span>
                              <span className="block text-xs text-zinc-500">{r.exam.section.semester.name}</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {num(r.marks)}<span className="text-zinc-400">/{max}</span>
                        </TableCell>
                        <TableCell>{fmtPercent(pct)}</TableCell>
                        <TableCell><GradeBadge grade={r.grade} /></TableCell>
                        <TableCell className="max-w-48 truncate text-zinc-500">{r.remarks ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls page={results.data.meta.page} totalPages={results.data.meta.totalPages} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={FileText} title="No published results" description="Results published by your instructors will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Transcript --------------------------- */

export function TranscriptPage() {
  const transcript = useQuery({
    queryKey: ["my-transcript-page"],
    queryFn: () => transcriptApi.mine(),
  });

  return (
    <div>
      <PageHeader
        title="Academic transcript"
        description="Official record of your completed coursework and grades."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        }
      />

      {transcript.isLoading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-2xl bg-zinc-200/70" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200/70" />
        </div>
      ) : transcript.isError ? (
        <ErrorState message="Could not load transcript." onRetry={() => transcript.refetch()} />
      ) : transcript.data && transcript.data.semesters.length > 0 ? (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Cumulative GPA</p>
                  <p className="mt-2 font-display text-5xl font-bold tracking-tight">
                    {transcript.data.cumulativeGpa !== null ? transcript.data.cumulativeGpa.toFixed(2) : "—"}
                    <span className="text-xl text-zinc-400"> / 4.00</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 sm:text-right">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Student ID</p>
                    <p className="mt-1 font-mono text-lg font-semibold">{transcript.data.studentId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Credits attempted</p>
                    <p className="mt-1 font-display text-lg font-semibold">{transcript.data.totalAttemptedCredits}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {transcript.data.semesters.map((sem) => (
            <Card key={sem.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{sem.name}</CardTitle>
                  <CardDescription>
                    {sem.code} · {sem.attemptedCredits} attempted · {sem.earnedCredits} earned credits
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sem.status} />
                  <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
                    GPA {sem.gpa !== null ? sem.gpa.toFixed(2) : "—"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Grade points</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sem.courses.map((c) => (
                      <TableRow key={c.enrollmentId}>
                        <TableCell>
                          <p className="font-semibold text-zinc-900">
                            <span className="text-emerald-700">{c.course.code}</span> — {c.course.title}
                          </p>
                          <p className="text-xs text-zinc-500">Section {c.sectionCode}</p>
                        </TableCell>
                        <TableCell>{c.course.credits}</TableCell>
                        <TableCell>{c.percentage !== null ? fmtPercent(c.percentage) : "—"}</TableCell>
                        <TableCell><GradeBadge grade={c.grade} /></TableCell>
                        <TableCell>{c.gradePoints !== null ? c.gradePoints.toFixed(1) : "—"}</TableCell>
                        <TableCell>
                          {c.finalized ? (
                            <span className="text-xs font-semibold text-emerald-700">Finalized</span>
                          ) : c.assessmentComplete ? (
                            <span className="text-xs font-semibold text-sky-700">Awaiting semester completion</span>
                          ) : (
                            <span className="text-xs font-semibold text-zinc-500">In progress</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="No transcript data yet" description="Enroll in courses and complete a semester to generate your transcript." />
      )}
    </div>
  );
}

/* ------------------------------- Profile ----------------------------- */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  avatar: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const studentProfileSchema = z.object({
  programId: z.string().min(1, "Please select a program"),
  admissionYear: z.number().int().min(2000).max(2100),
});

type StudentProfileForm = z.infer<typeof studentProfileSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", avatar: user?.avatar ?? "" },
  });

  React.useEffect(() => {
    if (user) form.reset({ name: user.name, avatar: user.avatar ?? "" });
  }, [user, form]);

  const update = useMutation({
    mutationFn: (values: ProfileForm) =>
      userApi.updateMe({ name: values.name, avatar: values.avatar || undefined }),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toastApiError(e, "Could not update profile"),
  });

  const programs = useQuery({
    queryKey: ["profile-programs"],
    queryFn: () => programApi.list({ limit: 100 }),
    enabled: !user?.studentProfile,
  });

  const spForm = useForm<StudentProfileForm>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: { programId: "", admissionYear: new Date().getFullYear() },
  });

  const createProfile = useMutation({
    mutationFn: (values: StudentProfileForm) =>
      userApi.createStudentProfile({ programId: values.programId, admissionYear: Number(values.admissionYear) }),
    onSuccess: async () => {
      toast.success("Student profile created");
      const me = await userApi.me();
      updateUser(me);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toastApiError(e, "Could not create profile"),
  });

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information and student profile." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <UserAvatar name={user.name} src={user.avatar} className="mx-auto h-24 w-24 text-2xl" />
            <h2 className="mt-4 font-display text-xl font-bold text-zinc-900">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-3 flex justify-center gap-2">
              <StatusBadge status={user.role} />
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {user.studentProfile && (
              <div className="mt-5 space-y-2 rounded-2xl bg-zinc-50 p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Student ID</span><span className="font-mono font-semibold">{user.studentProfile.studentId}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Program</span><span className="font-semibold">{user.studentProfile.program.code}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Admission</span><span className="font-semibold">{user.studentProfile.admissionYear}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Update how your name and avatar appear across the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit((v) => update.mutate(v))} noValidate className="space-y-4">
                <FormField label="Full name" htmlFor="profile-name" error={form.formState.errors.name?.message} required>
                  <Input id="profile-name" {...form.register("name")} />
                </FormField>
                <FormField label="Avatar URL" htmlFor="profile-avatar" error={form.formState.errors.avatar?.message} hint="Optional — link to a profile image">
                  <Input id="profile-avatar" placeholder="https://…" {...form.register("avatar")} />
                </FormField>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {!user.studentProfile && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Complete your student profile</CardTitle>
                <CardDescription>Required before you can pay tuition or enroll in courses.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={spForm.handleSubmit((v) => createProfile.mutate(v))} noValidate className="space-y-4">
                  <FormField label="Program" htmlFor="sp-program" error={spForm.formState.errors.programId?.message} required>
                    <Select value={spForm.watch("programId")} onValueChange={(v) => spForm.setValue("programId", v)}>
                      <SelectTrigger id="sp-program"><SelectValue placeholder="Select your program" /></SelectTrigger>
                      <SelectContent>
                        {programs.data?.items.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Admission year" htmlFor="sp-year" error={spForm.formState.errors.admissionYear?.message} required>
                    <Input id="sp-year" type="number" min={2000} max={2100} {...spForm.register("admissionYear", { valueAsNumber: true })} />
                  </FormField>
                  <Button type="submit" disabled={createProfile.isPending}>
                    {createProfile.isPending ? <Loader2 className="animate-spin" /> : <User />}
                    Create student profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
