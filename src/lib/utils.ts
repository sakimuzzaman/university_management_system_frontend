import { cn } from "../utils/cn";

export { cn };

/** Coerce a Prisma Decimal (string | number) to a number. */
export const num = (v: string | number | null | undefined): number =>
  v === null || v === undefined ? 0 : Number(v);

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function fmtDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}

/** "2025-09-01" style date-only string for <input type="date">. */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function fmtMoney(value: string | number | null | undefined): string {
  const n = num(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function fmtPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Mirrors the backend grade scale (grade.ts). */
export function gradeForPercentage(percentage: number): {
  grade: string;
  points: number;
} {
  if (percentage >= 90) return { grade: "A", points: 4.0 };
  if (percentage >= 85) return { grade: "A-", points: 3.7 };
  if (percentage >= 80) return { grade: "B+", points: 3.3 };
  if (percentage >= 75) return { grade: "B", points: 3.0 };
  if (percentage >= 70) return { grade: "B-", points: 2.7 };
  if (percentage >= 65) return { grade: "C+", points: 2.3 };
  if (percentage >= 60) return { grade: "C", points: 2.0 };
  if (percentage >= 50) return { grade: "D", points: 1.0 };
  return { grade: "F", points: 0.0 };
}

export function gradeTone(grade: string | null | undefined): string {
  if (!grade) return "bg-zinc-100 text-zinc-600";
  if (grade.startsWith("A")) return "bg-emerald-100 text-emerald-800";
  if (grade.startsWith("B")) return "bg-sky-100 text-sky-800";
  if (grade.startsWith("C")) return "bg-amber-100 text-amber-800";
  if (grade.startsWith("D")) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}
