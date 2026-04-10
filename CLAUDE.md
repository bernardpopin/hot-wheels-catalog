# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run setup     # Install dependencies and initialize Claude.
npm run dev       # Start dev server (Turbopack, default in Next.js 16)
npm run build     # Production build (Turbopack)
npm start         # Start production server
npm run lint      # Run ESLint
```

No test framework is configured yet.

## Architecture

**Next.js 16 App Router** project with TypeScript and Tailwind CSS v4.

- `app/` — all routes and UI. `layout.tsx` is the root layout; `page.tsx` is the home page. Files not named with a Next.js convention (e.g. `page`, `layout`, `route`, `loading`, `error`) are not routable, so components can safely be colocated in `app/`.
- `public/` — static assets served at `/`.
- Styling: Tailwind v4 imported via `@import "tailwindcss"` in `globals.css`. Theme tokens are declared in an `@theme inline { }` block. CSS custom properties go in `:root`.

## Data Model

The single domain type is `CatalogItem`, defined in `app/lib/catalog.ts`:

```ts
export type CatalogItem = {
  id: string;                        // Date.now().toString() — no UUID library
  modelName: string;                 // Hot Wheels model name, e.g. "Datsun 240Z Custom"
  carBrand: string;                  // Real-world car manufacturer
  carModel: string;                  // Real-world car model name
  carProductionYear: number | null;  // Real-world car production year (1880–2030)
  releaseYear: number;               // Hot Wheels release year, min 1968
  yearOnChassis: number | null;      // Year stamped on the casting chassis
  series: string;                    // Hot Wheels series name
  color: string;                     // Paint color
  modelNumber: string;               // Collector number
  priceRange: string;                // e.g. "Main Line", "Premium"
  openWindow: boolean;               // casting variant flag
  bigWing: boolean;                  // casting variant flag
  frontBoltPositionOnEdge: boolean;  // casting variant flag
  backBoltPositionOnEdge: boolean;   // casting variant flag
};
```

`FormState` (used by forms) is `Omit<CatalogItem, "id">`. The four boolean flags are Hot-Wheels-specific casting identifiers used to distinguish between versions of the same model.

## Storage

No database or ORM. Storage is a plain JSON file at `data/catalog.json`:

```json
{ "items": [ ...CatalogItem ] }
```

Read/write via Node.js `fs/promises` in `app/lib/catalog.ts` (`readCatalog()` / `writeCatalog()`). Path resolved with `process.cwd()` — server-side only, not edge-compatible. No caching layer, no migrations, no runtime validation beyond TypeScript types.

## Project Conventions

### Component split

- **Server components** (no directive): `List`, `TopBar`, `page.tsx` — call `readCatalog()` directly.
- **Client components** (`"use client"`): `AddForm`, `EditForm`, `ModelDetail`, `DetailPanel`, `ItemFormFields`, `Search`, `RemoveButton` — handle interactive state.

Key client components:
- `DetailPanel` — toggles between `ModelDetail` (view) and `EditForm` (edit) using local `editing` state.
- `ModelDetail` — displays all fields of a selected item; receives an `onEdit` callback prop that switches `DetailPanel` to edit mode.
- `EditForm` — pre-fills with the current item's values, calls `updateCatalogItem`, then `router.refresh()` + `onDone()`.
- `AddForm` — blank form that calls `addCatalogItem` and resets to initial state after save.
- `ItemFormFields` — shared controlled-input component used by both `AddForm` and `EditForm`.
- `useItemForm` — custom hook (`app/components/useItemForm.ts`) managing `FormState` with typed `handleChange` for text, number (supports empty → `null`), and checkbox inputs.

### Routing / UI state

Single route at `/`. All UI state lives in URL search params:
- `?selected=<id>` — shows `DetailPanel` (view/edit) for that item; absent means show `AddForm`.
- `?q=<query>` — filters the sidebar list by model name.

Edit mode is **not** in the URL — it is local state inside `DetailPanel`. Navigating away or refreshing exits edit mode.

No dynamic route segments. No client-side data fetching — all reads happen in server components.

### Mutations

Use Server Actions in `app/lib/actions.ts` (`"use server"`):
- `addCatalogItem(item: Omit<CatalogItem, "id">)` — appends to JSON, calls `revalidatePath("/")`.
- `deleteCatalogItem(id: string)` — removes item, calls `revalidatePath("/")` then `redirect("/")`.
- `updateCatalogItem(id: string, item: Omit<CatalogItem, "id">)` — finds item by index, replaces in place, calls `revalidatePath("/")`, returns updated item. Caller is responsible for refreshing the UI (via `router.refresh()`).

A REST API at `app/api/catalog/route.ts` also exists (`GET /api/catalog`, `POST /api/catalog`) but duplicates the Server Action logic rather than sharing it.

### Styling

- Tailwind utility classes inline — no `cn()`, `clsx`, or CSS modules.
- Color palette: `zinc-*` for neutrals, `red-*` for destructive actions.
- Dark mode via `dark:` media-query variants (not class-based).
- Fonts: Geist Sans + Geist Mono via `next/font/google`, exposed as `--font-geist-sans` / `--font-geist-mono`.

### Path alias

`@/*` maps to the project root, e.g. `import { readCatalog } from "@/app/lib/catalog"`.

### Claude Code hooks

`hooks/` contains **Claude Code hooks** (not React hooks):
- `hooks/read_hook.js` — PreToolUse: blocks `.env` reads.
- `hooks/tsc.js` — PostToolUse: runs `tsc --noEmit` after every Write/Edit.

## Next.js 16 Key Differences

**Before writing any code, read the relevant guide in `node_modules/next/dist/docs/`.** This version has significant breaking changes from prior training data:

### Breaking changes

- **Async Request APIs** — `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are **all async** and must be awaited. Synchronous access is fully removed.
  ```ts
  // params in page/layout/route:
  export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
  }
  ```
  Run `npx next typegen` to generate `PageProps`, `LayoutProps`, `RouteContext` type helpers.

- **`middleware` → `proxy`** — rename `middleware.ts` to `proxy.ts` and the exported function to `proxy`. The `proxy` runtime is Node.js only (no `edge` runtime). Keep `middleware.ts` only if you need edge runtime.

- **`experimental_ppr` removed** — use `cacheComponents: true` in `next.config.ts` instead.

- **`next/image` defaults changed**: `minimumCacheTTL` is now 4 hours (was 60s); `imageSizes` no longer includes `16`; `qualities` defaults to `[75]`; local images with query strings require `images.localPatterns[].search` config.

### Changed APIs

- **`experimental.turbopack` → `turbopack`** at top level of `next.config.ts`.
- **`unstable_cacheLife` / `unstable_cacheTag`** → stable: import as `cacheLife`, `cacheTag` from `next/cache`.
- **New cache APIs**: `updateTag` (read-your-writes semantics in Server Actions), `refresh` (refresh client router from Server Action).
- **`revalidateTag`** accepts an optional second argument: a `cacheLife` profile.

### New features

- **React Compiler** — opt-in with `reactCompiler: true` in `next.config.ts` (requires `babel-plugin-react-compiler`).
- **React 19.2** — `ViewTransition`, `useEffectEvent`, `Activity` components available.
- **Turbopack filesystem caching** (beta) — `experimental.turbopackFileSystemCacheForDev: true`.
