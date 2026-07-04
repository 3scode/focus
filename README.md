# TimeBlock

A simple, visual time blocking web app for daily planning — drag & drop your schedule, track focus sessions, and review your day.

## Features

- **Home Page** — Landing page with app overview and call-to-action.
- **Authentication** — Sign-up and sign-in with local storage (password hashed with SHA-256).
- **Today View** — Vertical timeline with drag-and-drop blocks. Block height dynamically matches its duration.
- **Weekly View** — 7-day grid with a full list of the week's blocks below.
- **Recurring Blocks** — Set blocks to repeat daily or weekly, with an option to delete the entire series.
- **Focus Timer** — Stopwatch-based Pomodoro timer linked to your time blocks. Break time is proportional to actual focus duration. Beep sound at each session milestone.
- **Persistent Timer** — Timer keeps running even when navigating between pages. Floating timer bar at the bottom lets you control pause/stop from anywhere.
- **One-Click Break** — "Rest" button starts a break without stopping focus; "Stop" saves focus and returns to idle without break.
- **Session Tracking** — Each focus session is recorded per block with duration and timestamp.
- **Daily Review** — Review completed and missed blocks, reschedule unfinished tasks. Per-task progress bars show focus time vs scheduled duration, including the currently running session in real-time.
- **Live Timer Status** — Active timer shown as a stat card in the Review page with task name and elapsed time.
- **Categories & Theming** — Color-coded categories that style each block for better visual organization.
- **Dark Mode** — Toggle between light and dark themes.
- **Export/Import** — Export and import your categories and settings as JSON.
- **Fully Offline** — All data stored in your browser (IndexedDB + localStorage).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Drag & Drop | dnd-kit |
| Storage | IndexedDB (idb-keyval) + localStorage |
| Auth | Custom local auth with SHA-256 |
| PWA | Web App Manifest + Service Worker |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Author

**Created by Trisno Sanjaya**

## License

MIT
