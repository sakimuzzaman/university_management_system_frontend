import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description: "Three purpose-built portals — Student, Instructor, and Admin — with strict role-based permissions.",
  openGraph: { title: "UMS Services", description: "Three portals, one system." },
};

const PORTALS: { role: string; icon: LucideIcon; title: string; text: string; features: string[]; href: string }[] = [
  {
    role: "Student",
    icon: GraduationCap,
    title: "Student Portal",
    text: "Everything you need to succeed each semester.",
    features: ["Browse & enroll in sections", "Pay tuition via Stripe Checkout", "Live attendance percentages", "Published results & transcript", "Profile & program management"],
    href: "/dashboard",
  },
  {
    role: "Instructor",
    icon: BookOpen,
    title: "Instructor Portal",
    text: "Run your sections with confidence.",
    features: ["Mark daily attendance", "Create weighted exams", "Enter & publish results", "View section rosters", "Manage your profile"],
    href: "/instructor",
  },
  {
    role: "Admin",
    icon: BarChart3,
    title: "Admin Console",
    text: "Full control over the academic system.",
    features: ["Users, roles & activation", "Departments, programs & courses", "Semesters & status lifecycle", "Sections & instructor assignment", "Audit logs & analytics"],
    href: "/admin",
  },
];

const CAPABILITIES = [
  { icon: Wallet, title: "Payments", text: "Stripe Checkout with webhook-verified status, cancel & refund flows." },
  { icon: ClipboardCheck, title: "Attendance", text: "Per-day records with PRESENT / ABSENT / LATE / EXCUSED states." },
  { icon: FileText, title: "Grading", text: "Weighted assessments, automatic letter grades, and GPA math." },
  { icon: ShieldCheck, title: "Security", text: "httpOnly JWT cookies, rotating refresh tokens, and audit trails." },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="success" className="mb-4">Services</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">Three portals, one system</h1>
        <p className="mt-4 text-zinc-500">
          Each role gets a purpose-built workspace with permissions enforced at both the route and API level.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PORTALS.map((p) => (
          <Card key={p.role} className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="flex flex-1 flex-col p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-600 p-3 text-white">
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{p.role}</p>
                  <h2 className="font-display text-xl font-semibold text-zinc-900">{p.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-500">{p.text}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link href={p.href}>Open {p.title.toLowerCase()} <ArrowRight /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-6">
              <f.icon className="h-6 w-6 text-emerald-700" />
              <h2 className="mt-3 font-display text-base font-semibold text-zinc-900">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
