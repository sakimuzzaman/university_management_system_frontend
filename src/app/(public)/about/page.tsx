import { Fragment } from "react";
import type { Metadata } from "next";
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import { publicFetch } from "@/lib/server/api";
import type { Department, Paginated, Program } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description: "Learn how UMS connects students, instructors, and administrators — our departments, programs, and academic lifecycle.",
  openGraph: { title: "About UMS", description: "The operating system for academic life." },
};

const VALUES = [
  { icon: ShieldCheck, title: "Integrity", text: "Every action is audit-logged. Grades, payments, and enrollments are traceable end to end." },
  { icon: Users, title: "Student-first", text: "Clear rules surfaced in the UI — prerequisites, credit limits, and deadlines are never a surprise." },
  { icon: Sparkles, title: "Modern by default", text: "A fast, accessible, mobile-first experience built with Next.js, Tailwind, and a typed REST API." },
];

export default async function AboutPage() {
  const [departments, programs] = await Promise.all([
    publicFetch<Paginated<Department>>("/departments", { limit: 100 }, 300),
    publicFetch<Paginated<Program>>("/programs", { limit: 100 }, 300),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <Badge variant="success" className="mb-4">About UMS</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          The operating system for academic life
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600">
          The University Management System (UMS) connects the three people who run a university — students,
          instructors, and administrators — through one secure platform, replacing spreadsheets and paper registers
          with a typed API and a polished web experience.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {VALUES.map((v) => (
          <Card key={v.title}>
            <CardContent className="p-6">
              <div className="w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <v.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-zinc-900">{v.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{v.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Departments</h2>
          <div className="mt-5 space-y-3">
            {departments && departments.items.length > 0 ? (
              departments.items.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 font-display text-sm font-bold text-white">
                      {d.code}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{d.name}</p>
                      <p className="text-sm text-zinc-500">{d.description ?? "Academic department"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState icon={Building2} title="No departments listed" description="Departments will appear here once created." />
            )}
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Programs</h2>
          <div className="mt-5 space-y-3">
            {programs && programs.items.length > 0 ? (
              programs.items.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="font-semibold text-zinc-900">{p.name}</p>
                      <p className="text-sm text-zinc-500">{p.department.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{p.code}</Badge>
                      <p className="mt-1 text-xs text-zinc-500">{p.durationYears} years</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState icon={GraduationCap} title="No programs listed" description="Degree programs will appear here once created." />
            )}
          </div>
        </section>
      </div>

      <div className="mt-14 rounded-3xl bg-zinc-950 p-8 text-white sm:p-12">
        <h2 className="font-display text-2xl font-bold tracking-tight">Our academic calendar, enforced by code</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-zinc-300">
          Semesters move through a strict lifecycle. Enrollment only works while registration is open, attendance and
          exams only during an ongoing semester, and transcripts finalize only after completion.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["UPCOMING", "REGISTRATION_OPEN", "ONGOING", "COMPLETED"].map((s, i, arr) => (
            <Fragment key={s}>
              <StatusBadge status={s} />
              {i < arr.length - 1 && <ArrowRight className="h-4 w-4 self-center text-zinc-500" aria-hidden />}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
