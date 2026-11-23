# UMS Frontend — Next.js 15 (App Router)

Frontend for the **University Management System** Express + Prisma API.
Three fixed roles — **Admin**, **Instructor**, **Student** — with route-level (middleware) and UI-level role enforcement, real Stripe Checkout, and 25 pages.

| Category | Tech |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript (strict) |
| Styling / UI | Tailwind CSS v4, shadcn/ui-style components on Radix UI, Lucide icons |
| Server state | TanStack Query v5 (+ native `fetch` ISR caching in Server Components) |
| Client state | Zustand (per-request session store via React context) |
| Forms | React Hook Form + Zod (rules mirror the backend `*.validation.ts`) |
| Auth | Custom JWT in **httpOnly cookies** + Edge middleware + BFF route handlers |
| Payments | Stripe Checkout (test mode) — initiation, success & cancel redirects |
| Charts / toasts | Recharts, Sonner |

---

## 1. Getting started

```bash
cd University_Management_System_frontend
cp .env.example .env.local      # set API_URL to your backend
npm install
npm run dev                     # http://localhost:3000
```

**Backend `.env`** (your Express project) must point Stripe back to this app:

```env
CLIENT_URL=http://localhost:3000
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel?session_id={CHECKOUT_SESSION_ID}
```

Run the backend (`npm run dev`, port 5000) with the seed applied (`npm run db:seed`), plus `stripe listen --forward-to localhost:5000/api/v1/payments/webhook` for webhooks.

### Demo credentials (also one-click on `/login`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ums.edu` | `Admin@1234` |
| Student | `student@ums.edu` | `Student@1234` |
| Instructor | `instructor@ums.edu` | `Instructor@1234` |

Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## 2. Architecture

```
Browser ──► Next.js (this app) ──► Express API (/api/v1)
            ├─ middleware.ts          role guard + silent token refresh (Edge)
            ├─ app/api/auth/[action]  login/register/logout → httpOnly cookies
            ├─ app/api/proxy/[...path] BFF: adds Bearer token, refreshes on 401
            └─ Server Components       read cookies, fetch the API directly
```

* **Tokens never reach client JavaScript.** Login goes through `/api/auth/login`, which stores the access token (`ums_at`, expires with the JWT) and refresh token (`ums_rt`, 7 days) as `httpOnly`, `sameSite=lax` cookies.
* **Middleware** decodes the access token's role and enforces `/admin/**` → ADMIN, `/dashboard/**` → STUDENT, `/instructor/**` → INSTRUCTOR. A wrong role is redirected to its own home; signed-out users go to `/login?from=…`. Expired access tokens are refreshed *before* rendering so Server Components always get a valid cookie.
* **Defence in depth:** `(dashboard)/layout.tsx` verifies the session with `GET /users/me`, and each area's `layout.tsx` calls `requireRole()`.
* **Refresh-token reuse safety:** the backend revokes all sessions when a rotated refresh token is reused, so concurrent refreshes with the same token share a single upstream call (see `lib/server/tokens.ts`).

### Server vs Client Components

| Server Components (default) | Why |
|---|---|
| Root/public/dashboard layouts | Static chrome; the dashboard layout fetches and verifies the session |
| Home, About, Services, Pricing, Contact | SEO + Metadata API; data fetched with ISR (`revalidate: 60/300`) |
| Admin Overview (`/admin`) | Stats + audit log fetched server-side with the cookie — no client waterfall |
| `not-found.tsx`, every `loading.tsx` | Pure presentational |

| Client Components (`"use client"`) | Why |
|---|---|
| `views/*` dashboards | URL-synced filters, mutations, dialogs, optimistic UI via TanStack Query |
| `views/auth.tsx` | Forms, demo-login buttons, router navigation |
| `views/admin-charts.tsx` | Recharts needs the DOM — a small island fed by the server page |
| `FaqAccordion`, `ContactForm` | Interactive islands inside server pages |
| `components/ui.tsx` | Radix primitives (focus management, portals) |
| `error.tsx`, `global-error.tsx` | Required by Next.js |

### Folder structure

```
University_Management_System_frontend/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── providers.tsx
    │   ├── globals.css
    │   ├── icon.svg
    │   ├── error.tsx
    │   ├── global-error.tsx
    │   ├── not-found.tsx
    │   ├── api/
    │   │   ├── auth/[action]/route.ts
    │   │   └── proxy/[...path]/route.ts
    │   ├── (public)/
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── page.tsx
    │   │   ├── about/page.tsx
    │   │   ├── contact/page.tsx
    │   │   ├── login/page.tsx
    │   │   ├── pricing/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── services/page.tsx
    │   │   └── payment/
    │   │       ├── cancel/page.tsx
    │   │       └── success/page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx
    │       ├── error.tsx
    │       ├── admin/
    │       │   ├── layout.tsx
    │       │   ├── page.tsx
    │       │   ├── loading.tsx
    │       │   ├── academics/page.tsx
    │       │   ├── academics/loading.tsx
    │       │   ├── audit-logs/page.tsx
    │       │   ├── audit-logs/loading.tsx
    │       │   ├── sections/page.tsx
    │       │   ├── sections/loading.tsx
    │       │   ├── semesters/page.tsx
    │       │   ├── semesters/loading.tsx
    │       │   ├── users/page.tsx
    │       │   └── users/loading.tsx
    │       ├── dashboard/
    │       │   ├── layout.tsx
    │       │   ├── page.tsx
    │       │   ├── loading.tsx
    │       │   ├── attendance/page.tsx
    │       │   ├── attendance/loading.tsx
    │       │   ├── browse/page.tsx
    │       │   ├── browse/loading.tsx
    │       │   ├── payments/page.tsx
    │       │   ├── payments/loading.tsx
    │       │   ├── profile/page.tsx
    │       │   ├── profile/loading.tsx
    │       │   ├── results/page.tsx
    │       │   ├── results/loading.tsx
    │       │   ├── transcript/page.tsx
    │       │   └── transcript/loading.tsx
    │       └── instructor/
    │           ├── layout.tsx
    │           ├── page.tsx
    │           ├── loading.tsx
    │           ├── profile/page.tsx
    │           ├── profile/loading.tsx
    │           └── sections/[sectionId]/
    │               ├── page.tsx
    │               └── loading.tsx
    ├── components/
    │   ├── ui.tsx
    │   ├── shared.tsx
    │   ├── layout.tsx
    │   └── skeletons.tsx
    ├── hooks/hooks.ts
    ├── lib/
    │   ├── api.ts
    │   ├── demo-accounts.ts
    │   ├── roles.ts
    │   ├── services.ts
    │   ├── types.ts
    │   ├── utils.ts
    │   └── server/
    │       ├── api.ts
    │       └── tokens.ts
    ├── store/authStore.tsx
    ├── utils/cn.ts
    └── views/
        ├── admin.tsx
        ├── admin2.tsx
        ├── admin3.tsx
        ├── admin-charts.tsx
        ├── auth.tsx
        ├── instructor.tsx
        ├── payment.tsx
        ├── public.tsx
        ├── student.tsx
        └── student2.tsx
```

Generated and local-only files such as `.next/`, `node_modules/`, `.env.local`, and `next-env.d.ts` are excluded from this tree and ignored by Git.

---

## 3. Pages (25)

| Area | Routes |
|---|---|
| Public (5) | `/`, `/about`, `/services`, `/pricing` (tuition + FAQ), `/contact` |
| Auth (2) | `/login` (one-click demo login ×3), `/register` (3-step wizard) |
| Admin (6) | `/admin` (analytics + charts), `/admin/users`, `/admin/academics` (4-step course wizard), `/admin/semesters`, `/admin/sections`, `/admin/audit-logs` |
| Student (7) | `/dashboard`, `/dashboard/browse`, `/dashboard/payments`, `/dashboard/attendance`, `/dashboard/results`, `/dashboard/transcript`, `/dashboard/profile` |
| Instructor (3) | `/instructor`, `/instructor/sections/[sectionId]`, `/instructor/profile` |
| Payment (2) | `/payment/success` (polls while the webhook confirms), `/payment/cancel` |
| Utility | `not-found.tsx`, `error.tsx`, `(dashboard)/error.tsx`, `global-error.tsx` |

Every filter, search box, tab, and paginator is stored in the URL (`?page=2&status=ONGOING&tab=programs`) through the History API, so views can be bookmarked and shared without a server round-trip.

---

## 4. Recommended backend addition — section roster

The API has no endpoint that lists the students enrolled in a section, which instructors need to mark *first-time* attendance and enter results. The frontend calls `GET /sections/:id/roster` and, if it's missing, falls back to students found in existing attendance or result records. Add this to the academic module:

```ts
// academic.routes.ts
router.get("/sections/:sectionId/roster", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR),
  validate(listSectionExamsSchema), controller.sectionRoster);

// academic.controller.ts
export const sectionRoster = endpoint("Roster fetched", 200, (req) =>
  service.getSectionRoster(req.validated?.params.sectionId, actor(req)));

// academic.service.ts
export async function getSectionRoster(sectionId: string, actor: Actor) {
  if (actor.role === Role.INSTRUCTOR) {
    await prisma.$transaction((tx) => assertCanManageSection(tx, sectionId, actor));
  }
  const rows = await prisma.enrollment.findMany({
    where: { sectionId, status: EnrollmentStatus.ENROLLED, deletedAt: null },
    orderBy: { enrolledAt: "asc" },
    select: { id: true, student: { select: { id: true, studentId: true, user: { select: { name: true, email: true } } } } },
  });
  return rows.map((r) => ({
    enrollmentId: r.id,
    studentProfileId: r.student.id,
    studentId: r.student.studentId,
    name: r.student.user.name,
    email: r.student.user.email,
  }));
}
```

> **Rate limiting:** every API call now comes from the Next.js server, so the backend sees one IP. The proxy forwards `X-Forwarded-For`; make sure `app.set("trust proxy", …)` matches your deployment, or raise the `apiLimiter` limits.

---

## 5. Suggested commit history (20+ meaningful commits)

1. `chore: scaffold Next.js 15 app router project with TypeScript and Tailwind v4`
2. `feat: add API contract types mirroring the Prisma schema`
3. `feat: add Radix-based shadcn/ui component library`
4. `feat: add shared StatCard, StatusBadge, EmptyState and pagination components`
5. `feat: add edge-safe JWT and httpOnly cookie helpers`
6. `feat: add auth route handlers for login, register and logout`
7. `feat: add BFF proxy route with silent token refresh`
8. `feat: protect role areas with middleware`
9. `feat: add per-request Zustand session store`
10. `feat: add TanStack Query providers with global error toasts`
11. `feat: add role-based dashboard shell and sidebar`
12. `feat: build server-rendered public pages with ISR and metadata`
13. `feat: add login page with one-click demo login for all roles`
14. `feat: add multi-step student registration wizard`
15. `feat: add admin overview with server-fetched stats and charts`
16. `feat: add admin user management with URL-synced filters`
17. `feat: add academics management with course creation wizard`
18. `feat: add semester lifecycle and section management`
19. `feat: add audit log explorer`
20. `feat: add student dashboard, course browsing and enrollment`
21. `feat: integrate Stripe checkout with success and cancel pages`
22. `feat: add attendance, results and transcript pages`
23. `feat: add instructor section management (attendance, exams, results)`
24. `feat: add loading skeletons for every data route`
25. `feat: add error boundaries and custom 404`
26. `docs: document architecture, setup and demo credentials`
