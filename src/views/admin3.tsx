"use client";

/* ------------------------------------------------------------------ */
/*  Admin pages: Semesters, Sections, Audit Logs.                     */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState as useSearchParams } from "../hooks/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Eye,
  Loader2,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "../components/ui";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  PaginationControls,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from "../components/shared";
import { adminApi, courseApi, semesterApi, sectionApi } from "../lib/services";
import { toastApiError, useDebounce, useInstructors, usePagination } from "../hooks/hooks";
import { fmtDate, fmtDateTime, fmtMoney, titleCase } from "../lib/utils";
import type { Section, Semester, SemesterStatus } from "../lib/types";

/* ------------------------------ Semesters ---------------------------- */

const NEXT_STATUS: Partial<Record<SemesterStatus, SemesterStatus>> = {
  UPCOMING: "REGISTRATION_OPEN",
  REGISTRATION_OPEN: "ONGOING",
  ONGOING: "COMPLETED",
};

const semesterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(20),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  tuitionFee: z.number().positive("Tuition must be positive").max(10_000_000),
  maxCredits: z.number().int().min(1).max(40),
});

type SemesterForm = z.infer<typeof semesterSchema>;

function SemesterFormDialog({
  open,
  onClose,
  semester,
}: {
  open: boolean;
  onClose: () => void;
  semester: Semester | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<SemesterForm>({
    resolver: zodResolver(semesterSchema),
    defaultValues: { name: "", code: "", startDate: "", endDate: "", tuitionFee: 500, maxCredits: 18 },
  });

  React.useEffect(() => {
    if (open) {
      if (semester) {
        form.reset({
          name: semester.name,
          code: semester.code,
          startDate: semester.startDate.slice(0, 10),
          endDate: semester.endDate.slice(0, 10),
          tuitionFee: Number(semester.tuitionFee),
          maxCredits: semester.maxCredits,
        });
      } else {
        form.reset({ name: "", code: "", startDate: "", endDate: "", tuitionFee: 500, maxCredits: 18 });
      }
    }
  }, [open, semester, form]);

  const save = useMutation({
    mutationFn: (values: SemesterForm) => {
      const payload = {
        name: values.name,
        code: values.code,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        tuitionFee: Number(values.tuitionFee),
        maxCredits: Number(values.maxCredits),
      };
      return semester ? semesterApi.update(semester.id, payload) : semesterApi.create(payload);
    },
    onSuccess: () => {
      toast.success(semester ? "Semester updated" : "Semester created");
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      onClose();
    },
    onError: (e) => toastApiError(e, "Could not save semester"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{semester ? "Edit semester" : "Create semester"}</DialogTitle>
          <DialogDescription>
            {semester ? `Update ${semester.name}.` : "New semesters start in UPCOMING status."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="sem-name" error={form.formState.errors.name?.message} required>
              <Input id="sem-name" placeholder="Fall 2025" {...form.register("name")} />
            </FormField>
            <FormField label="Code" htmlFor="sem-code" error={form.formState.errors.code?.message} required>
              <Input id="sem-code" placeholder="FALL-2025" {...form.register("code")} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" htmlFor="sem-start" error={form.formState.errors.startDate?.message} required>
              <Input id="sem-start" type="date" {...form.register("startDate")} />
            </FormField>
            <FormField label="End date" htmlFor="sem-end" error={form.formState.errors.endDate?.message} required>
              <Input id="sem-end" type="date" {...form.register("endDate")} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tuition fee (USD)" htmlFor="sem-fee" error={form.formState.errors.tuitionFee?.message} required>
              <Input id="sem-fee" type="number" min={0} step="0.01" {...form.register("tuitionFee", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Max credits" htmlFor="sem-credits" error={form.formState.errors.maxCredits?.message} required>
              <Input id="sem-credits" type="number" min={1} max={40} {...form.register("maxCredits", { valueAsNumber: true })} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {semester ? "Save changes" : "Create semester"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminSemestersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const statusFilter = searchParams.get("status") ?? "";

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Semester | null>(null);
  const [deleting, setDeleting] = React.useState<Semester | null>(null);
  const [advancing, setAdvancing] = React.useState<Semester | null>(null);

  const semesters = useQuery({
    queryKey: ["semesters", page, statusFilter],
    queryFn: () => semesterApi.list({ page, limit: 10, status: statusFilter || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["semesters"] });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SemesterStatus }) => semesterApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Semester status updated");
      setAdvancing(null);
      invalidate();
    },
    onError: (e) => toastApiError(e, "Could not update status"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => semesterApi.remove(id),
    onSuccess: () => {
      toast.success("Semester deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toastApiError(e, "Could not delete semester"),
  });

  return (
    <div>
      <PageHeader
        title="Semesters"
        description="Manage the academic calendar and its lifecycle."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> New semester
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v === "all") params.delete("status");
              else params.set("status", v);
              params.delete("page");
              setSearchParams(params, { replace: true });
            }}
          >
            <SelectTrigger className="sm:w-56" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="REGISTRATION_OPEN">Registration open</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>

        {semesters.isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : semesters.isError ? (
          <div className="p-4"><ErrorState message="Could not load semesters." onRetry={() => semesters.refetch()} /></div>
        ) : semesters.data && semesters.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tuition</TableHead>
                  <TableHead>Max credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.data.items.map((s) => {
                  const next = NEXT_STATUS[s.status];
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-semibold text-zinc-900">{s.name}</p>
                        <p className="font-mono text-xs text-zinc-500">{s.code}</p>
                      </TableCell>
                      <TableCell className="text-zinc-500">{fmtDate(s.startDate)} — {fmtDate(s.endDate)}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="font-semibold">{fmtMoney(s.tuitionFee)}</TableCell>
                      <TableCell>{s.maxCredits}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <Button variant="ghost" size="sm" onClick={() => setAdvancing(s)} title={`Move to ${titleCase(next)}`}>
                              {titleCase(next)} <ArrowRight />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setFormOpen(true); }} aria-label={`Edit ${s.name}`}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} className="text-red-600 hover:text-red-700">
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={semesters.data.meta.page} totalPages={semesters.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={CalendarDays} title="No semesters found" description="Create a semester to open registration." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> New semester</Button>} />
          </div>
        )}
      </Card>

      <SemesterFormDialog open={formOpen} onClose={() => setFormOpen(false)} semester={editing} />

      <ConfirmDialog
        open={!!advancing}
        onOpenChange={(open) => !open && setAdvancing(null)}
        title="Advance semester status?"
        description={
          advancing
            ? `Move ${advancing.name} from ${titleCase(advancing.status)} to ${titleCase(NEXT_STATUS[advancing.status] ?? "")}? This changes what students and instructors can do.`
            : ""
        }
        confirmLabel="Advance status"
        loading={advance.isPending}
        onConfirm={() => advancing && NEXT_STATUS[advancing.status] && advance.mutate({ id: advancing.id, status: NEXT_STATUS[advancing.status]! })}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete semester?"
        description={`Delete ${deleting?.name}? This is blocked if the semester has sections or payments.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

/* ------------------------------- Sections ---------------------------- */

const sectionSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  semesterId: z.string().min(1, "Please select a semester"),
  instructorProfileId: z.string().optional(),
  sectionCode: z.string().trim().min(1, "Section code is required").max(10),
  capacity: z.number().int().min(1).max(500),
  schedule: z.string().trim().max(200).optional(),
});

type SectionForm = z.infer<typeof sectionSchema>;

function CreateSectionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<SectionForm>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { courseId: "", semesterId: "", instructorProfileId: "", sectionCode: "A", capacity: 30, schedule: "" },
  });

  const courses = useQuery({ queryKey: ["courses-all"], queryFn: () => courseApi.list({ limit: 100, sortBy: "code", sortOrder: "asc" }) });
  const semesters = useQuery({ queryKey: ["semesters-all"], queryFn: () => semesterApi.list({ limit: 100 }) });
  const instructors = useInstructors();

  const create = useMutation({
    mutationFn: (v: SectionForm) =>
      sectionApi.create({
        courseId: v.courseId,
        semesterId: v.semesterId,
        instructorProfileId: v.instructorProfileId || undefined,
        sectionCode: v.sectionCode,
        capacity: Number(v.capacity),
        schedule: v.schedule || undefined,
      }),
    onSuccess: () => {
      toast.success("Section created");
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      onClose();
      form.reset();
    },
    onError: (e) => toastApiError(e, "Could not create section"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create section</DialogTitle>
          <DialogDescription>Offer a course section in a semester.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate className="space-y-4">
          <FormField label="Course" htmlFor="sec-course" error={form.formState.errors.courseId?.message} required>
            <Select value={form.watch("courseId")} onValueChange={(v) => form.setValue("courseId", v)}>
              <SelectTrigger id="sec-course"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.data?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Semester" htmlFor="sec-sem" error={form.formState.errors.semesterId?.message} required>
            <Select value={form.watch("semesterId")} onValueChange={(v) => form.setValue("semesterId", v)}>
              <SelectTrigger id="sec-sem"><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>
                {semesters.data?.items.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Instructor (optional)" htmlFor="sec-inst" error={form.formState.errors.instructorProfileId?.message}>
            <Select value={form.watch("instructorProfileId") || "none"} onValueChange={(v) => form.setValue("instructorProfileId", v === "none" ? "" : v)}>
              <SelectTrigger id="sec-inst"><SelectValue placeholder="No instructor yet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No instructor yet</SelectItem>
                {instructors.data?.map((i) => (
                  <SelectItem key={i.profileId} value={i.profileId}>
                    {i.name} ({i.departmentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Section code" htmlFor="sec-code" error={form.formState.errors.sectionCode?.message} required>
              <Input id="sec-code" placeholder="A" {...form.register("sectionCode")} />
            </FormField>
            <FormField label="Capacity" htmlFor="sec-cap" error={form.formState.errors.capacity?.message} required>
              <Input id="sec-cap" type="number" min={1} max={500} {...form.register("capacity", { valueAsNumber: true })} />
            </FormField>
          </div>
          <FormField label="Schedule" htmlFor="sec-sched" error={form.formState.errors.schedule?.message}>
            <Input id="sec-sched" placeholder="Sun/Tue 10:00-11:20 Room 301" {...form.register("schedule")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Create section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSectionDialog({ section, onClose }: { section: Section | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [capacity, setCapacity] = React.useState(30);
  const [schedule, setSchedule] = React.useState("");

  React.useEffect(() => {
    if (section) {
      setCapacity(section.capacity);
      setSchedule(section.schedule ?? "");
    }
  }, [section]);

  const update = useMutation({
    mutationFn: () =>
      sectionApi.update(section!.id, { capacity, schedule: schedule || null }),
    onSuccess: () => {
      toast.success("Section updated");
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      onClose();
    },
    onError: (e) => toastApiError(e, "Could not update section"),
  });

  return (
    <Dialog open={!!section} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit section</DialogTitle>
          <DialogDescription>
            {section?.course.code} — Section {section?.sectionCode}. Capacity cannot go below current enrollment ({section?.enrolledCount}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="Capacity" htmlFor="es-cap" required>
            <Input id="es-cap" type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </FormField>
          <FormField label="Schedule" htmlFor="es-sched">
            <Input id="es-sched" placeholder="Sun/Tue 10:00-11:20 Room 301" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => update.mutate()} disabled={update.isPending}>
            {update.isPending && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignInstructorDialog({ section, onClose }: { section: Section | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const instructors = useInstructors();
  const [selected, setSelected] = React.useState<string>("none");

  React.useEffect(() => {
    setSelected(section?.instructorId ?? "none");
  }, [section]);

  const assign = useMutation({
    mutationFn: () => sectionApi.assignInstructor(section!.id, selected === "none" ? null : selected),
    onSuccess: () => {
      toast.success("Instructor assignment updated");
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      onClose();
    },
    onError: (e) => toastApiError(e, "Could not assign instructor"),
  });

  return (
    <Dialog open={!!section} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign instructor</DialogTitle>
          <DialogDescription>
            {section?.course.code} — Section {section?.sectionCode}. The instructor must belong to the course's department.
          </DialogDescription>
        </DialogHeader>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger aria-label="Instructor">
            <SelectValue placeholder="Select instructor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassign instructor</SelectItem>
            {instructors.data?.map((i) => (
              <SelectItem key={i.profileId} value={i.profileId}>
                {i.name} — {i.designation} ({i.departmentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => assign.mutate()} disabled={assign.isPending}>
            {assign.isPending && <Loader2 className="animate-spin" />} Save assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminSectionsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const q = searchParams.get("q") ?? "";
  const semesterId = searchParams.get("semesterId") ?? "";
  const debouncedQ = useDebounce(q, 400);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Section | null>(null);
  const [assigning, setAssigning] = React.useState<Section | null>(null);
  const [deleting, setDeleting] = React.useState<Section | null>(null);

  const semesters = useQuery({ queryKey: ["semesters-all"], queryFn: () => semesterApi.list({ limit: 100 }) });
  const sections = useQuery({
    queryKey: ["sections", page, debouncedQ, semesterId],
    queryFn: () => sectionApi.list({ page, limit: 10, q: debouncedQ || undefined, semesterId: semesterId || undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => sectionApi.remove(id),
    onSuccess: () => {
      toast.success("Section deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
    onError: (e) => toastApiError(e, "Could not delete section"),
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
      <PageHeader
        title="Sections"
        description="Course sections offered per semester."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New section
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={(v) => setParam("q", v)} placeholder="Search course code or title…" className="sm:max-w-xs sm:flex-1" />
          <Select value={semesterId || "all"} onValueChange={(v) => setParam("semesterId", v === "all" ? "" : v)}>
            <SelectTrigger className="sm:w-56" aria-label="Filter by semester">
              <SelectValue placeholder="All semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.data?.items.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>

        {sections.isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : sections.isError ? (
          <div className="p-4"><ErrorState message="Could not load sections." onRetry={() => sections.refetch()} /></div>
        ) : sections.data && sections.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.data.items.map((s) => {
                  const pct = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-semibold text-zinc-900">
                          <span className="text-emerald-700">{s.course.code}</span> — {s.course.title}
                        </p>
                        <p className="text-xs text-zinc-500">Section {s.sectionCode} · {s.course.credits} credits</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{s.semester.name}</p>
                        <StatusBadge status={s.semester.status} className="mt-1" />
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.instructor ? (
                          <>
                            <p className="font-medium text-zinc-900">{s.instructor.user.name}</p>
                            <p className="text-xs text-zinc-500">{s.instructor.designation}</p>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">{s.schedule ?? "—"}</TableCell>
                      <TableCell>
                        <div className="min-w-28">
                          <p className="text-sm font-semibold text-zinc-900">{s.enrolledCount}/{s.capacity}</p>
                          <Progress value={pct} className="mt-1 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setAssigning(s)} aria-label={`Assign instructor for ${s.course.code}`} title="Assign instructor">
                            <UserCog />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label={`Edit ${s.course.code}`}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(s)} aria-label={`Delete ${s.course.code}`} className="text-red-600 hover:text-red-700">
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={sections.data.meta.page} totalPages={sections.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={ClipboardList} title="No sections found" description="Create a section to offer a course in a semester." action={<Button onClick={() => setCreateOpen(true)}><Plus /> New section</Button>} />
          </div>
        )}
      </Card>

      <CreateSectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditSectionDialog section={editing} onClose={() => setEditing(null)} />
      <AssignInstructorDialog section={assigning} onClose={() => setAssigning(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete section?"
        description={`Delete ${deleting?.course.code} Section ${deleting?.sectionCode}? This is blocked if the section has enrollments, attendance, or exams.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

/* ------------------------------ Audit Logs --------------------------- */

export function AdminAuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const action = searchParams.get("action") ?? "";
  const entity = searchParams.get("entity") ?? "";
  const debouncedAction = useDebounce(action, 400);
  const debouncedEntity = useDebounce(entity, 400);
  const [viewing, setViewing] = React.useState<string | null>(null);

  const logs = useQuery({
    queryKey: ["audit-logs", page, debouncedAction, debouncedEntity],
    queryFn: () => adminApi.auditLogs({ page, limit: 10, action: debouncedAction || undefined, entity: debouncedEntity || undefined }),
  });

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const viewingLog = logs.data?.logs.find((l) => l.id === viewing) ?? null;

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every recorded action across the system." />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <SearchInput value={action} onChange={(v) => setParam("action", v)} placeholder="Filter by action (e.g. LOGIN)…" className="sm:max-w-xs sm:flex-1" />
          <SearchInput value={entity} onChange={(v) => setParam("entity", v)} placeholder="Filter by entity (e.g. Payment)…" className="sm:max-w-xs sm:flex-1" />
        </CardContent>

        {logs.isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : logs.isError ? (
          <div className="p-4"><ErrorState message="Could not load audit logs." onRetry={() => logs.refetch()} /></div>
        ) : logs.data && logs.data.logs.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{log.action}</Badge></TableCell>
                    <TableCell>
                      <span className="font-medium text-zinc-900">{log.entity}</span>
                      {log.entityId && <span className="block max-w-40 truncate font-mono text-[11px] text-zinc-400">{log.entityId}</span>}
                    </TableCell>
                    <TableCell>
                      {log.actor ? (
                        <>
                          <p className="text-sm font-medium text-zinc-900">{log.actor.name}</p>
                          <p className="text-xs text-zinc-500">{titleCase(log.actor.role)}</p>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400">System</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{log.ipAddress ?? "—"}</TableCell>
                    <TableCell className="text-zinc-500">{fmtDateTime(log.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {log.metadata ? (
                        <Button variant="ghost" size="icon" onClick={() => setViewing(log.id)} aria-label="View metadata">
                          <Eye />
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={logs.data.meta.page} totalPages={logs.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={ScrollText} title="No audit logs found" description="Try adjusting your filters." />
          </div>
        )}
      </Card>

      <Dialog open={!!viewingLog} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit metadata</DialogTitle>
            <DialogDescription>
              {viewingLog?.action} · {viewingLog?.entity} · {viewingLog && fmtDateTime(viewingLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-300">
            {JSON.stringify(viewingLog?.metadata ?? {}, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
