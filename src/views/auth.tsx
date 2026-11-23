"use client";

/* ------------------------------------------------------------------ */
/*  Login (with one-click demo login for all 3 roles) and the         */
/*  multi-step Register wizard. Both use React Hook Form + Zod with   */
/*  rules mirroring the backend auth.validation.ts.                   */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardContent, Input, Skeleton } from "@/components/ui";
import { FormField } from "@/components/shared";
import { Logo } from "@/components/layout";
import { authApi, programApi } from "@/lib/services";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { roleHome } from "@/lib/roles";
import { toastApiError } from "@/hooks/hooks";
import type { Role, User } from "@/lib/types";

/** Store the session in the query cache and navigate to the right dashboard. */
function useFinishAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  return (user: User, message: string) => {
    queryClient.clear();
    queryClient.setQueryData(["session"], user);
    toast.success(message);
    const from = searchParams.get("from");
    const home = roleHome(user.role);
    // Only honour ?from= when it points inside this user's own area.
    const target = from && from.startsWith("/") && !from.startsWith("//") && from.startsWith(home) ? from : home;
    router.replace(target);
    router.refresh();
  };
}

/* -------------------------------- Login ------------------------------ */

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ICONS: Record<Role, React.ReactNode> = {
  ADMIN: <ShieldCheck className="h-6 w-6" />,
  INSTRUCTOR: <Users className="h-6 w-6" />,
  STUDENT: <GraduationCap className="h-6 w-6" />,
};

export function LoginView() {
  const finishAuth = useFinishAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState<Role | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { user } = await authApi.login(values.email, values.password);
      finishAuth(user, `Welcome back, ${user.name.split(" ")[0]}!`);
    } catch (error) {
      toastApiError(error, "Login failed");
    }
  });

  const demoLogin = async (role: Role, email: string, password: string) => {
    setDemoLoading(role);
    try {
      const { user } = await authApi.login(email, password);
      finishAuth(user, `Logged in as demo ${role.toLowerCase()}`);
    } catch (error) {
      toastApiError(error, "Demo login failed");
      setDemoLoading(null);
    }
  };

  const busy = form.formState.isSubmitting || demoLoading !== null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-7 sm:p-8">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Welcome back 👋</h1>
              <p className="mt-1.5 text-sm text-zinc-500">Login to your account</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-2xl border border-zinc-200 p-5">
              <FormField label="Email" htmlFor="login-email" error={form.formState.errors.email?.message} required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@ums.edu"
                    className="pl-9"
                    autoComplete="email"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                </div>
              </FormField>
              <FormField label="Password" htmlFor="login-password" error={form.formState.errors.password?.message} required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Login
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">or</span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <section aria-labelledby="demo-login-heading">
              <h2 id="demo-login-heading" className="text-center font-display text-base font-semibold text-zinc-900">
                🚀 Quick Demo Login
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((d, i) => (
                  <div
                    key={d.role}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center ${
                      i === DEMO_ACCOUNTS.length - 1 ? "sm:col-span-2 sm:mx-auto sm:w-1/2" : ""
                    }`}
                  >
                    <span className="text-emerald-700">{DEMO_ICONS[d.role]}</span>
                    <span className="text-sm font-bold text-zinc-900">{d.label}</span>
                    <span className="text-[11px] leading-tight text-zinc-500">{d.blurb}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-1 w-full"
                      onClick={() => demoLogin(d.role, d.email, d.password)}
                      disabled={busy}
                      aria-label={`Demo login as ${d.label}`}
                    >
                      {demoLoading === d.role && <Loader2 className="animate-spin" />}
                      Demo Login
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
                Register as a student
              </Link>
            </p>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-zinc-400">
          httpOnly JWT cookies · Role-based access control
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Register ---------------------------- */

const currentYear = new Date().getFullYear();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  programId: z.string().min(1, "Please select a program"),
  admissionYear: z
    .number({ message: "Enter a valid year" })
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
});

type RegisterForm = z.infer<typeof registerSchema>;

const STEPS: { label: string; fields: (keyof RegisterForm)[] }[] = [
  { label: "Account", fields: ["name", "email", "password", "confirmPassword"] },
  { label: "Program", fields: ["programId", "admissionYear"] },
  { label: "Review", fields: [] },
];

export function RegisterView() {
  const finishAuth = useFinishAuth();
  const [step, setStep] = React.useState(0);

  const programs = useQuery({
    queryKey: ["register-programs"],
    queryFn: () => programApi.list({ limit: 100 }),
  });

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", programId: "", admissionYear: currentYear },
    mode: "onTouched",
  });
  const { errors, isSubmitting } = form.formState;

  const next = async () => {
    const valid = await form.trigger(STEPS[step].fields);
    if (!valid) return;
    if (step === 0 && form.getValues("password") !== form.getValues("confirmPassword")) {
      form.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { user } = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
        programId: values.programId,
        admissionYear: values.admissionYear,
      });
      finishAuth(user, "Account created — welcome to UMS!");
    } catch (error) {
      toastApiError(error, "Registration failed");
    }
  });

  const values = form.watch();
  const selectedProgram = programs.data?.items.find((p) => p.id === values.programId);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-7 sm:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Create your account</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Student registration — it takes less than a minute.</p>

            <ol className="mt-6 flex items-center gap-2" aria-label="Registration progress">
              {STEPS.map((s, i) => (
                <li key={s.label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={i === step ? "step" : undefined}>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i < step
                        ? "bg-emerald-600 text-white"
                        : i === step
                          ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                          : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`text-sm font-medium ${i === step ? "text-zinc-900" : "text-zinc-500"}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-zinc-200" />}
                </li>
              ))}
            </ol>

            <form onSubmit={onSubmit} noValidate>
              {step === 0 && (
                <div className="mt-6 space-y-4">
                  <FormField label="Full name" htmlFor="reg-name" error={errors.name?.message} required>
                    <Input id="reg-name" placeholder="Rahul Ahmed" autoComplete="name" {...form.register("name")} />
                  </FormField>
                  <FormField label="Email" htmlFor="reg-email" error={errors.email?.message} required>
                    <Input id="reg-email" type="email" placeholder="you@ums.edu" autoComplete="email" {...form.register("email")} />
                  </FormField>
                  <FormField
                    label="Password"
                    htmlFor="reg-password"
                    error={errors.password?.message}
                    hint="8–72 characters with upper, lower, and a number"
                    required
                  >
                    <Input id="reg-password" type="password" autoComplete="new-password" {...form.register("password")} />
                  </FormField>
                  <FormField label="Confirm password" htmlFor="reg-confirm" error={errors.confirmPassword?.message} required>
                    <Input id="reg-confirm" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
                  </FormField>
                </div>
              )}

              {step === 1 && (
                <div className="mt-6 space-y-4">
                  <FormField label="Program" htmlFor="reg-program" error={errors.programId?.message} required>
                    {programs.isLoading ? (
                      <Skeleton className="h-10" />
                    ) : (
                      <select
                        id="reg-program"
                        className="flex h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
                        {...form.register("programId")}
                      >
                        <option value="">Select your program…</option>
                        {programs.data?.items.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>
                  <FormField label="Admission year" htmlFor="reg-year" error={errors.admissionYear?.message} required>
                    <Input id="reg-year" type="number" min={2000} max={2100} {...form.register("admissionYear", { valueAsNumber: true })} />
                  </FormField>
                  <p className="rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-500">
                    Your student ID (e.g. STU-{currentYear}-123456) is generated automatically after registration.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 space-y-3">
                  {[
                    { label: "Name", value: values.name },
                    { label: "Email", value: values.email },
                    { label: "Program", value: selectedProgram ? `${selectedProgram.name} (${selectedProgram.code})` : "—" },
                    { label: "Admission year", value: String(values.admissionYear) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-500">{row.label}</span>
                      <span className="text-right text-sm font-semibold text-zinc-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0 || isSubmitting}>
                  <ArrowLeft /> Back
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={next}>
                    Continue <ArrowRight />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Create account
                  </Button>
                )}
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
