"use client";

/* ------------------------------------------------------------------ */
/*  Admin: User management (client view).                                */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState as useSearchParams } from "../hooks/hooks";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Eye,
  Loader2,
  ScrollText,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  PaginationControls,
  RoleBadge,
  SearchInput,
  StatCard,
  StatusBadge,
  TableSkeleton,
  UserAvatar,
} from "../components/shared";
import { adminApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { toastApiError, useDebounce, usePagination } from "../hooks/hooks";
import { fmtDateTime, fmtMoney, titleCase } from "../lib/utils";
import type { AdminUser, Role } from "../lib/types";

/* ----------------------------- Admin Users --------------------------- */

const ROLE_OPTIONS: Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];

export function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePagination();

  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const debouncedSearch = useDebounce(search, 400);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const users = useQuery({
    queryKey: ["admin-users", page, debouncedSearch, role, isActive],
    queryFn: () =>
      adminApi.users({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: role || undefined,
        isActive: isActive || undefined,
      }),
  });

  const [viewing, setViewing] = React.useState<AdminUser | null>(null);
  const [roleTarget, setRoleTarget] = React.useState<AdminUser | null>(null);
  const [newRole, setNewRole] = React.useState<Role>("STUDENT");
  const [statusTarget, setStatusTarget] = React.useState<AdminUser | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const roleMutation = useMutation({
    mutationFn: ({ id, role: r }: { id: string; role: Role }) => adminApi.updateRole(id, r),
    onSuccess: () => {
      toast.success("Role updated");
      setRoleTarget(null);
      invalidate();
    },
    onError: (e) => toastApiError(e, "Could not update role"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.updateStatus(id, active),
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? "User activated" : "User deactivated");
      setStatusTarget(null);
      invalidate();
    },
    onError: (e) => toastApiError(e, "Could not update status"),
  });

  const openRoleDialog = (u: AdminUser) => {
    setRoleTarget(u);
    setNewRole(u.role);
  };

  return (
    <div>
      <PageHeader title="Users" description="Manage accounts, roles, and activation status." />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(v) => setParam("search", v)}
              placeholder="Search by name or email…"
              className="sm:max-w-xs sm:flex-1"
            />
            <Select value={role || "all"} onValueChange={(v) => setParam("role", v === "all" ? "" : v)}>
              <SelectTrigger className="sm:w-44" aria-label="Filter by role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{titleCase(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isActive || "all"} onValueChange={(v) => setParam("isActive", v === "all" ? "" : v)}>
              <SelectTrigger className="sm:w-44" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {users.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : users.isError ? (
          <div className="p-4">
            <ErrorState message="Could not load users." onRetry={() => users.refetch()} />
          </div>
        ) : users.data && users.data.users.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.users.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} src={u.avatar} className="h-9 w-9" />
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {u.name}
                              {isSelf && <Badge variant="secondary" className="ml-2">You</Badge>}
                            </p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell>
                        {u.studentProfile ? (
                          <span className="text-sm">
                            <span className="font-mono text-xs text-zinc-500">{u.studentProfile.studentId}</span>
                            <br />
                            <span className="text-xs text-zinc-500">{u.studentProfile.program.code}</span>
                          </span>
                        ) : u.instructorProfile ? (
                          <span className="text-sm">
                            <span className="font-mono text-xs text-zinc-500">{u.instructorProfile.employeeId}</span>
                            <br />
                            <span className="text-xs text-zinc-500">{u.instructorProfile.department.code}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "success" : "destructive"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">{fmtDateTime(u.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewing(u)} aria-label={`View ${u.name}`}>
                            <Eye />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRoleDialog(u)}
                            disabled={isSelf}
                            aria-label={`Change role of ${u.name}`}
                            title={isSelf ? "You cannot change your own role" : "Change role"}
                          >
                            <UserCog />
                          </Button>
                          <Switch
                            checked={u.isActive}
                            disabled={isSelf}
                            onCheckedChange={() => setStatusTarget(u)}
                            aria-label={`Toggle active status for ${u.name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-4 pb-4">
              <PaginationControls page={users.data.meta.page} totalPages={users.data.meta.totalPages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
          </div>
        )}
      </Card>

      {/* View user dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Profile information and recent payments.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={viewing.name} src={viewing.avatar} className="h-12 w-12" />
                <div>
                  <p className="font-display text-lg font-semibold text-zinc-900">{viewing.name}</p>
                  <p className="text-sm text-zinc-500">{viewing.email}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <RoleBadge role={viewing.role} />
                  <Badge variant={viewing.isActive ? "success" : "destructive"}>{viewing.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Joined</p>
                  <p className="font-semibold text-zinc-900">{fmtDateTime(viewing.createdAt)}</p>
                </div>
                {viewing.studentProfile && (
                  <>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Student ID</p>
                      <p className="font-mono font-semibold text-zinc-900">{viewing.studentProfile.studentId}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Program</p>
                      <p className="font-semibold text-zinc-900">{viewing.studentProfile.program.name}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Admission year</p>
                      <p className="font-semibold text-zinc-900">{viewing.studentProfile.admissionYear}</p>
                    </div>
                  </>
                )}
                {viewing.instructorProfile && (
                  <>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Employee ID</p>
                      <p className="font-mono font-semibold text-zinc-900">{viewing.instructorProfile.employeeId}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Designation</p>
                      <p className="font-semibold text-zinc-900">{viewing.instructorProfile.designation}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Department</p>
                      <p className="font-semibold text-zinc-900">{viewing.instructorProfile.department.name}</p>
                    </div>
                  </>
                )}
              </div>
              {viewing.payments && viewing.payments.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-900">Recent payments</p>
                  <div className="space-y-2">
                    {viewing.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                        <span>{p.semester.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">{fmtMoney(p.amount)}</span>
                          <StatusBadge status={p.status} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Update the role for {roleTarget?.name} ({roleTarget?.email}).
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
            <SelectTrigger aria-label="New role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{titleCase(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button
              onClick={() => roleTarget && roleMutation.mutate({ id: roleTarget.id, role: newRole })}
              disabled={roleMutation.isPending || newRole === roleTarget?.role}
            >
              {roleMutation.isPending && <Loader2 className="animate-spin" />}
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle status confirm */}
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget?.isActive ? "Deactivate user?" : "Activate user?"}
        description={
          statusTarget?.isActive
            ? `${statusTarget.name} will no longer be able to log in.`
            : `${statusTarget?.name} will be able to log in again.`
        }
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
        destructive={statusTarget?.isActive}
        loading={statusMutation.isPending}
        onConfirm={() => statusTarget && statusMutation.mutate({ id: statusTarget.id, active: !statusTarget.isActive })}
      />
    </div>
  );
}
