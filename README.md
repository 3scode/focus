# Focus

Aplikasi PWA berbasis web untuk perencanaan harian yang visual, modern, dengan autentikasi dan database cloud.

## Fitur

- **Landing Page** — Halaman depan dengan hero gradient, bento grid, dan call-to-action.
- **Autentikasi** — Sign-up dan sign-in dengan email/password via Better Auth.
- **Hari Ini** — Timeline vertikal dengan drag-and-drop block. Tinggi block otomatis sesuai durasi.
- **Mingguan** — Grid 7 hari dengan daftar lengkap block minggu ini.
- **Recurring Block** — Block berulang harian/mingguan dengan opsi hapus seluruh seri.
- **Focus Timer** — Timer Pomodoro berbasis stopwatch yang terhubung dengan blok waktu. Break proporsional dengan durasi fokus. Bip di setiap milestone.
- **Timer Persisten** — Timer tetap jalan saat navigasi halaman. Floating timer bar di bawah untuk pause/stop dari mana saja.
- **One-Click Break** — Tombol "Rest" mulai break tanpa stop fokus; "Stop" simpan fokus dan kembali idle.
- **Sesi Tracking** — Setiap sesi fokus tercatat per block dengan durasi dan timestamp.
- **Daily Review** — Review block selesai/missed, reschedule task. Progress bar per task menunjukkan waktu fokus vs durasi terjadwal, termasuk sesi yang sedang berjalan secara real-time.
- **Habit Tracker** — Halaman khusus habits dengan checklist harian, streak counter, grafik completion 7/14/30 hari, dan riwayat per habit.
- **Kategori & Warna** — Kategori dengan kode warna yang memberi style setiap block.
- **Dark Mode Permanen** — Selalu dark mode dengan desain system Linear (near-black, glass morphism, accent #5E6AD2).
- **Export/Import** — Export dan import data (blocks, kategori, settings, focus sessions) sebagai JSON.
- **Offline Support** — Service worker untuk caching halaman static. Data utama via API dengan IndexedDB sebagai local cache.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| Ikon | Lucide React |
| Drag & Drop | dnd-kit |
| Auth | Better Auth (email/password) |
| Database | PostgreSQL via Neon (Drizzle ORM) |
| Cloud Storage | IndexedDB (idb-keyval) |
| PWA | Web App Manifest + Service Worker |

## Environment Variables

Buat file `.env.local` dengan isi berikut:

```bash
# === BETTER AUTH ===
# Secret untuk signing token session
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET=your_secret_here

# URL aplikasi (development atau production)
BETTER_AUTH_URL=http://localhost:3000

# === DATABASE ===
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# === BETTER AUTH CLOUD (opsional) ===
BETTER_AUTH_API_KEY=your_api_key_here
```

## Memulai

```bash
bun install
bun run dev
```

> ⚠️ Jangan jalankan `bun run build` tanpa persetujuan dari author. Tanyakan dulu sebelum menjalankan perintah build.
> Commit dan push messages **wajib menggunakan Bahasa Indonesia**.

## Author

**Created by Trisno Sanjaya** — [3SCODE](https://3scode.my.id)

## License

MIT
