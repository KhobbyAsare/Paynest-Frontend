# Paynest Frontend — CLAUDE.md

## Project Overview

Paynest is a **multi-tenant cloud POS (Point of Sale)** system. This is the Next.js frontend.

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style, slate base)
- **State:** Zustand 5 (authStore + salesStore)
- **Forms:** React Hook Form + Zod validation
- **HTTP:** Axios with JWT Bearer token injection
- **Charts:** Recharts (dashboard analytics)
- **Animations:** Framer Motion + GSAP
- **Icons:** lucide-react (primary), @heroicons/react, @ant-design/icons
- **Notifications:** react-hot-toast
- **Barcode:** html5-qrcode (camera-based scanner in POS)

---

## Directory Structure

```
paynest-frontend-app/
├── src/
│   ├── (api-handlers)/          # Axios API call functions (one file per resource)
│   ├── (zustand-store)/         # Global state stores
│   │   ├── authStore.ts         # Auth state: user, token, isAuthenticated
│   │   └── salesStore.ts        # Cart state: items, payment method, order mode
│   ├── app/
│   │   ├── (auth)/              # Public routes: login, register, forget-password
│   │   ├── (pages)/             # Protected routes (wrapped by sidebar layout)
│   │   │   ├── (administrator)/ # Admin-only pages
│   │   │   ├── (superadmin)/    # SuperAdmin-only pages
│   │   │   │   ├── users/roles/ # Roles & permissions matrix
│   │   │   │   └── organizations/
│   │   │   ├── customers/       # Customer list, create, edit
│   │   │   ├── dashboard/       # Role-based dashboard (with recharts)
│   │   │   ├── daily-closure/   # Daily closure workflow
│   │   │   ├── finance/         # Financial overview
│   │   │   ├── inventory/       # Inventory list + create
│   │   │   ├── order-items/     # Order items listing
│   │   │   ├── orders/          # Orders list + detail
│   │   │   ├── organizations/   # Org management (SuperAdmin)
│   │   │   ├── payments/        # Payments list
│   │   │   ├── product_categories/ # Category management
│   │   │   ├── products/        # Product listing
│   │   │   ├── report/          # Report request, list, pending, detail
│   │   │   ├── notifications/   # In-app notification feed (all roles, paginated)
│   │   │   ├── sales/           # Main POS interface (cart + checkout + barcode scanner)
│   │   │   ├── sales-report/    # Sales analytics
│   │   │   ├── settings/
│   │   │   │   ├── notifications/ # Notification preferences (connected to API)
│   │   │   │   ├── security/    # Change password
│   │   │   │   ├── system/      # SuperAdmin-only system info page
│   │   │   │   └── profile/     # Edit profile info
│   │   │   ├── stock-movements/ # Stock movement history
│   │   │   └── users/           # User list + detail pages
│   │   ├── layout.tsx           # Root layout (fonts, toast provider)
│   │   └── page.tsx             # Root redirect
│   ├── components/
│   │   ├── (shared-components)/ # Reusable layout components
│   │   │   ├── sidebar-navigation.tsx  # Main nav (role-filtered, collapsible)
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── SplitText.tsx    # Animated branding text
│   │   ├── ui/                  # shadcn/ui components
│   │   └── sales/               # POS-specific components
│   │       ├── ProductCard.tsx
│   │       ├── CartItem.tsx
│   │       ├── CategoryItem.tsx
│   │       └── SalesCompletionModal.tsx  # Checkout + receipt printing
│   ├── interfaces/              # TypeScript interfaces for all API types
│   ├── lib/
│   │   ├── utils.ts             # cn() Tailwind merge helper
│   │   ├── getToken.ts          # Token + API headers from Zustand
│   │   └── handleErrorMessage.ts
│   ├── utils/
│   │   ├── handleErrorMessage.ts
│   │   └── zod/                 # Zod validation schemas
│   └── middleware.ts            # Route protection (reads pos_token cookie)
├── public/
├── components.json              # shadcn/ui config
├── next.config.ts
├── tailwind.config.(js|ts)
├── tsconfig.json
└── package.json
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Backend running at `http://127.0.0.1:8000`

### Install & run
```bash
cd paynest-frontend-app
npm install
npm run dev
# App runs at http://localhost:3000
```

### Environment variables
Create `.env.local`:
```env
NEXT_PUBLIC_AXIOS_API_BASE_URL=http://127.0.0.1:8000
```

### Build for production
```bash
npm run build
npm run start
```

---

## Authentication & Route Protection

- On login, JWT is stored in a **cookie** (`pos_token`) via `cookies-next`
- Auth state (user object + token) is persisted in **localStorage** via Zustand's `persist` middleware (`pos-auth-storage`)
- `src/middleware.ts` reads `pos_token` cookie:
  - Unauthenticated → redirected to `/login`
  - Authenticated on auth route → redirected to `/dashboard`
- Token injected into all API calls via `getAPIHeaders()` in `src/lib/getToken.ts`

---

## State Management (Zustand)

### authStore (`src/(zustand-store)/authStore.ts`)
```ts
{
  user: LoginResponseInterface['user'] | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth(user, token): void
  clearAuth(): void       // also deletes pos_token cookie
  updateUser(user): void
}
```
Persisted to localStorage as `pos-auth-storage`.

### salesStore (`src/(zustand-store)/salesStore.ts`)
```ts
{
  isOrderMode: boolean                          // false = walk-in, true = order
  cart: Record<number, CartItemData>
  paymentMethod: "cash" | "bank transfer" | "mobile transfer"
  toggleOrderMode(): void
  addToCart(product): void
  updateCartQuantity(productId, qty): void
  removeFromCart(productId): void
  clearCart(): void
  setPaymentMethod(method): void
}
```
Not persisted — session only.

---

## API Layer (`src/(api-handlers)/`)

Each file exports typed async functions. Pattern:
```ts
import axios from "axios"
import { getAPIHeaders } from "@/lib/getToken"

const BASE_URL = process.env.NEXT_PUBLIC_AXIOS_API_BASE_URL

export const GetProducts = async (): Promise<ProductInterface[]> => {
  const res = await axios.get(`${BASE_URL}/products/`, { headers: getAPIHeaders() })
  return res.data
}
```

Available handlers: `productsHandler`, `customersHandler`, `ordersHandler`, `inventoryHandler`, `paymentsHandler`, `dailyClosureHandler`, `reportHandler`, `financeHandler`, `auditLogHandler`, `organizationHandler`, `userHandler`, `employeeProfileHandler`, `stockMovementHandler`, and more.

### Notable handlers
- `userHandler.ts` — includes `getNotificationPreferences()` and `updateNotificationPreferences()` connected to `GET/PUT /user/me/notification-preferences`
- `notificationsHandler.ts` — `getNotifications(limit, offset)`, `markNotificationRead(id)`, `markAllNotificationsRead()` connected to `GET/PUT /notifications/me`
- `productsHandler.ts` — includes `GetProductByBarcode(barcode)` connected to `GET /products/barcode/{barcode}`

---

## Role-Based Access

Four roles, accessed from `authStore.user.role`:
- `SUPERADMIN` — full access including organizations, audit logs, system info, roles matrix
- `ADMIN` — org-level management, reports, user management
- `MANAGER` — operations, reports (own), inventory
- `ATTENDANT` — POS sales only

Navigation items in `sidebar-navigation.tsx` are filtered by role. Pages additionally guard with role checks and redirect to `/dashboard` if unauthorized.

---

## POS Features (Sales Page)

### Barcode Scanner (`BarcodeScannerModal.tsx`)
- Two modes: **Camera** (html5-qrcode, environment-facing) and **Manual** (text input, also works with USB barcode scanners)
- Camera lifecycle managed in `useEffect` — scanner started when modal opens, stopped on close
- Check `scanner.getState() === 2` before calling `scanner.stop()` to avoid errors
- On successful scan: calls `GetProductByBarcode(barcode)` → `onProductFound(product)` → product added to cart

### Receipt Printing (`SalesCompletionModal.tsx`)
- After checkout, cart items are captured before `clearCart()` is called
- Receipt view shows: items + quantities + prices, subtotal/discount/tax/total in GHS, payment method, org name, timestamp
- Print via `window.print()` with `@media print` CSS using `visibility: hidden` approach to isolate `#receipt-print-area` (works inside Radix Dialog portals)
- Currency displayed as `GHS` throughout (Ghana Cedis)

---

## In-App Notification System

### Bell (sidebar, all pages)
- Lives in `sidebar-navigation.tsx` — polls `GET /notifications/me?limit=15` every **20 seconds** + immediately on `visibilitychange` (tab focus)
- Shows unread badge count on `BellIcon`; clicking opens a dropdown of the 15 most recent notifications
- "Mark all read" button calls `PUT /notifications/me/read-all`
- Clicking a notification marks it read + navigates to linked order/report
- Dropdown footer has **"View all notifications →"** (→ `/notifications`) and **"Settings"** (→ `/settings/notifications`)

### Notification feed page (`/notifications`)
- Full paginated list — **20 per page**, uses `offset`-based pagination
- Per-type colour-coded icons: new_order (blue), low_stock (amber), report_ready (violet), daily_closure (emerald), system_alert (rose)
- Unread items highlighted with blue dot + bold title
- Refresh button, "Mark all read" button in toolbar
- Clicking navigates to the linked entity (order/report)

### Notification preferences (`/settings/notifications`)
- 6 event types × (email + in-app) = 12 boolean toggles
- Saved via `PUT /user/me/notification-preferences`

---

## Adding New Pages

1. Create folder under `src/app/(pages)/your-page/`
2. Add `page.tsx` — use `"use client"` for interactive pages
3. Call API handlers (not axios directly)
4. Add navigation entry in `src/components/(shared-components)/sidebar-navigation.tsx`
5. Add TypeScript interface in `src/interfaces/` if new data type
6. Add API handler in `src/(api-handlers)/` if new backend endpoint

### Page template
```tsx
"use client"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/(zustand-store)/authStore"
import { GetResource } from "@/(api-handlers)/resourceHandler"
import PageHeader from "@/components/(shared-components)/PageHeader"
import { handleErrorMessage } from "@/utils/handleErrorMessage"
import toast from "react-hot-toast"

export default function ResourcePage() {
  const { user } = useAuthStore()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    GetResource()
      .then(setData)
      .catch(err => toast.error(handleErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Resource" />
      {/* content */}
    </div>
  )
}
```

---

## UI Conventions

- **Components:** Use shadcn/ui from `@/components/ui/` (Button, Card, Dialog, Table, Input, Badge, etc.)
- **Styling:** Tailwind utility classes only — no inline styles, no CSS modules
- **Icons:** `lucide-react` preferred; `@heroicons/react` for nav icons
- **Error handling:** `handleErrorMessage(err)` → `toast.error(...)` pattern throughout
- **Loading states:** Show `<Loading />` component while fetching
- **Empty states:** Use `<EmptyState />` component when list is empty
- **Forms:** React Hook Form + Zod schema + `@hookform/resolvers/zod`
- **Currency:** Always display as `GHS` (not `$` or `₵`)

---

## Known Gaps / TODO

- [ ] Email notifications — backend SMTP credentials not configured yet (infrastructure is ready)
- [ ] Receipt printer hardware integration (current solution uses browser print)
- [ ] Employee performance and monthly financial report detail views
- [ ] SMS notifications (no provider integrated)
- [ ] SSE/WebSocket real-time notifications (polling reduced to 20s + visibilitychange trigger)

## Completed

- [x] Currency: all `$` replaced with `GHS` across sales, orders, inventory pages
- [x] Pagination: orders, payments, stock-movements pages paginated; shared `Pagination.tsx` component at `src/components/(shared-components)/Pagination.tsx`
- [x] Polling enhanced: sidebar bell polls every 20s + immediate refresh on `visibilitychange`
- [x] Frontend tests: vitest + React Testing Library; run with `npm test` after `npm install`
  - `src/lib/utils.test.ts` — cn() utility
  - `src/components/(shared-components)/Pagination.test.tsx` — Pagination component
