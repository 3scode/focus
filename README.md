# TimeBlock

A simple, visual time blocking web app for daily planning — drag & drop your schedule, track focus sessions, and review your day.

## Features

- **Today View** — Vertical timeline with drag-and-drop blocks. Block height dynamically matches its duration.
- **Weekly View** — 7-day grid with a full list of the week's blocks below.
- **Recurring Blocks** — Set blocks to repeat daily or weekly, with an option to delete the entire series.
- **Focus Timer** — Built-in timer linked to your time blocks, using duration from your preferences.
- **Categories & Theming** — Color-coded categories that style each block for better visual organization.
- **Dark Mode** — Toggle between light and dark themes.
- **Fully Offline** — All data stored in your browser (IndexedDB).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Drag & Drop | dnd-kit |
| Storage | localStorage + idb-keyval |
| Hosting | Vercel |

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

## License

MIT
