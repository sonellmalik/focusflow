const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;
let miniWindow = null;
let colorFilterEnabled = false;
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
        // Always disable color filter on exit
        disableSystemGreyscale();
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

// ===== System-Wide Greyscale via Windows Color Filter =====
// Uses the Windows Accessibility Color Filter (Grayscale)
// Registry: HKCU\Software\Microsoft\ColorFiltering
//   Active = 1 (on) / 0 (off)
//   FilterType = 0 (Grayscale)

function enableSystemGreyscale() {
    if (colorFilterEnabled) return;

    const commands = [
        'reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v Active /t REG_DWORD /d 1 /f',
        'reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v FilterType /t REG_DWORD /d 0 /f',
        'reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v HotkeyEnabled /t REG_DWORD /d 1 /f'
    ].join(' && ');

    exec(commands, (err) => {
        if (!err) {
            colorFilterEnabled = true;
            // Send Win+Ctrl+C hotkey to toggle the filter live (registry alone needs a re-login)
            triggerColorFilterHotkey();
        }
    });
}

function disableSystemGreyscale() {
    if (!colorFilterEnabled) return;

    stopFocusWindowPolling();

    exec('reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v Active /t REG_DWORD /d 0 /f', (err) => {
        if (!err) {
            colorFilterEnabled = false;
            // Toggle hotkey to turn it off live
            triggerColorFilterHotkey();
        }
    });
}

// Simulate Win+Ctrl+C to toggle color filter live
// We use PowerShell's SendKeys since reg changes need a session restart otherwise
function triggerColorFilterHotkey() {
    const ps = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait('^({LWIN}c)')
    `;
    // The hotkey Win+Ctrl+C only works if HotkeyEnabled=1
    // Alternative: use a small C# snippet via PowerShell
    const psScript = `
        $source = @"
        using System;
        using System.Runtime.InteropServices;
        public class KeySender {
            [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
            public const byte VK_LWIN = 0x5B;
            public const byte VK_CONTROL = 0x11;
            public const byte VK_C = 0x43;
            public const uint KEYEVENTF_KEYUP = 0x0002;
            public static void PressWinCtrlC() {
                keybd_event(VK_LWIN, 0, 0, UIntPtr.Zero);
                keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
                keybd_event(VK_C, 0, 0, UIntPtr.Zero);
                keybd_event(VK_C, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }
"@
        Add-Type -TypeDefinition $source
        [KeySender]::PressWinCtrlC()
    `;

    exec(`powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, () => {});
}

// ===== Focus Window Polling =====
// When a chosen window is in focus (foreground + full screen), turn off greyscale
// When it's not full screen or not focused, keep greyscale on
let focusTargetName = null;

function startFocusWindowPolling(windowName) {
    focusTargetName = windowName;
    stopFocusWindowPolling();

    focusWindowPollingInterval = setInterval(() => {
        checkFocusWindowState();
    }, 2000);
}

function stopFocusWindowPolling() {
    if (focusWindowPollingInterval) {
        clearInterval(focusWindowPollingInterval);
        focusWindowPollingInterval = null;
    }
}

function checkFocusWindowState() {
    if (!focusTargetName) return;

    // Check if the target window is the foreground window and if it's maximized/fullscreen
    const psCheck = `
        Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class WinCheck {
            [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
            [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
            [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
        }
"@
        $hwnd = [WinCheck]::GetForegroundWindow()
        $sb = New-Object System.Text.StringBuilder 256
        [WinCheck]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        $rect = New-Object WinCheck+RECT
        [WinCheck]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
        $screenW = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
        $screenH = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
        $isFullScreen = ($rect.Left -le 0 -and $rect.Top -le 0 -and $rect.Right -ge $screenW -and $rect.Bottom -ge $screenH)
        Write-Output "$title|||$isFullScreen"
    `;

    exec(`powershell -ExecutionPolicy Bypass -Command "${psCheck.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, (err, stdout) => {
        if (err || !stdout) return;

        const parts = stdout.trim().split('|||');
        if (parts.length < 2) return;

        const foregroundTitle = parts[0];
        const isFullScreen = parts[1].trim().toLowerCase() === 'true';

        // If the chosen window is in the foreground AND full screen, disable greyscale
        const isTargetFocused = foregroundTitle.toLowerCase().includes(focusTargetName.toLowerCase());

        if (isTargetFocused && isFullScreen) {
            // Target is full screen — turn off greyscale so they see color
            if (colorFilterEnabled) {
                disableSystemGreyscaleQuiet();
            }
        } else {
            // Target not full screen or not focused — keep greyscale on
            if (!colorFilterEnabled) {
                enableSystemGreyscaleQuiet();
            }
        }
    });
}

// Quiet versions that don't trigger hotkey spam (just track state)
function enableSystemGreyscaleQuiet() {
    if (colorFilterEnabled) return;
    exec('reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v Active /t REG_DWORD /d 1 /f', () => {
        colorFilterEnabled = true;
        triggerColorFilterHotkey();
    });
}

function disableSystemGreyscaleQuiet() {
    if (!colorFilterEnabled) return;
    exec('reg add "HKCU\\Software\\Microsoft\\ColorFiltering" /v Active /t REG_DWORD /d 0 /f', () => {
        colorFilterEnabled = false;
        triggerColorFilterHotkey();
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
    // Enable system-wide greyscale and start polling the chosen window
    enableSystemGreyscale();
    startFocusWindowPolling(windowName);
});

ipcMain.on('disable-focus-mode', () => {
    disableSystemGreyscale();
    stopFocusWindowPolling();
    focusTargetName = null;
});

// ===== App Lifecycle =====
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    disableSystemGreyscale();
    app.quit();
});

app.on('before-quit', () => {
    disableSystemGreyscale();
    stopFocusWindowPolling();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
