# FocusFlow

**A calm, all-in-one productivity companion for your desktop.**

FocusFlow keeps your focus sessions, daily schedule, and progress in one tidy window that tucks into the left quarter of your screen and stays out of your way. Run a Pomodoro timer, block out your day, log distractions, and watch your consistency grow, all without leaving the app.

> New here? Jump to [Getting Started](#getting-started) to be up and running in about a minute.

---

## What you can do with it

- **Stay focused** with a Pomodoro timer that shrinks into a tiny floating widget while you work.
- **Block distractions** by turning the rest of your screen greyscale so only your work window stays in color.
- **Plan your day** on a flexible calendar, dragging out any time range and dropping a task onto it.
- **Notice your patterns** by logging distractions and reviewing them later.
- **Build momentum** with a history calendar that shows how many focus sessions you complete each day.

---

## Getting Started

### The quickest way (Windows)

1. Go to the [**Releases**](../../releases) page.
2. Download the latest **`FocusFlow Setup.exe`**.
3. Run it. If Windows shows a "Windows protected your PC" warning, click **More info → Run anyway** (this appears because the app isn't code-signed, which is normal for open-source apps).
4. Launch FocusFlow from your Start menu or desktop shortcut. That's it!

### On macOS

Download the latest **`FocusFlow.dmg`** from [Releases](../../releases), open it, and drag FocusFlow into your Applications folder.

---

## Your first focus session

1. Open the **Timer** tab and press **Start**.
2. The main window shrinks into a small floating timer in the bottom-left corner. Go do your work.
3. Got distracted? Tap the **`!`** button on the little timer to log it, no typing needed.
4. When the session ends, you'll see a quick timeline of when your distractions happened. Tag each one (phone, people, a stray thought, or other) or just skip.
5. Every 4 sessions, a short reflection pops up to help you check in with yourself.

Everything you do stays **on your own computer** — no accounts, no cloud, no data leaves your machine.

---

## Features at a glance

### Pomodoro Timer
- Work / short break / long break, each with **durations you can customize**
- 8-session cycle with automatic break scheduling
- Sound and desktop notification when a session ends
- Shrinks into a **transparent floating widget** so you can keep working
- One-tap distraction button right on the widget
- Session count resets automatically at midnight

### Focus Mode
- Turns your **entire screen greyscale** to kill visual temptation
- Pick one window to stay in full color while everything else fades
- Toggle it on and off from the Timer tab

### Distraction Tracking
- Quick-tap counter on the floating widget (no forms)
- Optional detailed log: how long you were distracted and what caused it
- End-of-session **timeline** showing exactly when each distraction happened
- Tag distractions with icons: phone, people, internal thought, or other
- Everything is saved by day so you can spot patterns over time

### Reflection Prompts
- A gentle check-in after every 4 focus sessions
- Shows how many distractions you had that cycle
- Asks what's going well, what to improve, and your energy level

### Time Blocking (calendar)
- A flexible day calendar, like the one in Microsoft Teams
- **Click and drag across any range** (say, 12:00–3:10 PM) to create a block
- Drop in a to-do, a priority, a scheduled break, or a custom entry
- Edit or remove a block by clicking it or right-clicking for a menu
- A live **"current time" line** and auto-scroll to now when you open the page
- **My 5 Priorities** list that carries over day to day
- A regular to-do list with high / normal / low priorities
- The calendar clears each midnight for a fresh start

### History Calendar
- Automatically logs how many focus sessions you finish each day
- Monthly **heatmap** colored by how productive each day was
- Click any day to see its sessions and a full distraction breakdown
- Monthly stats: total sessions, active days, and averages

### Productivity Articles
- A small built-in library of focus and productivity reads
- Highlight lines that resonate; your highlights rotate as inspiration on the Timer tab

---

## Tips

- **Move the floating timer** by dragging it anywhere on screen.
- **Bring the full app back** anytime using the expand button on the floating widget.
- Because data is stored locally in the app, keep using the same computer to preserve your history.

---

## For developers

Want to run or build FocusFlow yourself? You'll need [Node.js](https://nodejs.org/) 18 or newer.

```bash
# Get the code
git clone https://github.com/sonellmalik/focusflow.git
cd focusflow
npm install --legacy-peer-deps

# Run it in development
npm start
```

Build installers:

```bash
node build.js win   # Windows (.exe)
node build.js mac   # macOS (.dmg) — must run on macOS
node build.js       # auto-detect current platform
```

Built files land in the `dist/` folder. Pushing a version tag also triggers a GitHub Actions build that produces both installers.

<details>
<summary>Project structure</summary>

```
productivity-tracker/
├── main.js              Electron main process (windows, focus mode)
├── preload.js           Secure bridge between main and UI
├── index.html           App UI
├── mini.html            Transparent floating timer
├── build.js             Build script
├── package.json
├── css/                 Styles (timer, calendar, history, articles)
└── js/                  App logic (timer, time blocks, history, articles)
```
</details>

**Built with:** Electron, plain HTML/CSS/JavaScript (no UI frameworks), electron-builder for packaging, and GitHub Actions for CI.

---

## License

Released under the [MIT License](LICENSE) — free to use, modify, and share.

## Author

**Sonell Malik** — [github.com/sonellmalik](https://github.com/sonellmalik)
