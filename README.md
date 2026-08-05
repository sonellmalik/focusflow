# FocusFlow

A desktop productivity tracker with a Pomodoro timer, focus mode, time blocking, distraction logging, and a built-in reading library. 
Designed to sit in the left quarter of your screen and stay out of your way while keeping you on track.

## Features

### Pomodoro Timer
- Customizable work, short break, and long break durations
- 8-session cycle with automatic break scheduling
- Audio notification and desktop alert when sessions complete
- Minimize to a tiny transparent overlay in the bottom-left corner while working
- Quick-tap distraction button on the overlay (no form, just a click)


### Distraction Tracking
- Quick-tap distraction counter on the mini overlay
- Detailed distraction form (how long + what caused it)
- End-of-session timeline showing exactly when each distraction happened
- Tap dots on the timeline to tag them: phone, people, internal thought, or other
- All distraction data logged per day for historical review

### Reflection Prompts
- Every 4 completed work sessions, a reflection modal appears
- Shows total distraction count for the cycle
- Asks: what's going well, what to improve, energy level
- Responses saved for personal review

### Time Blocking
- Full-day schedule grid (6 AM - 10 PM)
- Drag tasks from your to-do list into time slots, or click to assign
- "My 5 Priorities" section that persists day to day
- Separate regular to-do list with priority levels (high/normal/low)

### History Calendar
- Daily pomodoro count logged automatically
- Monthly calendar heatmap (color-coded by session count)
- Click any day to see pomodoro count and a list of every distraction with timestamps, causes, and tags
- Monthly stats: total pomodoros, active days, average per day, total distractions

### Productivity Articles
- Built-in collection of focus and productivity articles
- Highlight any text while reading
- Highlighted quotes rotate on the timer page sidebar as inspiration

## Installation

### Download Installer

Grab the latest release from the [Releases](../../releases) page:
- **Windows:** `FocusFlow Setup 1.0.0.exe`
- **macOS:** `FocusFlow-1.0.0.dmg`

### Build from Source

Requires [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/sonellmalik/focusflow.git
cd focusflow
npm install --legacy-peer-deps
```

Run the app in development:
```bash
npm start
```

Build installers:
```bash
# Windows (.exe)
node build.js win

# macOS (.dmg) — must be run on macOS
node build.js mac

# Auto-detect platform
node build.js
```

Output goes to the `dist/` folder.

## Project Structure

```
productivity-tracker/
├── main.js              Electron main process
├── preload.js           IPC bridge (main ↔ renderer)
├── index.html           App UI
├── mini.html            Transparent timer overlay
├── build.js             Build script (disables code signing)
├── package.json
├── css/
│   ├── style.css        Base styles, nav, forms, layout
│   ├── timer.css        Timer, focus mode, reflection, timeline
│   ├── timeblock.css    To-do list, priorities, time grid
│   ├── articles.css     Article cards and reader
│   └── history.css      Calendar heatmap and day detail
├── js/
│   ├── app.js           Navigation, localStorage helpers, mini timer
│   ├── timer.js         Pomodoro logic, focus mode, distractions
│   ├── timeblock.js     Priorities, to-do list, time block grid
│   ├── articles.js      Article content, highlighting, quotes
│   └── history.js       Calendar rendering, daily logging
└── .github/
    └── workflows/
        └── build.yml    CI: builds .exe + .dmg on push
```

## How It Works

The app opens pinned to the left 1/4 of your screen. When you start a Pomodoro:

1. The main window minimizes
2. A small transparent timer appears in the bottom-left corner
3. You work in whatever app you choose (optionally with greyscale focus mode)
4. Tap the `!` button on the overlay if you get distracted
5. When the session ends, you see a distraction timeline and can tag each one
6. Every 4 sessions, a reflection prompt helps you check in with yourself

All data persists in localStorage — nothing leaves your machine.

## Tech Stack

- **Electron** — cross-platform desktop shell
- **Vanilla HTML/CSS/JS** — no frameworks, no build tools for the UI
- **electron-builder** — packaging into .exe and .dmg
- **GitHub Actions** — automated CI builds

## License

MIT License

## Author
**Sonell Malik**

GitHub: https://github.com/sonellmalik
