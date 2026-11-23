import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { ContactForm } from "@/views/public";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the registrar's office about enrollment, tuition, or transcripts.",
  openGraph: { title: "Contact UMS", description: "Talk to the registrar's office." },
};

const CHANNELS = [
  { icon: MapPin, title: "Campus", text: "University Road, Dhaka 1212" },
  { icon: Mail, title: "Email", text: "registrar@ums.edu" },
  { icon: Phone, title: "Phone", text: "+880 1700 000000" },
  { icon: Clock, title: "Office hours", text: "Sun–Thu, 9:00 AM – 5:00 PM" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <Badge variant="success" className="mb-4">Contact</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900">Talk to the registrar&apos;s office</h1>
        <p className="mt-4 text-zinc-500">Questions about enrollment, tuition, or your transcript? Send us a message.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {CHANNELS.map((c) => (
            <Card key={c.title}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><c.icon className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-zinc-900">{c.title}</p>
                  <p className="text-sm text-zinc-500">{c.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="bg-zinc-950 text-white">
            <CardContent className="p-5">
              <Building2 className="h-6 w-6 text-emerald-400" />
              <p className="mt-3 font-display text-lg font-semibold">Admissions open</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                Register online, pay tuition via Stripe, and enroll as soon as registration opens.
              </p>
              <Button asChild className="mt-4">
                <Link href="/register">Register now <ArrowRight /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="lg:col-span-3">
          <CardContent className="p-6 sm:p-8">
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
