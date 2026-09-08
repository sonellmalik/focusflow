# FocusFlow

**A calm, all-in-one productivity companion for your desktop.**

FocusFlow keeps your focus sessions, daily schedule, and progress in one tidy window that tucks into the left quarter of your screen. Everything stays **local** — no accounts, no cloud, no data leaves your machine.

---

## Features

### Pomodoro Timer
- Work / short / long break with customizable durations and an 8-session cycle
- Shrinks into a transparent floating widget with a one-tap distraction button
- Sound + desktop notification when a session ends

### Focus Mode *(Windows)*
- Turns your entire PC greyscale to kill visual temptation
- Pick the window(s) to keep in color; color returns only when they're active
- Multi-monitor aware, and color is always restored on exit

### Scheduler
- Flexible day calendar (Teams-style) — drag across any range to create a block
- **Resize blocks** by dragging their top or bottom edge
- Assign to-dos, priorities, scheduled breaks, or custom entries
- **My 5 Priorities** list, plus a to-do list with a collapsible Completed archive
- Live current-time line; clears each midnight and saves the day into History

### Distraction Tracking & Reflection
- Quick-tap counter and an end-of-session timeline to tag each distraction
- A short reflection check-in after every 4 sessions

### History
- Monthly heatmap of focus sessions per day
- Click any day for its sessions, distraction breakdown, and planned schedule

### Articles
- Small built-in library; highlight lines to rotate as inspiration on the Timer tab

### Startup *(new in 1.2.0)*
- Opens to the **Scheduler** with a "How would you like to plan the day?" prompt
- **Launch at startup** toggle in Timer settings

---

## Getting Started

**Windows:** Download `FocusFlow Setup.exe` from [Releases](../../releases) and run it. If Windows warns, choose **More info → Run anyway** (the app isn't code-signed).

**macOS:** Download `FocusFlow.dmg` from [Releases](../../releases) and drag FocusFlow into Applications.

---

## For developers

Requires [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/sonellmalik/focusflow.git
cd focusflow
npm install --legacy-peer-deps
npm start            # run in development
```

Build installers:

```bash
node build.js win   # Windows (.exe)
node build.js mac   # macOS (.dmg) — must run on macOS
node build.js       # auto-detect platform
```

Built files land in `dist/`. Focus Mode uses standard `Magnification.dll` / `user32.dll` calls on Windows — no screen capture, no elevated privileges.

**Built with:** Electron, plain HTML/CSS/JavaScript, electron-builder, and GitHub Actions.

---

## License

[MIT License](LICENSE) — free to use, modify, and share.

## Author

**Sonell Malik** — [github.com/sonellmalik](https://github.com/sonellmalik)
