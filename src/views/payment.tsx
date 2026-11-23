"use client";

/* ------------------------------------------------------------------ */
/*  Stripe Checkout redirect targets.                                 */
/*  Backend STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL must point here    */
/*  with ?session_id={CHECKOUT_SESSION_ID}.                           */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { Logo } from "@/components/layout";
import { paymentApi } from "@/lib/services";
import { fmtMoney } from "@/lib/utils";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PaymentSuccessView() {
  const sessionId = useSearchParams().get("session_id") ?? "";
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["checkout-success", sessionId],
    queryFn: () => paymentApi.checkoutSuccess(sessionId),
    enabled: sessionId.length > 0,
    // The webhook may still be confirming the payment — poll while PENDING.
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 2500 : false),
    meta: { silent: true },
  });

  const data = result.data;

  useEffect(() => {
    if (data?.status === "SUCCEEDED") {
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments-all"] });
    }
  }, [data?.status, queryClient]);

  if (!sessionId) {
    return (
      <Frame>
        <XCircle className="mx-auto h-14 w-14 text-red-500" />
        <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Missing checkout session</h1>
        <p className="mt-2 text-sm text-zinc-500">This page is opened automatically after Stripe Checkout.</p>
        <Button asChild className="mt-6 w-full">
          <Link href="/dashboard/payment">Go to payments</Link>
        </Button>
      </Frame>
    );
  }

  if (result.isLoading || data?.status === "PENDING") {
    return (
      <Frame>
        <Loader2 className="mx-auto h-14 w-14 animate-spin text-emerald-600" />
        <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Verifying payment…</h1>
        <p className="mt-2 text-sm text-zinc-500" aria-live="polite">
          {data?.note ?? "Stripe received your payment. The webhook is verifying it — this usually takes a few seconds."}
        </p>
      </Frame>
    );
  }

  if (result.isError || !data) {
    return (
      <Frame>
        <XCircle className="mx-auto h-14 w-14 text-red-500" />
        <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Payment not found</h1>
        <p className="mt-2 text-sm text-zinc-500">We couldn&apos;t find a payment for this checkout session.</p>
        <Button asChild className="mt-6 w-full">
          <Link href="/dashboard/payments">Back to payments</Link>
        </Button>
      </Frame>
    );
  }

  if (data.status !== "SUCCEEDED") {
    return (
      <Frame>
        <XCircle className="mx-auto h-14 w-14 text-red-500" />
        <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Payment {data.status.toLowerCase()}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your payment for {data.semester.name} did not complete. You can try again from the payments page.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/dashboard/payments">Try again</Link>
        </Button>
      </Frame>
    );
  }

  return (
    <Frame>
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Payment successful!</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Tuition for <span className="font-semibold text-zinc-800">{data.semester.name} ({data.semester.code})</span> is paid.
        You can now enroll in sections for this semester.
      </p>
      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Amount paid</p>
        <p className="mt-1 font-display text-3xl font-bold text-zinc-900">{fmtMoney(data.amount)}</p>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard/browse">Browse courses <ArrowRight /></Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </Frame>
  );
}

export function PaymentCancelView() {
  const sessionId = useSearchParams().get("session_id") ?? "";
  const result = useQuery({
    queryKey: ["checkout-cancel", sessionId],
    queryFn: () => paymentApi.checkoutCancel(sessionId),
    enabled: sessionId.length > 0,
    meta: { silent: true },
  });

  return (
    <Frame>
      <XCircle className="mx-auto h-14 w-14 text-amber-500" />
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Payment canceled</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {result.data
          ? `Your checkout for ${result.data.semester.name} (${result.data.semester.code}) — ${fmtMoney(result.data.amount)} — was canceled. No charge was made.`
          : "Your checkout was canceled and no charge was made. You can try again whenever you're ready."}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard/payment">Try payment again</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </Frame>
  );
}
