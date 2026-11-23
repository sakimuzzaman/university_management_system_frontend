import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import { publicFetch } from "@/lib/server/api";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { Course, Department, Paginated, Program, Semester } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "UMS — University Management System" },
  description:
    "Enrollment, attendance, exams, results, transcripts, and Stripe tuition payments — one portal for students, instructors, and administrators.",
  openGraph: {
    title: "UMS — Your entire university, one portal",
    description: "Enrollment, attendance, exams, results, transcripts, and secure tuition payments.",
  },
};

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: "Smart Enrollment", text: "Browse sections, check seat availability, and enroll in one click — with prerequisite, credit-limit, and program checks enforced by the backend." },
  { icon: ClipboardCheck, title: "Attendance Tracking", text: "Instructors mark PRESENT, ABSENT, LATE, or EXCUSED per class day. Students see live attendance percentages per course." },
  { icon: FileText, title: "Exams & Results", text: "Weighted exams (quizzes, midterms, finals) with automatic grade calculation and a publish workflow for instructors." },
  { icon: BarChart3, title: "Transcript & GPA", text: "An official-style transcript with per-semester GPA and cumulative GPA computed from published results." },
  { icon: CreditCard, title: "Stripe Tuition Payments", text: "Secure Stripe Checkout for semester tuition — enrollment unlocks automatically once payment succeeds." },
  { icon: ShieldCheck, title: "Role-Based Access", text: "Three strictly separated portals for Students, Instructors, and Admins, with audit logging on every action." },
];

const STEPS = [
  { title: "Register", text: "Create your student account and pick your program. Your student ID is generated instantly." },
  { title: "Pay tuition", text: "Complete secure Stripe Checkout for the semester. Payment status syncs via webhook in seconds." },
  { title: "Enroll in sections", text: "Browse open sections, verify prerequisites and credits, and claim your seat." },
  { title: "Track progress", text: "Follow attendance, exam results, and your transcript as the semester unfolds." },
];

export default async function HomePage() {
  const [departments, programs, courses, semesters, openSemesters, catalog] = await Promise.all([
    publicFetch<Paginated<Department>>("/departments", { limit: 1 }),
    publicFetch<Paginated<Program>>("/programs", { limit: 1 }),
    publicFetch<Paginated<Course>>("/courses", { limit: 1 }),
    publicFetch<Paginated<Semester>>("/semesters", { limit: 1 }),
    publicFetch<Paginated<Semester>>("/semesters", { status: "REGISTRATION_OPEN", limit: 3 }),
    publicFetch<Paginated<Course>>("/courses", { limit: 4, sortBy: "code", sortOrder: "asc" }),
  ]);

  const statItems = [
    { label: "Departments", value: departments?.meta.total },
    { label: "Programs", value: programs?.meta.total },
    { label: "Courses", value: courses?.meta.total },
    { label: "Semesters", value: semesters?.meta.total },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(16,185,129,0.35), transparent), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(245,158,11,0.25), transparent)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="success" className="mb-5">
              <Sparkles className="h-3.5 w-3.5" /> University Management System
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Your entire university, <span className="text-emerald-400">one portal.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">
              Enrollment, attendance, exams, results, transcripts, and tuition payments — unified for students,
              instructors, and administrators with secure role-based access.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">Get started <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white">
                <Link href="/login">Login to portal</Link>
              </Button>
            </div>
          </div>
          <dl className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
                <dd className="font-display text-3xl font-bold text-white">{s.value ?? "—"}</dd>
                <dt className="mt-1 text-sm text-zinc-400">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900">Everything a modern campus needs</h2>
          <p className="mt-3 text-zinc-500">Built on a real REST API with strict business rules.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-zinc-900">How it works</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-zinc-200 bg-[#faf9f6] p-6">
                <span className="font-display text-4xl font-bold text-emerald-600/25">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Open for registration</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/pricing">All semesters <ArrowRight /></Link>
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {openSemesters && openSemesters.items.length > 0 ? (
                openSemesters.items.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p className="font-display text-lg font-semibold text-zinc-900">{s.name}</p>
                        <p className="text-sm text-zinc-500">{fmtDate(s.startDate)} — {fmtDate(s.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={s.status} />
                        <p className="mt-1 text-sm font-semibold text-zinc-900">{fmtMoney(s.tuitionFee)} tuition</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState icon={CalendarDays} title="No open semesters" description="Registration is not currently open for any semester." />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Course catalog</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/services">Explore services <ArrowRight /></Link>
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {catalog && catalog.items.length > 0 ? (
                catalog.items.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p className="font-display text-lg font-semibold text-zinc-900">
                          <span className="text-emerald-700">{c.code}</span> — {c.title}
                        </p>
                        <p className="text-sm text-zinc-500">{c.department.name} · {c.program.code}</p>
                      </div>
                      <Badge variant="secondary">{c.credits} credits</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState icon={BookOpen} title="Catalog unavailable" description="Courses will appear here once they are published." />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-700 px-6 py-14 text-center text-white sm:px-12">
          <GraduationCap className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">Ready to start your semester?</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100">
            Create a student account, pay tuition securely with Stripe, and enroll in your first section today.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-300/50 bg-transparent text-white hover:bg-emerald-600 hover:text-white">
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
