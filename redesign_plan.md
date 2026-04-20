# Paynest UI Redesign Plan

> Living document. Update checkboxes and notes as we implement.
> Goal: a cohesive, modern, finance-grade POS interface with better look-and-feel, alignment, and information density.

---

## 1. Goals & Non-Goals

**Goals**
- Cohesive visual language across all roles (SuperAdmin → Attendant).
- Tightened design system: one source of truth for colors, spacing, radii, type, motion.
- **shadcn/ui is the single component foundation** — every primitive (Button, Card, Dialog, Sheet, Table, Tabs, DropdownMenu, Form, Sonner, etc.) comes from shadcn. No Ant Design, no headlessui, no hand-rolled primitives.
- Higher information density on data-heavy pages without clutter.
- Faster perceived performance via skeletons, optimistic UI, motion polish.
- Consistent component library usage — kill ad-hoc one-offs.
- Accessibility: WCAG AA contrast, focus rings, keyboard support, reduced-motion support.

**Non-Goals**
- No backend or API contract changes.
- No new feature work — visual + interaction polish only.
- No framework changes (still Next.js 16 + Tailwind v4 + shadcn).

---

## 2. Discovery — Current Pain Points

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | Two clashing theme systems | `src/app/globals.css` defines shadcn oklch vars **and** a second `@theme` block with hex `--color-primary: #10295E`. Last-write wins per cascade and creates inconsistencies. | High |
| 2 | Three icon libraries in use | `lucide-react`, `@heroicons/react`, `@ant-design/icons` | Bundle bloat + visual inconsistency |
| 3 | Invisible scrollbar | `globals.css` sets `::-webkit-scrollbar { width: 0 }` — users lose scroll affordance | Medium |
| 4 | Sidebar uses headless UI Dialog instead of shadcn `Sheet` | `sidebar-navigation.tsx` | Inconsistent overlay behavior |
| 5 | Ad-hoc class strings repeat (`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm`) across pages | `AdminView`, list pages, settings | No reusable Surface/Card primitive |
| 6 | Inline `bg-[#f8fafc]` and other one-off hex values in pages | dashboard/page.tsx etc. | Theme drift |
| 7 | Page headers vary in style and spacing | most `(pages)/*` | Layout inconsistency |
| 8 | No empty-state, loading-skeleton, or error-state design pattern shared across tables | list pages | Jarring transitions |
| 9 | Limited dark-mode coverage; many pages hardcode `text-slate-900` etc. | global | Dark mode broken in places |
| 10 | Mixed Ant Design modal styling (`.ant-modal-custom`) alongside shadcn `Dialog` | globals.css + Settings/Inventory pages | Two modal systems |

---

## 3. Design System Foundation (Phase 1)

> Land this first — every later phase builds on it.

### 3.1 Token Cleanup
- [x] Remove the duplicate `@theme` hex block in `globals.css`. Brand colors live in the shadcn oklch system.
- [x] Re-derive `--primary` to be Paynest navy (#10295E) in oklch. Tonal scale `--brand-50` … `--brand-950` exposed as `bg-brand-{step}`.
- [x] Add semantic status tokens: `--success`, `--warning`, `--info`, `--destructive` (+ `*-foreground`, `*-muted`) for light + dark.
- [x] Standardize radius scale (`sm/md/lg/xl/2xl/3xl/4xl`) declared in `@theme inline`.
- [x] Add motion tokens: `--ease-emphasized`, `--ease-standard`, `--ease-decelerate`, `--duration-fast/base/slow`.

### 3.2 Typography
- [x] Confirm Geist Sans + Geist Mono pairing (already wired).
- [x] Define a type scale: `text-display`, `text-h1…h4`, `text-body-lg/body/body-sm`, `text-label`, `text-caption`, `text-overline` (Tailwind v4 `@utility`).
- [x] Add `num-tabular` utility for currency/metric cells (`font-variant-numeric: tabular-nums`).

### 3.3 Spacing & Layout
- [ ] Adopt a 4-pt grid; document allowed gaps (`gap-1/2/3/4/6/8/12`) — discourage arbitrary `gap-[7px]`. _(documented in PR description; no code change)_
- [ ] Define container widths: `narrow` (640), `default` (1280), `wide` (1536). _(deferred until AppShell in Phase 3)_

### 3.4 Scroll, Focus, Motion
- [x] Replaced invisible scrollbar with a subtle, themed 8px scrollbar (uses `--border` / `--muted-foreground`).
- [x] Global `:focus-visible` ring using `--ring` with offset.
- [x] Honor `prefers-reduced-motion` for animations and transitions.

### 3.5 Iconography
- [x] Standardize on **lucide-react** as the single icon set.
- [x] Replaced all `@heroicons/react` usages in `sidebar-navigation.tsx` and `not-found.tsx` (aliased to keep call-sites stable). Package removed from `dependencies`.
- [ ] Remove `@ant-design/icons` after migrating off Ant modals (see Phase 4).

---

## 4. Shared Component Upgrades (Phase 2)

> **Rule:** every composite below is built on shadcn primitives. Add the shadcn component first via the `shadcn` skill (`npx shadcn@latest add ...`), then compose. Use the shadcn skill's registry to pick high-quality blocks where they exist (sidebar, dashboard-01, login-01, data-table) before hand-rolling.

### 4.1 shadcn primitives to install / verify
Already installed: `avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, progress, select, separator, switch, table, tabs, textarea, tooltip`.
- [x] Added: `sheet, sonner, skeleton, label, popover, empty, alert, alert-dialog, scroll-area, command, breadcrumb, hover-card, toggle, toggle-group, radio-group, form, accordion, navigation-menu, chart`. (`sidebar` block deferred to Phase 3; `calendar`, `date-picker`, `slider` deferred until needed.)
- [x] Replaced `react-hot-toast` with shadcn `sonner` for a single toast system. All 30 import sites migrated; `<Toaster />` swapped in `app/layout.tsx`; `react-hot-toast` removed from `package.json`.
- [ ] Replace headlessui sidebar Dialog with shadcn `sheet`. _(Phase 3)_

### 4.2 Composite components (built on shadcn)
- [ ] **`Surface`** — thin wrapper over shadcn `Card` with variants: `flat`, `raised`, `outlined`, `tinted`. _(Deferred — `Card` + `cn()` direct usage covers most cases. Revisit if duplication grows in Phase 4.)_
- [x] **`PageHeader`** — rewrote `PageHeader.tsx` on shadcn `Separator` + native breadcrumb (Link + ChevronRight). Slots: title, description, breadcrumbs, actions/children. Uses new typography scale (`text-h2`, `text-body-sm`).
- [x] **`StatCard`** — `src/components/(shared-components)/StatCard.tsx`. Built on `Card` + `Badge` + lucide. Loading state uses shadcn `Skeleton` (no custom `animate-pulse`). Tabular numerals on the value.
- [x] **`DataTable`** — `src/components/(shared-components)/DataTable.tsx`. Wraps shadcn `Table` + `Card` + `Skeleton`. Column config supports alignment, numeric (auto `num-tabular`), width, sticky header, row click, loading skeletons, empty-state slot. (TanStack Table integration deferred until a list page actually needs sorting/filtering wiring.)
- [x] **`Pagination`** — full rewrite using shadcn `Button` + `Select`. Page-size selector optional. Tabular numerals, semantic colors.
- [x] **`Loading` / Skeletons** — `Skeleton` primitive available; `DataTable` and `StatCard` use it. Page-level skeleton compositions to be added per page in Phase 4.
- [x] **`EmptyState`** — rewrote on shadcn `Empty` (`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent`). Back-compat: still accepts `icon` (component or node), `actionText` + `onAction`, or `actions` slot.
- [x] **`Toolbar`** — `src/components/(shared-components)/Toolbar.tsx`. `Toolbar` + `ToolbarLeft` + `ToolbarRight` + `ToolbarSearch` (Input with leading Search icon, optional clear button). Filter chips and ToggleGroup view-switch usage to be wired per page in Phase 4.
- [x] **`StatusPill`** — `src/components/(shared-components)/StatusPill.tsx`. Maps domain statuses (paid, pending, processing, failed, cancelled, draft, etc.) to tones (success/warning/info/destructive/muted) + lucide icons. Built on shadcn `Badge`.
- [ ] **`AppShell`** — shadcn `Sidebar` block + new top app bar. _(Phase 3)_

---

## 5. Sidebar & Navigation (Phase 3)

> Use the shadcn `sidebar` block as the base — it ships with collapsible rail, mobile sheet, sub-menu, footer, and group support out of the box.

- [ ] Install shadcn `sidebar` block; replace current `headlessui/Dialog` sidebar.
- [ ] Slim collapsed rail (icon only) with `Tooltip` labels; expanded width 240px.
- [ ] `SidebarGroup` per section (Operate / Inventory / Reports / Admin) with `SidebarGroupLabel`.
- [ ] Active state: shadcn's built-in `data-active` pill with brand tint.
- [ ] New top app bar (`AppShell`): notification bell (`Popover`), `Command` palette trigger, user menu (`DropdownMenu`).
- [ ] User menu: `Avatar` + role `Badge` + Profile / Settings / Sign out items.

---

## 6. Page-by-Page Work (Phase 4)

Order chosen by user-facing impact (POS first, admin last).

### 6.1 Sales / POS — `app/(pages)/sales/page.tsx`
- [ ] Convert layout to a 12-col grid: products (8) + cart (4) on desktop; cart becomes drawer on tablet/mobile.
- [ ] Larger product cards with image fallbacks, stock pill, hover-lift.
- [ ] Sticky category bar with horizontal scroll + active underline.
- [ ] Cart: itemized list with inline qty steppers, swipe-to-remove on touch.
- [ ] Checkout panel: clear total hierarchy (subtotal / tax / discount / **Total** in display size), payment method as segmented control.
- [ ] Barcode scan button anchored top-right of products area; show scanner modal with camera framing reticle.
- [ ] Receipt modal: receipt-style layout with monospace numbers, subtle perforated edge.

### 6.2 Dashboard — `app/(pages)/dashboard/views/AdminView.tsx`
- [ ] Replace ad-hoc `KpiCard` with shared `StatCard`.
- [ ] Chart container with title, range selector chip, legend on the right.
- [ ] Recharts theme: brand palette, grid lines `--border`, tooltip with shadcn-styled card.
- [ ] Add a "Today" mini-strip at top: revenue, orders, avg order value, items sold.
- [ ] Manager + Attendant views — apply same StatCard/Chart shells.

### 6.3 List pages — orders, products, customers, payments, inventory, stock-movements, audit-log
- [ ] Wrap each in `Surface` + redesigned `PageHeader` + `Toolbar` + `DataTable`.
- [ ] Standardize column widths, alignment (right-align numeric/currency, monospace tabular).
- [ ] Add row-action menus via `DropdownMenu`.
- [ ] Filter chips above table replacing scattered selects.

### 6.4 Detail pages — orders/[id], report/[id], users/[id]
- [ ] 2-column layout: primary content + sidebar with metadata + actions.
- [ ] Section cards with consistent header pattern.

### 6.5 Forms — login, register, customer create, inventory create, settings
- [ ] One field component (label + input + helper + error) used everywhere.
- [ ] Migrate Ant Design modal forms to shadcn `Dialog` + RHF + Zod.
- [ ] Inline validation; submit-button loading + disabled states.

### 6.6 Notifications
- [ ] Bell dropdown: tighter spacing, type-icon left rail, unread blue dot, time ago.
- [ ] `/notifications` feed: grouped by Today / Yesterday / This week.
- [ ] `/settings/notifications`: matrix table (rows = events, cols = email / in-app) instead of long list.

### 6.7 Auth pages
- [ ] Split-screen layout: brand panel left (gradient + product copy), form right.
- [ ] Clean form card, social/SSO slot reserved.

---

## 7. Dark Mode Pass (Phase 5)

- [ ] Audit every page for hardcoded slate/zinc colors; swap to semantic tokens.
- [ ] Verify chart colors in dark mode.
- [ ] Toggle in user menu; persist preference.

---

## 8. Skill Mapping

How we'll use the installed skills:

| Skill | Used for |
|---|---|
| `tailwind-design-system` | Phase 1 — token cleanup, type scale, spacing system. |
| `shadcn` | **Lead skill — used in every phase.** Source for all primitives, blocks (sidebar, dashboard-01, login-01, data-table), install commands, and component patterns. |
| `frontend-design` | Phase 4 — distinctive page-level designs (sales, dashboard, auth). |
| `ui-ux-pro-max` | Phase 4 — palette/style picks, component patterns per page. |
| `web-typography` | Phase 1 — type scale + tabular numerals. |
| `web-design-guidelines` | Final review pass per phase — accessibility, contrast, UX heuristics. |
| `vercel-react-best-practices` | Throughout — keep client/server boundaries clean, lazy load charts/scanner. |

---

## 9. Phase Roadmap (Tracking)

- [x] **Phase 1 — Foundation**: tokens, typography, scroll/focus/motion, icon consolidation. _(Spacing/container width docs deferred to Phase 3 AppShell. Ant icons removed in Phase 4 with Ant modal migration.)_
- [x] **Phase 2 — Shared components**: installed all missing shadcn primitives (sheet, sonner, skeleton, label, popover, empty, alert, alert-dialog, scroll-area, command, breadcrumb, hover-card, toggle, toggle-group, radio-group, form, accordion, navigation-menu, chart). Swapped `react-hot-toast` → `sonner` (30 import sites + layout Toaster + package.json). Built composites: `PageHeader` (rewrite), `StatCard` (new), `DataTable` (new), `Pagination` (rewrite), `EmptyState` (rewrite on `Empty`), `Toolbar` + `ToolbarSearch` (new), `StatusPill` (new). Typecheck clean except for the pre-existing Sales Completion Modal error logged in Backlog. _(Surface deferred — `Card` direct usage covers it; `AppShell` is Phase 3.)_
- [ ] **Phase 3 — App shell**: sidebar + new top app bar.
- [ ] **Phase 4 — Page redesigns**: Sales → Dashboard → List pages → Detail pages → Forms → Notifications → Auth.
- [ ] **Phase 5 — Dark mode pass + a11y + perf review**.
- [ ] **Phase 6 — QA**: full click-through per role (superadmin, admin, manager, attendant), regression check on POS flow.

---

## 10. Working Agreement

- Each phase ships in its own PR(s); no mixed phases.
- Every page change includes a before/after screenshot in the PR description.
- Update the checkboxes in this file as work lands.
- New issues discovered during implementation get appended to **§ 11. Backlog**.

---

## 11. Backlog (append as discovered)

- **package-lock.json out of sync** — `npm uninstall @heroicons/react` and the follow-up `npm install` hit `ECONNRESET`. `package.json` is clean and the package is no longer in `node_modules`, but the lockfile still references `@heroicons/react`. Re-run `npm install --legacy-peer-deps` once the network is stable.
- **Pre-existing typecheck error** — `src/app/(pages)/sales/components/SalesCompletionModal.tsx:102` — `setCustomers({ items, total })` is being passed where `SetStateAction<CustomerResponse[]>` is expected. Fix when we touch the Sales completion modal in Phase 4.
- **Spacing/container token doc** — moved to Phase 3 (AppShell) so we can declare them alongside layout primitives.
