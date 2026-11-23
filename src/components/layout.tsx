"use client";

/* ------------------------------------------------------------------ */
/*  Interactive layout chrome: public navbar, footer, and the         */
/*  role-based dashboard shell (sidebar + header).                    */
/* ------------------------------------------------------------------ */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from "./ui";
import { UserAvatar } from "./shared";
import { cn, titleCase } from "@/lib/utils";
import { roleHome } from "@/lib/roles";
import { authApi } from "@/lib/services";
import { UNAUTHORIZED_EVENT } from "@/lib/api";
import { useSession } from "@/hooks/hooks";
import { AuthStoreProvider, useAuthStore } from "@/store/authStore";
import type { Role, User } from "@/lib/types";

/* -------------------------------- Logo ------------------------------- */

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="UMS home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className={cn("font-display text-xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>
        UMS
        <span className="ml-1.5 hidden text-xs font-semibold uppercase tracking-widest text-emerald-600 sm:inline">
          University
        </span>
      </span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* cookies are cleared server-side regardless */
    }
    queryClient.clear();
    toast.success("Logged out");
    router.replace("/login");
    router.refresh();
  }, [queryClient, router]);
}

/* ----------------------------- PublicNavbar -------------------------- */

const PUBLIC_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useSession();
  const logout = useLogout();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => {
            const active = isActivePath(pathname, l.href, l.exact);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-emerald-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="outline">
                <Link href={roleHome(user.role)}>Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label="Account menu"
                  >
                    <UserAvatar name={user.name} src={user.avatar} className="h-9 w-9" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs font-normal text-zinc-500">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(roleHome(user.role))}>
                    <LayoutDashboard /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActivePath(pathname, l.href, l.exact) ? "bg-emerald-50 text-emerald-700" : "text-zinc-700",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Separator className="my-2" />
            {user ? (
              <>
                <Link href={roleHome(user.role)} className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700">
                  Dashboard
                </Link>
                <button onClick={logout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700">
                  Login
                </Link>
                <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------------------- Footer ----------------------------- */

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 text-zinc-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo dark />
          <p className="mt-4 text-sm leading-relaxed">
            A modern University Management System for students, instructors, and administrators — enrollment,
            attendance, exams, results, and Stripe tuition payments in one place.
          </p>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {PUBLIC_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-emerald-400">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Portals</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/dashboard" className="transition-colors hover:text-emerald-400">Student Portal</Link></li>
            <li><Link href="/instructor" className="transition-colors hover:text-emerald-400">Instructor Portal</Link></li>
            <li><Link href="/admin" className="transition-colors hover:text-emerald-400">Admin Console</Link></li>
            <li><Link href="/login" className="transition-colors hover:text-emerald-400">Login</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Demo Access</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Admin — admin@ums.edu / <span className="font-mono text-zinc-300">Admin@1234</span></li>
            <li>Instructor — instructor@ums.edu / <span className="font-mono text-zinc-300">Instructor@1234</span></li>
            <li>Student — student@ums.edu / <span className="font-mono text-zinc-300">Student@1234</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} University Management System. All rights reserved.</p>
          <p>Built with Next.js, Tailwind CSS &amp; the UMS REST API.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------- Dashboard shell ------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

/** Role-based navigation — each role only ever sees its own area. */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/academics", label: "Academics", icon: BookOpen },
    { href: "/admin/semesters", label: "Semesters", icon: CalendarDays },
    { href: "/admin/sections", label: "Sections", icon: ClipboardList },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  ],
  STUDENT: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/browse", label: "Browse Courses", icon: BookOpen },
    { href: "/dashboard/payments", label: "Tuition Payments", icon: CreditCard },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList },
    { href: "/dashboard/results", label: "Results", icon: BarChart3 },
    { href: "/dashboard/transcript", label: "Transcript", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: Settings },
  ],
  INSTRUCTOR: [
    { href: "/instructor", label: "My Sections", icon: LayoutDashboard, exact: true },
    { href: "/instructor/profile", label: "Profile", icon: Settings },
  ],
};

function SidebarContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo dark />
      </div>
      <Separator className="bg-zinc-800" />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {NAV_BY_ROLE[user.role].map((item) => {
          const active = isActivePath(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-emerald-600/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]"
                  : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} src={user.avatar} className="h-9 w-9 ring-2 ring-zinc-700" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{titleCase(user.role)}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const redirecting = React.useRef(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // A 401 from the API (refresh failed) ends the session.
  React.useEffect(() => {
    const onUnauthorized = () => {
      if (redirecting.current) return;
      redirecting.current = true;
      toast.error("Your session has expired. Please log in again.");
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      router.refresh();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [pathname, router]);

  if (!user) return null;

  const items = NAV_BY_ROLE[user.role];
  const currentLabel =
    [...items].sort((a, b) => b.href.length - a.href.length).find((i) => isActivePath(pathname, i.href))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#f4f4f2]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-zinc-950 lg:block" aria-label="Sidebar">
        <SidebarContent user={user} onLogout={logout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-950 shadow-2xl">
            <button
              className="absolute right-3 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-display text-lg font-semibold text-zinc-900">{currentLabel}</p>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/">View site</Link>
            </Button>
            <UserAvatar name={user.name} src={user.avatar} className="h-8 w-8" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-zinc-900">{user.name}</p>
              <p className="text-xs leading-tight text-zinc-500">{titleCase(user.role)}</p>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Client shell for all dashboards — seeded with the user verified on the server. */
export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <AuthStoreProvider initialUser={user}>
      <Shell>{children}</Shell>
    </AuthStoreProvider>
  );
}
