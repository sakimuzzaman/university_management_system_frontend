"use client";

/* ------------------------------------------------------------------ */
/*  Instructor pages: My Sections, Section Management (attendance,   */
/*  exams, results), and Profile.                                     */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
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
  Input,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui";
import {
  ConfirmDialog,
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
import { attendanceApi, examApi, resultApi, sectionApi, userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { toastApiError, usePagination } from "../hooks/hooks";
import { fmtDate, num, toDateInput } from "../lib/utils";
import type { AttendanceStatus, ExamType, RosterStudent } from "../lib/types";

/* ------------------------- Instructor Dashboard ---------------------- */

export function InstructorDashboardPage() {
  const { user } = useAuthStore();

  const sections = useQuery({
    queryKey: ["my-sections"],
    queryFn: () => sectionApi.list({ limit: 100 }),
  });

  const items = sections.data?.items ?? [];
  const totalEnrolled = items.reduce((t, s) => t + s.enrolledCount, 0);
  const semesters = new Set(items.map((s) => s.semesterId)).size;

  const upcomingExams = useQuery({
    queryKey: ["my-upcoming-exams", items.map((s) => s.id).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(
        items.map(async (s) => {
          const exams = await examApi.listForSection(s.id).catch(() => []);
          return exams.filter((e) => new Date(e.examDate) >= new Date());
        }),
      );
      return lists.flat().length;
    },
    enabled: items.length > 0,
  });

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name ?? "Instructor"}`}
        description={
          user?.instructorProfile
            ? `${user.instructorProfile.employeeId} · ${user.instructorProfile.designation}, ${user.instructorProfile.department.name}`
            : "Your assigned sections."
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/instructor/profile">My profile</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My sections" value={items.length} icon={BookOpen} sub={`${semesters} semester(s)`} />
        <StatCard label="Students enrolled" value={totalEnrolled} icon={ClipboardCheck} sub="across all sections" accent="bg-sky-50 text-sky-700" />
        <StatCard label="Upcoming exams" value={upcomingExams.data ?? 0} icon={FileText} sub="in your sections" accent="bg-amber-50 text-amber-700" />
        <StatCard label="Department" value={user?.instructorProfile?.department.code ?? "—"} icon={CalendarDays} sub={user?.instructorProfile?.department.name ?? ""} accent="bg-violet-50 text-violet-700" />
      </div>

      <div className="mt-6">
        {sections.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-200/70" />
            ))}
          </div>
        ) : sections.isError ? (
          <ErrorState message="Could not load your sections." onRetry={() => sections.refetch()} />
        ) : items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((s) => {
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
                      <Badge variant="secondary">Sec {s.sectionCode}</Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-zinc-500">
                      <p>{s.semester.name}</p>
                      <p>{s.schedule ?? "Schedule TBA"}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{s.enrolledCount}/{s.capacity} enrolled</span>
                        <span className="font-semibold text-zinc-800">{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-1.5 h-1.5" />
                    </div>
                    <div className="flex-1" />
                    <Button asChild className="mt-5 w-full">
                      <Link href={`/instructor/sections/${s.id}`}>
                        Manage section <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No sections assigned" description="You have no sections assigned yet. Contact an administrator." />
        )}
      </div>
    </div>
  );
}

/* ------------------------- Attendance tab ---------------------------- */

const ATTENDANCE_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

function AttendanceTab({ sectionId }: { sectionId: string }) {
  const queryClient = useQueryClient();
  const { page, setPage } = usePagination();
  const [date, setDate] = React.useState(toDateInput(new Date().toISOString()));
  const [statuses, setStatuses] = React.useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = React.useState(false);

  const roster = useQuery({
    queryKey: ["roster", sectionId],
    queryFn: () => sectionApi.roster(sectionId),
  });

  const history = useQuery({
    queryKey: ["attendance-history", sectionId, page],
    queryFn: () => attendanceApi.listForSection(sectionId, { page, limit: 10 }),
  });

  const mark = async () => {
    const records = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) {
      toast.error("Select a status for at least one student");
      return;
    }
    setSaving(true);
    try {
      await attendanceApi.mark(sectionId, { date, records });
      toast.success(`Attendance saved for ${records.length} student(s)`);
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    } catch (error) {
      toastApiError(error, "Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const students: RosterStudent[] = roster.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mark attendance</CardTitle>
          <CardDescription>Pick a date and set each student's status. Re-saving a date updates it.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <FormField label="Date" htmlFor="att-date">
              <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-48" />
            </FormField>
            <Button onClick={mark} disabled={saving || students.length === 0} className="sm:ml-auto">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save attendance
            </Button>
          </div>

          {roster.isLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : roster.isError ? (
            <ErrorState message="Could not load the class roster." onRetry={() => roster.refetch()} />
          ) : students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.studentProfileId}>
                    <TableCell className="font-medium text-zinc-900">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{s.studentId}</TableCell>
                    <TableCell>
                      <Select
                        value={statuses[s.studentProfileId] ?? ""}
                        onValueChange={(v) => setStatuses((prev) => ({ ...prev, [s.studentProfileId]: v as AttendanceStatus }))}
                      >
                        <SelectTrigger className="w-36" aria-label={`Status for ${s.name}`}>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTENDANCE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={ClipboardCheck} title="No enrolled students" description="Students enrolled in this section will appear here." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
          <CardDescription>Previously marked records for this section</CardDescription>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : history.isError ? (
            <ErrorState message="Could not load attendance history." onRetry={() => history.refetch()} />
          ) : history.data && history.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{fmtDate(r.date)}</TableCell>
                      <TableCell>{r.student?.user.name ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls page={history.data.meta.page} totalPages={history.data.meta.totalPages} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={CalendarDays} title="No records yet" description="Marked attendance will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------- Exams tab ------------------------------ */

const examSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  type: z.enum(["QUIZ", "MIDTERM", "FINAL", "ASSIGNMENT"]),
  examDate: z.string().min(1, "Exam date is required"),
  maxMarks: z.number().positive("Max marks must be positive").max(100_000),
  weight: z.number().positive("Weight must be positive").max(100),
});

type ExamForm = z.infer<typeof examSchema>;

function ExamsTab({ sectionId }: { sectionId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const exams = useQuery({
    queryKey: ["section-exams", sectionId],
    queryFn: () => examApi.listForSection(sectionId),
  });

  const form = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: "", type: "QUIZ", examDate: "", maxMarks: 100, weight: 20 },
  });

  const create = useMutation({
    mutationFn: (v: ExamForm) =>
      examApi.create(sectionId, {
        title: v.title,
        type: v.type,
        examDate: new Date(v.examDate).toISOString(),
        maxMarks: Number(v.maxMarks),
        weight: Number(v.weight),
      }),
    onSuccess: () => {
      toast.success("Exam created");
      setCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["section-exams"] });
    },
    onError: (e) => toastApiError(e, "Could not create exam"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => examApi.remove(id),
    onSuccess: () => {
      toast.success("Exam deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["section-exams"] });
    },
    onError: (e) => toastApiError(e, "Could not delete exam"),
  });

  const totalWeight = (exams.data ?? []).reduce((t, e) => t + num(e.weight), 0);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Total weight: <span className={`font-bold ${totalWeight > 100 ? "text-red-600" : "text-zinc-900"}`}>{totalWeight.toFixed(0)}%</span> of 100%
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> New exam
        </Button>
      </div>

      <Card>
        {exams.isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : exams.isError ? (
          <div className="p-4"><ErrorState message="Could not load exams." onRetry={() => exams.refetch()} /></div>
        ) : exams.data && exams.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Max marks</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold text-zinc-900">{e.title}</TableCell>
                  <TableCell><StatusBadge status={e.type} /></TableCell>
                  <TableCell className="text-zinc-500">{fmtDate(e.examDate)}</TableCell>
                  <TableCell>{num(e.maxMarks)}</TableCell>
                  <TableCell>{num(e.weight)}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(e.id)} aria-label={`Delete ${e.title}`} className="text-red-600 hover:text-red-700">
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState icon={FileText} title="No exams yet" description="Create the first exam for this section. Weights must total 100%." action={<Button onClick={() => setCreateOpen(true)}><Plus /> New exam</Button>} />
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create exam</DialogTitle>
            <DialogDescription>Exams can only be created while the semester is ongoing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate className="space-y-4">
            <FormField label="Title" htmlFor="exam-title" error={form.formState.errors.title?.message} required>
              <Input id="exam-title" placeholder="Midterm Exam" {...form.register("title")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Type" htmlFor="exam-type" error={form.formState.errors.type?.message} required>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as ExamType)}>
                  <SelectTrigger id="exam-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="MIDTERM">Midterm</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Exam date" htmlFor="exam-date" error={form.formState.errors.examDate?.message} required>
                <Input id="exam-date" type="date" {...form.register("examDate")} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Max marks" htmlFor="exam-marks" error={form.formState.errors.maxMarks?.message} required>
                <Input id="exam-marks" type="number" min={1} {...form.register("maxMarks", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Weight (%)" htmlFor="exam-weight" error={form.formState.errors.weight?.message} hint={`Current total: ${totalWeight.toFixed(0)}%`} required>
                <Input id="exam-weight" type="number" min={1} max={100} {...form.register("weight", { valueAsNumber: true })} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="animate-spin" />} Create exam
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete exam?"
        description="This is blocked if the exam already has result records."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}

/* ---------------------------- Results tab ---------------------------- */

interface ResultDraft {
  studentId: string;
  marks: string;
  remarks: string;
}


function ResultsTab({ sectionId }: { sectionId: string }) {
  const queryClient = useQueryClient();

  const [examId, setExamId] = React.useState("");
  const [drafts, setDrafts] = React.useState<Record<string, ResultDraft>>({});
  const [saving, setSaving] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);

  // Fetch exams for this section.
  const exams = useQuery({
    queryKey: ["section-exams", sectionId],
    queryFn: () => examApi.listForSection(sectionId),
  });

  const selectedExam = exams.data?.find((e) => e.id === examId);

  // Fetch all enrolled students in this section.
  const roster = useQuery({
    queryKey: ["roster", sectionId],
    queryFn: () => sectionApi.roster(sectionId),
    enabled: !!examId,
  });

  // Fetch existing saved results for the selected exam.
  const results = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => resultApi.listForExam(examId, { limit: 100 }),
    enabled: !!examId,
  });

  // Reset draft values when the instructor selects another exam.
  React.useEffect(() => {
    setDrafts({});
  }, [examId]);

  // Initialize marks for every enrolled student.
  // Previously saved marks are restored automatically.
  React.useEffect(() => {
    if (!examId || !roster.data || !results.data) {
      return;
    }

    setDrafts((previous) => {
      const next: Record<string, ResultDraft> = {};

      for (const student of roster.data) {
        const studentProfileId = student.studentProfileId;

        const savedResult = results.data.items.find(
          (result) => result.student?.id === studentProfileId
        );

        const previousDraft = previous[studentProfileId];

        next[studentProfileId] = {
          studentId: studentProfileId,

          marks: savedResult
            ? String(num(savedResult.marks))
            : previousDraft?.marks ?? "",

          remarks:
            savedResult?.remarks ??
            previousDraft?.remarks ??
            "",
        };
      }

      return next;
    });
  }, [examId, roster.data, results.data]);

  // Save marks as result drafts.
  const save = async () => {
    if (!examId || !selectedExam || !roster.data || !results.data) {
      toast.error("Please select an exam and wait for the data to load");
      return;
    }

    const maxMarks = num(selectedExam.maxMarks);

    // Do not send updates for already published results.
    const publishedIds = new Set(
      results.data.items
        .filter((result) => result.published && result.student)
        .map((result) => result.student!.id)
    );

    const entries = Object.values(drafts)
      .filter(
        (draft) =>
          draft.marks.trim() !== "" &&
          !publishedIds.has(draft.studentId)
      )
      .map((draft) => ({
        studentId: draft.studentId,
        marks: Number(draft.marks),
        remarks: draft.remarks.trim() || undefined,
      }));

    if (entries.length === 0) {
      toast.error("Enter marks for at least one student");
      return;
    }

    // Validate marks before sending them to the backend.
    const invalidEntry = entries.some(
      (entry) =>
        !Number.isFinite(entry.marks) ||
        entry.marks < 0 ||
        entry.marks > maxMarks
    );

    if (invalidEntry) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setSaving(true);

    try {
      await resultApi.save(examId, entries);

      toast.success(`Result drafts saved for ${entries.length} student(s)`);

      await queryClient.invalidateQueries({
        queryKey: ["exam-results", examId],
      });
    } catch (error) {
      toastApiError(error, "Could not save results");
    } finally {
      setSaving(false);
    }
  };

  // Publish results after all enrolled students have saved marks.
  const publish = useMutation({
    mutationFn: () => resultApi.publish(examId),

    onSuccess: (data) => {
      toast.success(
        `Published results for ${data.publishedStudentCount} student(s)`
      );

      setPublishOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["exam-results", examId],
      });
    },

    onError: (error) => {
      toastApiError(error, "Could not publish results");
    },
  });

  // Determine whether every enrolled student has a saved result.
  const resultItems = results.data?.items ?? [];

  const allResultsSaved = Boolean(
    roster.data?.length &&
      roster.data.every((student) =>
        resultItems.some(
          (result) => result.student?.id === student.studentProfileId
        )
      )
  );

  // Determine whether every enrolled student's result is published.
  const allPublished = Boolean(
    allResultsSaved &&
      roster.data?.every((student) =>
        resultItems.some(
          (result) =>
            result.student?.id === student.studentProfileId &&
            result.published
        )
      )
  );

  return (
    <div>
      {/* Exam selector and action buttons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField label="Exam" htmlFor="results-exam">
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger id="results-exam" className="sm:w-72">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>

            <SelectContent>
              {exams.data?.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.title} ({exam.type}) — {fmtDate(exam.examDate)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            onClick={save}
            disabled={
              saving ||
              !examId ||
              !roster.data ||
              !results.data ||
              allPublished
            }
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            Save drafts
          </Button>

          <Button
            onClick={() => setPublishOpen(true)}
            disabled={
              !examId ||
              !allResultsSaved ||
              allPublished ||
              publish.isPending
            }
          >
            <Send />
            Publish
          </Button>
        </div>
      </div>

      {/* Results and marks-entry table */}
      {!examId ? (
        <EmptyState
          icon={FileText}
          title="Select an exam"
          description="Choose an exam above to enter and publish results."
        />
      ) : roster.isLoading || results.isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : roster.isError ? (
        <ErrorState
          message="Could not load enrolled students."
          onRetry={() => roster.refetch()}
        />
      ) : results.isError ? (
        <ErrorState
          message="Could not load existing results."
          onRetry={() => results.refetch()}
        />
      ) : roster.data && roster.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>

                  <TableHead>
                    Marks (max{" "}
                    {selectedExam ? num(selectedExam.maxMarks) : "—"})
                  </TableHead>

                  <TableHead>Grade</TableHead>

                  <TableHead>Remarks</TableHead>

                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {roster.data.map((student) => {
                  const studentProfileId = student.studentProfileId;

                  const result = resultItems.find(
                    (r) => r.student?.id === studentProfileId
                  );

                  const draft = drafts[studentProfileId] ?? {
                    studentId: studentProfileId,
                    marks: "",
                    remarks: "",
                  };

                  const max = selectedExam
                    ? num(selectedExam.maxMarks)
                    : 0;

                  const marksNum =
                    draft.marks.trim() !== ""
                      ? Number(draft.marks)
                      : NaN;

                  const pct =
                    max > 0 &&
                    Number.isFinite(marksNum) &&
                    marksNum >= 0
                      ? (marksNum / max) * 100
                      : null;

                  const grade =
                    pct === null
                      ? null
                      : pct >= 90
                        ? "A"
                        : pct >= 85
                          ? "A-"
                          : pct >= 80
                            ? "B+"
                            : pct >= 75
                              ? "B"
                              : pct >= 70
                                ? "B-"
                                : pct >= 65
                                  ? "C+"
                                  : pct >= 60
                                    ? "C"
                                    : pct >= 50
                                      ? "D"
                                      : "F";

                  const status = result?.published
                    ? "Published"
                    : result
                      ? "Draft"
                      : draft.marks.trim() !== ""
                        ? "Unsaved"
                        : "Not entered";

                  return (
                    <TableRow key={studentProfileId}>
                      {/* Student information */}
                      <TableCell>
                        <p className="font-medium text-zinc-900">
                          {student.name}
                        </p>

                        <p className="font-mono text-xs text-zinc-500">
                          {student.studentId}
                        </p>
                      </TableCell>

                      {/* Marks input */}
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          step="any"
                          className="w-28"
                          value={draft.marks}
                          disabled={!!result?.published}
                          onChange={(e) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [studentProfileId]: {
                                studentId: studentProfileId,
                                marks: e.target.value,
                                remarks:
                                  previous[studentProfileId]?.remarks ?? "",
                              },
                            }))
                          }
                          aria-label={`Marks for ${student.name}`}
                        />
                      </TableCell>

                      {/* Grade calculation */}
                      <TableCell>
                        <GradeBadge grade={grade} />
                      </TableCell>

                      {/* Remarks input */}
                      <TableCell>
                        <Input
                          className="w-44"
                          placeholder="Optional remarks"
                          value={draft.remarks}
                          disabled={!!result?.published}
                          onChange={(e) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [studentProfileId]: {
                                studentId: studentProfileId,
                                marks:
                                  previous[studentProfileId]?.marks ?? "",
                                remarks: e.target.value,
                              },
                            }))
                          }
                          aria-label={`Remarks for ${student.name}`}
                        />
                      </TableCell>

                      {/* Result status */}
                      <TableCell>
                        <Badge
                          variant={
                            result?.published ? "success" : "warning"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={FileText}
          title="No enrolled students"
          description="There are no enrolled students in this section to evaluate."
        />
      )}

      {/* Publish confirmation */}
      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish results?"
        description="Publishing makes these results visible to students and locks them from further edits. Every enrolled student must have a result."
        confirmLabel="Publish results"
        loading={publish.isPending}
        onConfirm={() => publish.mutate()}
      />
    </div>
  );
}


   

/* -------------------------- Section management ----------------------- */

export function SectionManagePage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const id = sectionId ?? "";

  const section = useQuery({
    queryKey: ["section", id],
    queryFn: () => sectionApi.get(id),
    enabled: !!id,
  });

  if (section.isLoading) {
    return (
      <div>
        <div className="h-10 w-64 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-zinc-200/70" />
      </div>
    );
  }
  if (section.isError || !section.data) {
    return <ErrorState message="Could not load this section." onRetry={() => section.refetch()} />;
  }

  const s = section.data;
  const pct = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`${s.course.code} — ${s.course.title}`}
        description={`Section ${s.sectionCode} · ${s.semester.name} · ${s.schedule ?? "Schedule TBA"}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/instructor">All sections</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled" value={`${s.enrolledCount}/${s.capacity}`} icon={ClipboardCheck} sub={`${s.availableSeats} seats available`} />
        <StatCard label="Semester status" value={<StatusBadge status={s.semester.status} />} icon={CalendarDays} sub={s.semester.name} accent="bg-sky-50 text-sky-700" />
        <StatCard label="Credits" value={s.course.credits} icon={BookOpen} sub="per student" accent="bg-amber-50 text-amber-700" />
      </div>

      <div className="mb-6">
        <Progress value={pct} className="h-2" />
        <p className="mt-1.5 text-xs text-zinc-500">{pct}% of seats filled</p>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <AttendanceTab sectionId={id} />
        </TabsContent>
        <TabsContent value="exams">
          <ExamsTab sectionId={id} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab sectionId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------- Instructor Profile ---------------------- */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  avatar: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function InstructorProfilePage() {
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

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Your instructor profile and personal information." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <UserAvatar name={user.name} src={user.avatar} className="mx-auto h-24 w-24 text-2xl" />
            <h2 className="mt-4 font-display text-xl font-bold text-zinc-900">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={user.role} />
            </div>
            {user.instructorProfile && (
              <div className="mt-5 space-y-2 rounded-2xl bg-zinc-50 p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Employee ID</span><span className="font-mono font-semibold">{user.instructorProfile.employeeId}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Designation</span><span className="font-semibold">{user.instructorProfile.designation}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Department</span><span className="font-semibold">{user.instructorProfile.department.code}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Update how your name and avatar appear across the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => update.mutate(v))} noValidate className="space-y-4">
              <FormField label="Full name" htmlFor="inst-name" error={form.formState.errors.name?.message} required>
                <Input id="inst-name" {...form.register("name")} />
              </FormField>
              <FormField label="Avatar URL" htmlFor="inst-avatar" error={form.formState.errors.avatar?.message} hint="Optional — link to a profile image">
                <Input id="inst-avatar" placeholder="https://…" {...form.register("avatar")} />
              </FormField>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
