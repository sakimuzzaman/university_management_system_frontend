"use client";

/* ------------------------------------------------------------------ */
/*  Admin Academics: Departments, Programs, Courses (CRUD + wizard).  */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState as useSearchParams } from "../hooks/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "../components/ui";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  PaginationControls,
  SearchInput,
  TableSkeleton,
} from "../components/shared";
import { courseApi, departmentApi, programApi } from "../lib/services";
import { toastApiError, useDebounce, usePagination } from "../hooks/hooks";
import { fmtDate } from "../lib/utils";
import type { Course } from "../lib/types";

/* ----------------------------- Departments --------------------------- */

const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(10),
  description: z.string().trim().max(500).optional(),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

function DepartmentsTab() {
  const queryClient = useQueryClient();
  const { page, setPage } = usePagination();
  const [createOpen, setCreateOpen] = React.useState(false);

  const departments = useQuery({
    queryKey: ["departments", page],
    queryFn: () => departmentApi.list({ page, limit: 10 }),
  });

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  const create = useMutation({
    mutationFn: (values: DepartmentForm) =>
      departmentApi.create({ name: values.name, code: values.code, description: values.description || undefined }),
    onSuccess: () => {
      toast.success("Department created");
      setCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (e) => toastApiError(e, "Could not create department"),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> New department
        </Button>
      </div>
      <Card>
        {departments.isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : departments.isError ? (
          <div className="p-4"><ErrorState message="Could not load departments." onRetry={() => departments.refetch()} /></div>
        ) : departments.data && departments.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.data.items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{d.code}</Badge></TableCell>
                    <TableCell className="font-semibold text-zinc-900">{d.name}</TableCell>
                    <TableCell className="text-zinc-500">{d.description ?? "—"}</TableCell>
                    <TableCell className="text-zinc-500">{fmtDate(d.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={departments.data.meta.page} totalPages={departments.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={Building2} title="No departments yet" description="Create your first department to get started." action={<Button onClick={() => setCreateOpen(true)}><Plus /> New department</Button>} />
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
            <DialogDescription>Add a new academic department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate className="space-y-4">
            <FormField label="Name" htmlFor="dept-name" error={form.formState.errors.name?.message} required>
              <Input id="dept-name" placeholder="Computer Science and Engineering" {...form.register("name")} />
            </FormField>
            <FormField label="Code" htmlFor="dept-code" error={form.formState.errors.code?.message} hint="Short code, e.g. CSE" required>
              <Input id="dept-code" placeholder="CSE" {...form.register("code")} />
            </FormField>
            <FormField label="Description" htmlFor="dept-desc" error={form.formState.errors.description?.message}>
              <Textarea id="dept-desc" placeholder="Department description…" {...form.register("description")} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------- Programs ---------------------------- */

const programSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(20),
  departmentId: z.string().min(1, "Please select a department"),
  durationYears: z.number().int().min(1).max(8),
});

type ProgramForm = z.infer<typeof programSchema>;

function ProgramsTab() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const [createOpen, setCreateOpen] = React.useState(false);
  const departmentFilter = searchParams.get("departmentId") ?? "";

  const departments = useQuery({
    queryKey: ["departments-all"],
    queryFn: () => departmentApi.list({ limit: 100 }),
  });
  const programs = useQuery({
    queryKey: ["programs", page, departmentFilter],
    queryFn: () => programApi.list({ page, limit: 10, departmentId: departmentFilter || undefined }),
  });

  const form = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: { name: "", code: "", departmentId: "", durationYears: 4 },
  });

  const create = useMutation({
    mutationFn: (v: ProgramForm) =>
      programApi.create({ name: v.name, code: v.code, departmentId: v.departmentId, durationYears: Number(v.durationYears) }),
    onSuccess: () => {
      toast.success("Program created");
      setCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (e) => toastApiError(e, "Could not create program"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={departmentFilter || "all"}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams);
            if (v === "all") params.delete("departmentId");
            else params.set("departmentId", v);
            params.delete("page");
            setSearchParams(params, { replace: true });
          }}
        >
          <SelectTrigger className="sm:w-64" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.data?.items.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> New program
        </Button>
      </div>
      <Card>
        {programs.isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : programs.isError ? (
          <div className="p-4"><ErrorState message="Could not load programs." onRetry={() => programs.refetch()} /></div>
        ) : programs.data && programs.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.data.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{p.code}</Badge></TableCell>
                    <TableCell className="font-semibold text-zinc-900">{p.name}</TableCell>
                    <TableCell className="text-zinc-500">{p.department.name}</TableCell>
                    <TableCell className="text-zinc-500">{p.durationYears} years</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={programs.data.meta.page} totalPages={programs.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={GraduationCap} title="No programs found" description="Create a program under a department." action={<Button onClick={() => setCreateOpen(true)}><Plus /> New program</Button>} />
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create program</DialogTitle>
            <DialogDescription>Add a degree program under a department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate className="space-y-4">
            <FormField label="Name" htmlFor="prog-name" error={form.formState.errors.name?.message} required>
              <Input id="prog-name" placeholder="B.Sc. in Computer Science" {...form.register("name")} />
            </FormField>
            <FormField label="Code" htmlFor="prog-code" error={form.formState.errors.code?.message} required>
              <Input id="prog-code" placeholder="BSC-CSE" {...form.register("code")} />
            </FormField>
            <FormField label="Department" htmlFor="prog-dept" error={form.formState.errors.departmentId?.message} required>
              <Select value={form.watch("departmentId")} onValueChange={(v) => form.setValue("departmentId", v)}>
                <SelectTrigger id="prog-dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.data?.items.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Duration (years)" htmlFor="prog-years" error={form.formState.errors.durationYears?.message} required>
              <Input id="prog-years" type="number" min={1} max={8} {...form.register("durationYears", { valueAsNumber: true })} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------- Courses ----------------------------- */

const courseStep1Schema = z.object({
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(20),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  credits: z.coerce.number().int().min(1).max(6),
  description: z.string().trim().max(1000).optional(),
});

const courseStep2Schema = z.object({
  departmentId: z.string().min(1, "Please select a department"),
  programId: z.string().min(1, "Please select a program"),
});

type CourseStep1 = z.infer<typeof courseStep1Schema>;
type CourseStep2 = z.infer<typeof courseStep2Schema>;

const COURSE_STEPS = ["Course details", "Department & program", "Prerequisites", "Review"];

function CourseWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState(0);
  const [s1, setS1] = React.useState<CourseStep1>({ code: "", title: "", credits: 3, description: "" });
  const [s2, setS2] = React.useState<CourseStep2>({ departmentId: "", programId: "" });
  const [prereqIds, setPrereqIds] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const departments = useQuery({ queryKey: ["departments-all"], queryFn: () => departmentApi.list({ limit: 100 }) });
  const programs = useQuery({
    queryKey: ["programs", s2.departmentId],
    queryFn: () => programApi.list({ limit: 100, departmentId: s2.departmentId || undefined }),
    enabled: !!s2.departmentId,
  });
  const allCourses = useQuery({ queryKey: ["courses-all"], queryFn: () => courseApi.list({ limit: 100 }) });

  const reset = () => {
    setStep(0);
    setS1({ code: "", title: "", credits: 3, description: "" });
    setS2({ departmentId: "", programId: "" });
    setPrereqIds([]);
    setErrors({});
  };

  const create = useMutation({
    mutationFn: () =>
      courseApi.create({
        code: s1.code,
        title: s1.title,
        credits: Number(s1.credits),
        description: s1.description || undefined,
        departmentId: s2.departmentId,
        programId: s2.programId,
        prerequisiteIds: prereqIds.length ? prereqIds : undefined,
      }),
    onSuccess: () => {
      toast.success("Course created");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onClose();
      reset();
    },
    onError: (e) => toastApiError(e, "Could not create course"),
  });

  const validate = (st: number): boolean => {
    if (st === 0) {
      const parsed = courseStep1Schema.safeParse(s1);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
        setErrors(errs);
        return false;
      }
    }
    if (st === 1) {
      const parsed = courseStep2Schema.safeParse(s2);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
        setErrors(errs);
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const dept = departments.data?.items.find((d) => d.id === s2.departmentId);
  const prog = programs.data?.items.find((p) => p.id === s2.programId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
          <DialogDescription>Multi-step course creation — details, placement, prerequisites, review.</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2" aria-label="Course creation progress">
          {COURSE_STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-emerald-600 text-white" : i === step ? "bg-emerald-700 text-white ring-4 ring-emerald-100" : "bg-zinc-200 text-zinc-500"}`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm font-medium sm:inline ${i === step ? "text-zinc-900" : "text-zinc-500"}`}>{label}</span>
              {i < COURSE_STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-zinc-200" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Code" htmlFor="c-code" error={errors.code} required>
                <Input id="c-code" placeholder="CSE101" value={s1.code} onChange={(e) => setS1({ ...s1, code: e.target.value })} />
              </FormField>
              <FormField label="Credits" htmlFor="c-credits" error={errors.credits} required>
                <Input id="c-credits" type="number" min={1} max={6} value={s1.credits} onChange={(e) => setS1({ ...s1, credits: Number(e.target.value) })} />
              </FormField>
            </div>
            <FormField label="Title" htmlFor="c-title" error={errors.title} required>
              <Input id="c-title" placeholder="Introduction to Programming" value={s1.title} onChange={(e) => setS1({ ...s1, title: e.target.value })} />
            </FormField>
            <FormField label="Description" htmlFor="c-desc" error={errors.description}>
              <Textarea id="c-desc" placeholder="What does this course cover?" value={s1.description} onChange={(e) => setS1({ ...s1, description: e.target.value })} />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FormField label="Department" htmlFor="c-dept" error={errors.departmentId} required>
              <Select value={s2.departmentId} onValueChange={(v) => { setS2({ departmentId: v, programId: "" }); }}>
                <SelectTrigger id="c-dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.data?.items.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Program" htmlFor="c-prog" error={errors.programId} hint="Only programs under the selected department" required>
              <Select value={s2.programId} onValueChange={(v) => setS2({ ...s2, programId: v })} disabled={!s2.departmentId}>
                <SelectTrigger id="c-prog"><SelectValue placeholder={s2.departmentId ? "Select program" : "Select a department first"} /></SelectTrigger>
                <SelectContent>
                  {programs.data?.items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">Optional — select courses students must pass before enrolling in this course.</p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3">
              {allCourses.data?.items.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50">
                  <Checkbox
                    checked={prereqIds.includes(c.id)}
                    onCheckedChange={(checked) =>
                      setPrereqIds((prev) => (checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                    }
                  />
                  <span className="text-sm">
                    <span className="font-mono font-semibold text-emerald-700">{c.code}</span> — {c.title}
                  </span>
                </label>
              ))}
              {allCourses.data && allCourses.data.items.length === 0 && (
                <p className="p-2 text-sm text-zinc-500">No existing courses to use as prerequisites.</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {[
              { label: "Code", value: s1.code.toUpperCase() },
              { label: "Title", value: s1.title },
              { label: "Credits", value: String(s1.credits) },
              { label: "Department", value: dept ? `${dept.name} (${dept.code})` : "—" },
              { label: "Program", value: prog ? `${prog.name} (${prog.code})` : "—" },
              { label: "Prerequisites", value: prereqIds.length ? prereqIds.map((id) => allCourses.data?.items.find((c) => c.id === id)?.code).filter(Boolean).join(", ") : "None" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="text-sm text-zinc-500">{row.label}</span>
                <span className="text-sm font-semibold text-zinc-900">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setStep((v) => Math.max(v - 1, 0))} disabled={step === 0 || create.isPending}>
            <ArrowLeft /> Back
          </Button>
          {step < COURSE_STEPS.length - 1 ? (
            <Button onClick={() => validate(step) && setStep((v) => v + 1)}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Create course
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const editCourseSchema = z.object({
  code: z.string().trim().min(2).max(20).optional(),
  title: z.string().trim().min(2).max(150).optional(),
  credits: z.number().int().min(1).max(6).optional(),
  description: z.string().trim().max(1000).optional(),
});

type EditCourseForm = z.infer<typeof editCourseSchema>;

function EditCourseDialog({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<EditCourseForm>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: { code: "", title: "", credits: 3, description: "" },
  });

  React.useEffect(() => {
    if (course) {
      form.reset({
        code: course.code,
        title: course.title,
        credits: course.credits,
        description: course.description ?? "",
      });
    }
  }, [course, form]);

  const update = useMutation({
    mutationFn: (values: EditCourseForm) =>
      courseApi.update(course!.id, {
        code: values.code,
        title: values.title,
        credits: values.credits !== undefined ? Number(values.credits) : undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Course updated");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onClose();
    },
    onError: (e) => toastApiError(e, "Could not update course"),
  });

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>Update {course?.code} — {course?.title}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => update.mutate(v))} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" htmlFor="ec-code" error={form.formState.errors.code?.message}>
              <Input id="ec-code" {...form.register("code")} />
            </FormField>
            <FormField label="Credits" htmlFor="ec-credits" error={form.formState.errors.credits?.message}>
              <Input id="ec-credits" type="number" min={1} max={6} {...form.register("credits", { valueAsNumber: true })} />
            </FormField>
          </div>
          <FormField label="Title" htmlFor="ec-title" error={form.formState.errors.title?.message}>
            <Input id="ec-title" {...form.register("title")} />
          </FormField>
          <FormField label="Description" htmlFor="ec-desc" error={form.formState.errors.description?.message}>
            <Textarea id="ec-desc" {...form.register("description")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoursesTab() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [deleting, setDeleting] = React.useState<Course | null>(null);

  const q = searchParams.get("q") ?? "";
  const debouncedQ = useDebounce(q, 400);
  const setQ = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("q", value);
    else params.delete("q");
    params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const courses = useQuery({
    queryKey: ["courses", page, debouncedQ],
    queryFn: () => courseApi.list({ page, limit: 10, q: debouncedQ || undefined, sortBy: "code", sortOrder: "asc" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => courseApi.remove(id),
    onSuccess: () => {
      toast.success("Course deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e) => toastApiError(e, "Could not delete course"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder="Search by code or title…" className="sm:max-w-xs sm:flex-1" />
        <Button onClick={() => setWizardOpen(true)}>
          <Plus /> New course
        </Button>
      </div>
      <Card>
        {courses.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : courses.isError ? (
          <div className="p-4"><ErrorState message="Could not load courses." onRetry={() => courses.refetch()} /></div>
        ) : courses.data && courses.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Prerequisites</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{c.code}</Badge></TableCell>
                    <TableCell className="font-semibold text-zinc-900">{c.title}</TableCell>
                    <TableCell className="text-zinc-500">{c.department.code}</TableCell>
                    <TableCell className="text-zinc-500">{c.program.code}</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>
                      {c.prerequisites.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {c.prerequisites.map((p) => (
                            <Badge key={p.prerequisite.id} variant="outline" className="font-mono text-[11px]">{p.prerequisite.code}</Badge>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label={`Edit ${c.code}`}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`} className="text-red-600 hover:text-red-700">
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={courses.data.meta.page} totalPages={courses.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={BookOpen} title="No courses found" description="Create a course with the wizard to get started." action={<Button onClick={() => setWizardOpen(true)}><Plus /> New course</Button>} />
          </div>
        )}
      </Card>

      <CourseWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <EditCourseDialog course={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete course?"
        description={`Delete ${deleting?.code} — ${deleting?.title}? This is blocked if the course has sections.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}

/* ------------------------------ Academics page ----------------------- */

export function AdminAcademicsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "courses";

  return (
    <div>
      <PageHeader title="Academics" description="Manage departments, programs, and the course catalog." />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", v);
          params.delete("page");
          setSearchParams(params, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="programs">
          <ProgramsTab />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
