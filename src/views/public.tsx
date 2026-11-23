"use client";

/* ------------------------------------------------------------------ */
/*  Interactive islands for otherwise server-rendered public pages.   */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { FormField } from "@/components/shared";
import { cn } from "@/lib/utils";

/* ------------------------------ FAQ accordion ------------------------ */

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const expanded = open === i;
        const panelId = `faq-panel-${i}`;
        return (
          <Card key={item.q} className="overflow-hidden">
            <button
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              onClick={() => setOpen(expanded ? null : i)}
              aria-expanded={expanded}
              aria-controls={panelId}
            >
              <span className="font-semibold text-zinc-900">{item.q}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-zinc-400 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <p id={panelId} className="border-t border-zinc-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-zinc-600">
                {item.a}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------- Contact form ------------------------ */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const REGISTRAR_EMAIL = "registrar@ums.edu";

/**
 * The UMS API has no contact endpoint, so the validated message is handed to
 * the user's mail client addressed to the registrar.
 */
export function ContactForm() {
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
    mode: "onTouched",
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    const body = `${values.message}\n\n— ${values.name} (${values.email})`;
    window.location.href = `mailto:${REGISTRAR_EMAIL}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Opening your email client…");
    form.reset();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="contact-name" error={errors.name?.message} required>
          <Input id="contact-name" placeholder="Your name" autoComplete="name" {...form.register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="contact-email" error={errors.email?.message} required>
          <Input id="contact-email" type="email" placeholder="you@example.com" autoComplete="email" {...form.register("email")} />
        </FormField>
      </div>
      <FormField label="Subject" htmlFor="contact-subject" error={errors.subject?.message} required>
        <Input id="contact-subject" placeholder="How can we help?" {...form.register("subject")} />
      </FormField>
      <FormField label="Message" htmlFor="contact-message" error={errors.message?.message} required>
        <Textarea id="contact-message" placeholder="Write your message…" rows={5} {...form.register("message")} />
      </FormField>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        <Send /> Send message
      </Button>
    </form>
  );
}
