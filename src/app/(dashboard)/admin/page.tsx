import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, Clock, RotateCcw, ScrollText, Users, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { EmptyState, ErrorState, PageHeader, StatCard } from "@/components/shared";
import { AdminCharts } from "@/views/admin-charts";
import { authFetch } from "@/lib/server/api";
import { fmtDateTime, fmtMoney } from "@/lib/utils";
import type { AuditLog, DashboardStats, PageMeta } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Overview",
  description: "System-wide analytics, payments, and recent activity.",
};

/**
 * Server Component: statistics are fetched on the server with the session
 * cookie (no client waterfall); only the charts hydrate on the client.
 */
export default async function AdminOverviewPage() {
  const [stats, logs] = await Promise.all([
    authFetch<DashboardStats>("/admin/dashboard-stats"),
    authFetch<{ logs: AuditLog[]; meta: PageMeta }>("/admin/audit-logs", { limit: 8 }),
  ]);

  const header = (
    <PageHeader
      title="Overview"
      description="System-wide analytics and recent activity."
      actions={
        <Button asChild>
          <Link href="/admin/users">Manage users <ArrowRight /></Link>
        </Button>
      }
    />
  );

  if (!stats.data) {
    return (
      <div>
        {header}
        <ErrorState message="Could not load dashboard statistics. Refresh the page to try again." />
      </div>
    );
  }

  const d = stats.data;

  return (
    <div>
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={d.users.total} icon={Users} sub={`${d.users.students} students · ${d.users.instructors} instructors`} />
        <StatCard label="Courses" value={d.academic.courses} icon={BookOpen} sub={`${d.academic.programs} programs`} accent="bg-sky-50 text-sky-700" />
        <StatCard label="Sections" value={d.academic.sections} icon={ClipboardList} sub={`${d.academic.enrollments} enrollments`} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Tuition revenue" value={fmtMoney(d.payments.totalRevenueUSD)} icon={Wallet} sub={`${d.payments.succeeded} succeeded payments`} accent="bg-violet-50 text-violet-700" />
        <StatCard label="Semesters" value={d.academic.semesters} icon={CalendarDays} sub={`${d.academic.departments} departments`} />
        <StatCard label="Pending payments" value={d.payments.pending} icon={Clock} sub={`${d.payments.failed} failed · ${d.payments.canceled} canceled`} accent="bg-orange-50 text-orange-700" />
        <StatCard label="Refunded" value={d.payments.refunded} icon={RotateCcw} sub="via Stripe refunds" accent="bg-zinc-100 text-zinc-700" />
        <StatCard label="Audit events" value={d.auditLogs.total} icon={ScrollText} sub="all recorded actions" accent="bg-rose-50 text-rose-700" />
      </div>

      <AdminCharts stats={d} />

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent audit activity</CardTitle>
            <CardDescription>Latest recorded actions across the system</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/audit-logs">View all <ArrowRight /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {logs.data && logs.data.logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[11px]">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell>{log.actor?.name ?? "System"}</TableCell>
                    <TableCell className="text-zinc-500">{fmtDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={ScrollText} title="No audit activity yet" description="Actions performed in the system will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
