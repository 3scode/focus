<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Focus — panduan spesifik repo

## Perintah
- `bun run dev` — server dev di localhost:3000
- `bun run lint` — ESLint saja (pakai `bun`, jangan `npx`; tidak ada script typecheck; error tipe terdeteksi saat build)
- **Tidak ada test framework** — tidak ada perintah test
- ⛔ **JANGAN** jalankan build atau deploy (`bun run build`, `npx next build`, `next build`, `yarn build`, `pnpm build`). Tanyakan dulu ke user.

## Arsitektur
- **Hybrid storage:** data utama di PostgreSQL (Neon via Drizzle ORM) + IndexedDB (`idb-keyval`) sebagai local cache.
- **Auth:** Better Auth (`better-auth`). Server-side di `src/lib/auth.ts`, client-side di `src/lib/auth-client.ts`. API handler di `src/app/api/auth/[...all]/route.ts`. Middleware proteksi route di `src/middleware.ts`.
- **State management:** React Context saja — tiga provider di `src/app/providers.tsx`:
  - `AuthProvider` → pakai dari `@/store/auth` (wrapper Better Auth `useSession`)
  - `AppProvider` (blocks/categories/habits/settings) → pakai dari `@/store`
  - `TimerProvider` → pakai dari `@/store/timer`
- **Path alias:** `@/*` mengarah ke `./src/*`
- **Semua halaman pakai `"use client"`** — tidak ada React Server Components
- **Timer persist:** state timer bertahan saat navigasi via localStorage (`time-blocking:timer` key)

## Environment Variables (wajib)

| Variable | Required | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | ✅ | Secret untuk signing token. `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Base URL aplikasi (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `BETTER_AUTH_API_KEY` | ❌ | API key untuk Better Auth Cloud (dash plugin) |

## Konvensi utama
- Pattern import: `@/store`, `@/lib/api`, `@/lib/storage`, `@/components/blocks/TimeBlock`
- Tanggal/waktu: `date-fns` dengan locale Indonesia (`id`). Format: `"yyyy-MM-dd"`
- ID: generate dengan `uuid` (`v4 as uuidv4`)
- Toast: `sonner` (`toast.error(...)`)
- Ikon: `lucide-react` (outline style, stroke 2px)
- Styling: Tailwind CSS 4 dengan konfigurasi CSS-first (`@theme` di `globals.css`)
- Drag & drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- ESLint 9 flat config di `eslint.config.mjs` — jalankan `bun run lint`
- **Tidak ada formatter** (tidak ada prettier/prettierrc)

## API Routes (Neon DB)
Semua route ada di `src/app/api/` dan menggunakan koneksi PostgreSQL via Drizzle ORM:

| Route | Method | Deskripsi |
|---|---|---|
| `/api/auth/*` | GET,POST,... | Better Auth handler (sign-up, sign-in, session, dll) |
| `/api/blocks` | GET,POST,DELETE | Time blocks CRUD |
| `/api/blocks/recurring` | DELETE | Hapus seluruh recurring series |
| `/api/categories` | GET,POST,DELETE | Kategori CRUD |
| `/api/habits` | GET,POST | Habits CRUD |
| `/api/habits/[id]` | GET,PUT,DELETE | Habit detail & update |
| `/api/habit-records` | GET,POST,DELETE | Habit records CRUD |
| `/api/focus-sessions` | GET,POST,DELETE | Focus sessions CRUD |
| `/api/settings` | GET,POST | User settings |

## Middleware
`src/middleware.ts` — melindungi semua route kecuali `/sign-in`, `/sign-up`, `/`, `/api/*`. Mengecek session via `auth.api.getSession()`. Jika tidak login, redirect ke `/sign-in`.

## Struktur direktori
- `src/app/` — halaman Next.js App Router: `today/`, `week/`, `habits/`, `timer/`, `review/`, `settings/`, `sign-in/`, `sign-up/`
- `src/store/` — provider React Context (App, Auth, Timer)
- `src/lib/` — utilitas: `api.ts` (HTTP client ke API routes), `storage.ts` (IndexedDB — local cache), `auth.ts` (server-side Better Auth config), `auth-client.ts` (client-side Better Auth), `time.ts`, `constants.ts`, `register-sw.ts`
- `src/hooks/` — custom hooks: `useBlocks`, `useStopwatch`, `useSwipe`, `useTimer`
- `src/components/` — `blocks/`, `forms/BlockForm`, `layout/` (Nav, AuthGuard, FloatingTimer), `ui/` (Button, Modal, dll)
- `src/types/index.ts` — shared TypeScript types (Block, Category, Habit, HabitRecord, FocusSession, Settings)
- `src/db/` — Drizzle ORM schema (`schema.ts`) dan koneksi (`index.ts`)
- `public/sw.js` — service worker (manual, bukan auto-generated)
- `design-references/` — referensi UI mockup untuk setiap halaman

## Keanehan PWA
- Service worker di `/sw.js` — didaftarkan di `src/lib/register-sw.ts`, dipanggil dari `providers.tsx`
- Manifest di `/public/manifest.json`
- `DEBUG-PWA.md` berisi langkah troubleshooting untuk masalah installabilitas
