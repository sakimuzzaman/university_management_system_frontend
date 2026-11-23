import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { EmptyState, StatusBadge } from "@/components/shared";
import { FaqAccordion } from "@/views/public";
import { publicFetch } from "@/lib/server/api";
import { fmtMoney } from "@/lib/utils";
import type { Paginated, Semester } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pricing & FAQ",
  description: "Semester tuition fees, Stripe payment details, and answers to common enrollment questions.",
  openGraph: { title: "UMS Tuition & FAQ", description: "One flat tuition fee per semester, paid securely via Stripe." },
};

const FAQS = [
  { q: "How do I pay tuition?", a: "From the Student Portal → Tuition Payments, choose a semester and click Pay. You'll be redirected to Stripe Checkout. Once the webhook confirms success, enrollment unlocks automatically." },
  { q: "When can I enroll in courses?", a: "While a semester is in REGISTRATION_OPEN status, your tuition for that semester has SUCCEEDED, and you're within the semester credit limit." },
  { q: "What if my payment is pending?", a: "Stripe webhooks usually confirm within seconds. The success page polls automatically. You can also cancel a pending checkout and try again." },
  { q: "Can I drop a course after enrolling?", a: "Yes — drops are allowed while the semester is still in REGISTRATION_OPEN. Once the semester is ONGOING, enrollments are locked." },
  { q: "How is my GPA calculated?", a: "Each course's weighted percentage maps to a letter grade (A = 4.0 … F = 0.0). Semester GPA is credit-weighted; cumulative GPA spans all completed semesters." },
];

export default async function PricingPage() {
  const semesters = await publicFetch<Paginated<Semester>>("/semesters", { limit: 100 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="success" className="mb-4">Pricing</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">Tuition per semester</h1>
        <p className="mt-4 text-zinc-500">One flat fee per semester — no per-course charges. Fees are live from the academic calendar.</p>
      </div>

      {semesters && semesters.items.length > 0 ? (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {semesters.items.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-zinc-900">{s.name}</h2>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-900">{fmtMoney(s.tuitionFee)}</p>
                <p className="text-sm text-zinc-500">per semester · {s.maxCredits} max credits</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-600">
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> All sections in the semester</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Exams, results & transcript</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> Secure Stripe Checkout</li>
                </ul>
                <Button asChild className="mt-5 w-full" variant={s.status === "COMPLETED" ? "outline" : "default"}>
                  <Link href="/dashboard/payments">{s.status === "COMPLETED" ? "View records" : "Pay tuition"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState icon={CalendarDays} title="No semesters published" description="Tuition fees will appear here once the academic calendar is published." />
        </div>
      )}

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Payment methods</h2>
          <div className="mt-5 space-y-3">
            <Card>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-xl bg-violet-50 p-3 text-violet-700"><CreditCard className="h-6 w-6" /></div>
                <div>
                  <p className="font-semibold text-zinc-900">Stripe Checkout (Test Mode)</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    Pay by card on Stripe&apos;s hosted checkout. Test card <span className="font-mono text-zinc-700">4242 4242 4242 4242</span>, any future date and CVC.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck className="h-6 w-6" /></div>
                <div>
                  <p className="font-semibold text-zinc-900">Webhook-verified</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    Payments are only marked SUCCEEDED after Stripe&apos;s signed webhook confirms them — no manual updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Frequently asked questions</h2>
          <div className="mt-5">
            <FaqAccordion items={FAQS} />
          </div>
        </section>
      </div>
    </div>
  );
}
