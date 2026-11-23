"use client";

/* Recharts needs the DOM, so charts are a client island fed by the server page. */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import type { DashboardStats } from "@/lib/types";

const PIE_COLORS = ["#047857", "#0284c7", "#7c3aed"];
const PAYMENT_COLORS: Record<string, string> = {
  succeeded: "#047857",
  pending: "#d97706",
  failed: "#dc2626",
  canceled: "#71717a",
  refunded: "#7c3aed",
};

export function AdminCharts({ stats }: { stats: DashboardStats }) {
  const roleData = [
    { name: "Students", value: stats.users.students },
    { name: "Instructors", value: stats.users.instructors },
    { name: "Admins", value: stats.users.admins },
  ];
  const paymentData = [
    { name: "succeeded", value: stats.payments.succeeded },
    { name: "pending", value: stats.payments.pending },
    { name: "failed", value: stats.payments.failed },
    { name: "canceled", value: stats.payments.canceled },
    { name: "refunded", value: stats.payments.refunded },
  ];
  const academicData = [
    { name: "Departments", value: stats.academic.departments },
    { name: "Programs", value: stats.academic.programs },
    { name: "Courses", value: stats.academic.courses },
    { name: "Semesters", value: stats.academic.semesters },
    { name: "Sections", value: stats.academic.sections },
    { name: "Enrollments", value: stats.academic.enrollments },
  ];

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Users by role</CardTitle>
          <CardDescription>Distribution of registered accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64" role="img" aria-label={`Users: ${roleData.map((r) => `${r.value} ${r.name}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {roleData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments by status</CardTitle>
          <CardDescription>Stripe payment outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64" role="img" aria-label={`Payments: ${paymentData.map((p) => `${p.value} ${p.name}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {paymentData.map((p) => (
                    <Cell key={p.name} fill={PAYMENT_COLORS[p.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic footprint</CardTitle>
          <CardDescription>Counts across the academic structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64" role="img" aria-label="Academic structure counts">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={academicData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#047857" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
