const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');

let mainWindow = null;
let miniWindow = null;
let focusWindowPollingInterval = null;

function createMainWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // Main window takes left 1/4 of screen
    const winWidth = Math.round(screenWidth / 4);
    const winHeight = screenHeight;

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: 0,
        y: 0,
        maxWidth: winWidth,
        resizable: true,
        frame: true,
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (miniWindow) {
            miniWindow.close();
            miniWindow = null;
        }
        // Always restore color on exit
        disableFocusMode();
        app.quit();
    });
}

function createMiniWindow() {
    if (miniWindow) return;

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    miniWindow = new BrowserWindow({
        width: 240,
        height: 70,
        x: 20,
        y: screenHeight - 100,
        resizable: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    miniWindow.loadFile('mini.html');
    miniWindow.setIgnoreMouseEvents(false);

    miniWindow.on('closed', () => {
        miniWindow = null;
    });
}

// ===== System-Wide Greyscale via Windows Magnification API =====
// A persistent PowerShell helper (greyscale-helper.ps1) applies a grayscale
// color matrix to the ENTIRE screen using MagSetFullscreenColorEffect.
// We send "ON"/"OFF" over its stdin. If the helper dies, Windows restores
// color automatically, so the user can never get stuck in greyscale.

let greyscaleHelper = null;   // the spawned PowerShell process
let greyscaleActive = false;  // whether the whole screen is currently grey
let focusModeOn = false;      // whether focus mode is enabled at all
let focusTargetNames = [];    // window titles (one per display) that keep color

function startGreyscaleHelper() {
    if (greyscaleHelper) return;

    const scriptPath = path.join(__dirname, 'greyscale-helper.ps1');
    greyscaleHelper = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
    ], { windowsHide: true });

    greyscaleHelper.on('error', (e) => {
        console.error('Greyscale helper failed to start:', e);
        greyscaleHelper = null;
    });

    greyscaleHelper.on('exit', () => {
        greyscaleHelper = null;
        greyscaleActive = false;
    });
}

function sendGreyscaleCommand(cmd) {
    if (!greyscaleHelper || !greyscaleHelper.stdin.writable) return;
    try {
        greyscaleHelper.stdin.write(cmd + '\n');
    } catch (e) {
        console.error('Failed to write to greyscale helper:', e);
    }
}

function applyGreyscale() {
    if (greyscaleActive) return;
    startGreyscaleHelper();
    sendGreyscaleCommand('ON');
    greyscaleActive = true;
}

function removeGreyscale() {
    if (!greyscaleActive) return;
    sendGreyscaleCommand('OFF');
    greyscaleActive = false;
}

function stopGreyscaleHelper() {
    if (greyscaleHelper) {
        sendGreyscaleCommand('EXIT');
        try { greyscaleHelper.stdin.end(); } catch (e) {}
        // Give it a moment to restore color, then force-kill if still alive
        const proc = greyscaleHelper;
        setTimeout(() => {
            if (proc && !proc.killed) {
                try { proc.kill(); } catch (e) {}
            }
        }, 500);
        greyscaleHelper = null;
    }
    greyscaleActive = false;
}

// Called when the user turns focus mode ON (with zero or more chosen windows).
// `names` is an array of window titles that should keep color when active.
function enableFocusMode(names) {
    focusModeOn = true;
    focusTargetNames = Array.isArray(names)
        ? names.filter(n => n && n.trim().length > 0)
        : (names ? [names] : []);
    startGreyscaleHelper();
    applyGreyscale(); // grey everything to start; polling adjusts from here
    startFocusWindowPolling();
}

// Update the chosen work windows without tearing down greyscale (used by Apply/Refresh)
function updateFocusTargets(names) {
    focusTargetNames = Array.isArray(names)
        ? names.filter(n => n && n.trim().length > 0)
        : (names ? [names] : []);
    // Re-evaluate immediately so color returns/leaves right away
    checkFocusWindowState();
}

// Called when the user turns focus mode OFF
function disableFocusMode() {
    focusModeOn = false;
    focusTargetNames = [];
    stopFocusWindowPolling();
    removeGreyscale();
    stopGreyscaleHelper();
}

// ===== Focus Window Polling =====
// While focus mode is on: if the chosen work window is the foreground window,
// show color; otherwise keep the whole screen greyscale.

function startFocusWindowPolling() {
    stopFocusWindowPolling();
    // Run one immediate check, then poll
    checkFocusWindowState();
    focusWindowPollingInterval = setInterval(checkFocusWindowState, 1200);
}

function stopFocusWindowPolling() {
    if (focusWindowPollingInterval) {
        clearInterval(focusWindowPollingInterval);
        focusWindowPollingInterval = null;
    }
}

function checkFocusWindowState() {
    if (!focusModeOn) return;

    // If no windows were chosen yet, keep the whole screen grey.
    if (!focusTargetNames || focusTargetNames.length === 0) {
        applyGreyscale();
        return;
    }

    // Get the current foreground window title via a dedicated helper script
    const titleScript = path.join(__dirname, 'foreground-title.ps1');
    exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${titleScript}"`,
        { windowsHide: true },
        (err, stdout) => {
            if (!focusModeOn) return;
            if (err || stdout == null) return;

            const foregroundTitle = stdout.trim().toLowerCase();
            if (foregroundTitle.length === 0) { applyGreyscale(); return; }

            // Color returns if the active window matches ANY chosen work window.
            // Match is bidirectional (either title may be a substring of the other)
            // to handle apps that append/trim suffixes to their window titles.
            const isTargetFocused = focusTargetNames.some(name => {
                const target = (name || '').toLowerCase().trim();
                if (target.length === 0) return false;
                if (foregroundTitle.includes(target) || target.includes(foregroundTitle)) return true;
                // Also match on the app-name portion after the last " - " separator
                const targetApp = target.split(' - ').pop().trim();
                const fgApp = foregroundTitle.split(' - ').pop().trim();
                return targetApp.length > 1 && targetApp === fgApp;
            });

            if (isTargetFocused) {
                removeGreyscale(); // a chosen work window is active -> show color
            } else {
                applyGreyscale();  // anything else -> grey
            }
        });
}

// ===== IPC Handlers =====

// Timer controls
ipcMain.on('timer-started', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
    createMiniWindow();
});

ipcMain.on('timer-paused', () => {
    // Keep mini window visible
});

ipcMain.on('timer-tick', (event, timeString) => {
    if (miniWindow && !miniWindow.isDestroyed()) {
        miniWindow.webContents.send('update-time', timeString);
    }
});

ipcMain.on('timer-mode-changed', (event, mode) => {
    if (miniWindow && !miniWindow.isDestroyed()) {
        miniWindow.webContents.send('update-mode', mode);
    }
});

ipcMain.on('show-main-window', () => {
    if (miniWindow) {
        miniWindow.close();
        miniWindow = null;
    }
    if (mainWindow) {
        mainWindow.restore();
        mainWindow.focus();
    }
});

ipcMain.on('mini-pause-toggle', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-timer');
    }
});

// ===== Distraction Counter =====
let sessionDistractionCount = 0;

ipcMain.on('log-distraction', () => {
    sessionDistractionCount++;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('distraction-logged', sessionDistractionCount);
    }
});

ipcMain.on('timer-stopped', () => {
    sessionDistractionCount = 0;
    if (miniWindow) {
        miniWindow.close();
        miniWindow = null;
    }
    if (mainWindow) {
        mainWindow.restore();
        mainWindow.focus();
    }
});

// ===== Focus Mode - Window Enumeration =====
// Titles ONLY, via user32.dll EnumWindows (see list-windows.ps1).
// No screen capture, no thumbnails, no window content is read.
ipcMain.handle('get-open-windows', () => {
    return new Promise((resolve) => {
        const listScript = path.join(__dirname, 'list-windows.ps1');
        exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${listScript}"`,
            { windowsHide: true, maxBuffer: 1024 * 1024 },
            (err, stdout) => {
                if (err || !stdout) {
                    resolve([]);
                    return;
                }
                const ownTitle = (mainWindow && !mainWindow.isDestroyed())
                    ? (mainWindow.getTitle() || '').trim()
                    : 'FocusFlow';

                const titles = stdout
                    .split(/\r?\n/)
                    .map(t => t.trim())
                    .filter(t => t.length > 0)
                    // Hide FocusFlow's own window from the picker
                    .filter(t => t !== ownTitle && !t.toLowerCase().includes('focusflow'));

                // De-duplicate while preserving order
                const seen = new Set();
                const unique = [];
                for (const t of titles) {
                    if (!seen.has(t)) { seen.add(t); unique.push({ name: t }); }
                }
                resolve(unique);
            });
    });
});

// How many displays are connected (so the UI can ask for one window per screen)
ipcMain.handle('get-display-count', () => {
    try {
        return screen.getAllDisplays().length;
    } catch (e) {
        return 1;
    }
});

// Turn focus mode ON. `windowNames` is an array of chosen window titles.
ipcMain.on('set-focus-window', (event, windowNames) => {
    enableFocusMode(windowNames);
});

// Update the chosen windows while focus mode is already on (Apply/Refresh button)
ipcMain.on('update-focus-windows', (event, windowNames) => {
    if (focusModeOn) {
        updateFocusTargets(windowNames);
    } else {
        enableFocusMode(windowNames);
    }
});

ipcMain.on('disable-focus-mode', () => {
    disableFocusMode();
});

// ===== App Lifecycle =====
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    disableFocusMode();
    app.quit();
});

app.on('before-quit', () => {
    disableFocusMode();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
