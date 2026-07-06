<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TimeBlock — panduan spesifik repo

## Perintah
- `npm run dev` — server dev di localhost:3000
- `npm run lint` — ESLint saja (tidak ada script typecheck; error tipe terdeteksi saat build)
- **Tidak ada test framework** — tidak ada perintah test
- ⛔ **JANGAN** jalankan build atau deploy (`npm run build`, `npx next build`, `next build`, `yarn build`, `pnpm build`). Tanyakan dulu ke user.

## Arsitektur
- **PWA offline penuh** — semua data di IndexedDB (`idb-keyval`) + localStorage. Tidak ada backend, tidak ada API routes.
- **Auth:** custom lokal menggunakan SHA-256 (`crypto.subtle.digest`), disimpan di localStorage. Bukan Clerk/NextAuth.
- **State management:** React Context saja — tiga provider di `src/app/providers.tsx`:
  - `AuthProvider` → pakai dari `@/store/auth`
  - `AppProvider` (blocks/categories/settings) → pakai dari `@/store`
  - `TimerProvider` → pakai dari `@/store/timer`
- **Path alias:** `@/*` mengarah ke `./src/*`
- **Semua halaman pakai `"use client"`** — tidak ada React Server Components
- **Timer persist:** state timer bertahan saat navigasi via localStorage (`time-blocking:timer` key)

## Konvensi utama
- Pattern import: `@/store`, `@/lib/storage`, `@/components/blocks/TimeBlock`
- Tanggal/waktu: `date-fns` dengan locale Indonesia (`id`). Format: `"yyyy-MM-dd"`
- ID: generate dengan `uuid` (`v4 as uuidv4`)
- Toast: `sonner` (`toast.error(...)`)
- Ikon: `lucide-react` (outline style, stroke 2px)
- Styling: Tailwind CSS 4 dengan konfigurasi CSS-first (`@theme` di `globals.css`)
- Drag & drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- ESLint 9 flat config di `eslint.config.mjs` — jalankan `npm run lint`
- **Tidak ada formatter** (tidak ada prettier/prettierrc)

## Struktur direktori
- `src/app/` — halaman Next.js App Router: `today/`, `week/`, `timer/`, `review/`, `settings/`, `sign-in/`, `sign-up/`
- `src/store/` — provider React Context (App, Auth, Timer)
- `src/lib/` — utilitas: `storage.ts` (IndexedDB), `auth.ts`, `time.ts`, `constants.ts`, `register-sw.ts`
- `src/hooks/` — custom hooks: `useBlocks`, `useStopwatch`, `useSwipe`, `useTimer`
- `src/components/` — `blocks/`, `forms/BlockForm`, `layout/` (Nav, AuthGuard, FloatingTimer), `ui/` (Button, Modal, dll)
- `src/types/index.ts` — shared TypeScript types
- `public/sw.js` — service worker (manual, bukan auto-generated)
- `design-references/` — referensi UI mockup untuk setiap halaman

## Keanehan PWA
- Service worker di `/sw.js` — didaftarkan di `src/lib/register-sw.ts`, dipanggil dari `providers.tsx`
- Manifest di `/public/manifest.json`
- `DEBUG-PWA.md` berisi langkah troubleshooting untuk masalah installabilitas
