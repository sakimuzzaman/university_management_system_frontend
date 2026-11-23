/* ------------------------------------------------------------------ */
/*  Shared, reusable components used across all pages.                */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "./ui";
import { cn, gradeTone, initials, titleCase } from "../lib/utils";
import type { Role } from "../lib/types";

/* ------------------------------ PageHeader --------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------- StatCard ---------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent = "bg-emerald-50 text-emerald-700",
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- StatusBadge --------------------------- */

const STATUS_VARIANTS: Record<string, string> = {
  /* semesters */
  UPCOMING: "secondary",
  REGISTRATION_OPEN: "success",
  ONGOING: "info",
  COMPLETED: "outline",
  /* payments */
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "destructive",
  CANCELED: "secondary",
  REFUNDED: "violet",
  /* attendance */
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  EXCUSED: "info",
  /* enrollment */
  ENROLLED: "success",
  DROPPED: "secondary",
  /* roles */
  ADMIN: "violet",
  INSTRUCTOR: "info",
  STUDENT: "success",
  /* exams */
  QUIZ: "info",
  MIDTERM: "warning",
  FINAL: "violet",
  ASSIGNMENT: "success",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = (STATUS_VARIANTS[status] ?? "secondary") as
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "violet";
  return (
    <Badge variant={variant} className={className}>
      {titleCase(status)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <StatusBadge status={role} />;
}

export function GradeBadge({ grade }: { grade: string | null | undefined }) {
  return (
    <span className={cn("inline-flex min-w-9 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold", gradeTone(grade))}>
      {grade ?? "—"}
    </span>
  );
}

/* ------------------------------ EmptyState --------------------------- */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-14 text-center">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <Icon className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------ ErrorState --------------------------- */

export function ErrorState({
  message = "Failed to load data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-14 text-center">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-zinc-900">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ----------------------------- SearchInput --------------------------- */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
      />
    </div>
  );
}

/* -------------------------- PaginationControls ----------------------- */

export function PaginationControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = start; i <= Math.min(totalPages, start + 4); i++) pages.push(i);
  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-sm text-zinc-500">
        Page <span className="font-semibold text-zinc-800">{page}</span> of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft /> Prev
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="w-9 px-0"
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ FormField ---------------------------- */

export function FormField({
  label,
  error,
  hint,
  htmlFor,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------- ConfirmDialog -------------------------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  loading,
  destructive,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- TableSkeleton -------------------------- */

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

/* ------------------------------ UserAvatar --------------------------- */

export function UserAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return (
    <span className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100", className)}>
      {src ? (
        <Image src={src} alt={name} fill sizes="96px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-800" aria-hidden>
          {initials(name)}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
