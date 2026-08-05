const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('path');

let mainWindow = null;
let miniWindow = null;
let overlayWindow = null; // Greyscale overlay for focus mode

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
        if (overlayWindow) {
            overlayWindow.close();
            overlayWindow = null;
        }
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

// ===== Greyscale Overlay for Focus Mode =====
function createGreyscaleOverlay(excludeWindowName) {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    overlayWindow = new BrowserWindow({
        width: screenWidth,
        height: screenHeight,
        x: 0,
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        hasShadow: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // The overlay applies a greyscale filter visually
    // We pass through mouse events so the user can still interact
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    const overlayHTML = `
        <!DOCTYPE html>
        <html>
        <head><style>
            * { margin: 0; padding: 0; }
            body {
                width: 100vw;
                height: 100vh;
                background: transparent;
                pointer-events: none;
            }
            .overlay {
                width: 100%;
                height: 100%;
                backdrop-filter: grayscale(100%);
                -webkit-backdrop-filter: grayscale(100%);
            }
        </style></head>
        <body><div class="overlay"></div></body>
        </html>
    `;

    overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
}

function removeGreyscaleOverlay() {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
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
    // Forward to main window so it can increment the counter
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('distraction-logged', sessionDistractionCount);
    }
});

// Reset distraction count when timer stops (session over)
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
ipcMain.handle('get-open-windows', async () => {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['window'],
            thumbnailSize: { width: 150, height: 100 }
        });

        return sources
            .filter(source => source.name && source.name.trim() !== '')
            .map(source => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail.toDataURL()
            }));
    } catch(e) {
        console.error('Failed to get windows:', e);
        return [];
    }
});

ipcMain.on('set-focus-window', (event, windowId, windowName) => {
    // Create greyscale overlay excluding the selected window
    createGreyscaleOverlay(windowName);
});

ipcMain.on('disable-focus-mode', () => {
    removeGreyscaleOverlay();
});

// ===== App Lifecycle =====
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
