const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Timer IPC
    timerStarted: () => ipcRenderer.send('timer-started'),
    timerPaused: () => ipcRenderer.send('timer-paused'),
    timerStopped: () => ipcRenderer.send('timer-stopped'),
    timerTick: (timeString) => ipcRenderer.send('timer-tick', timeString),
    timerModeChanged: (mode) => ipcRenderer.send('timer-mode-changed', mode),
    showMainWindow: () => ipcRenderer.send('show-main-window'),
    miniPauseToggle: () => ipcRenderer.send('mini-pause-toggle'),
    onUpdateTime: (callback) => ipcRenderer.on('update-time', (event, time) => callback(time)),
    onUpdateMode: (callback) => ipcRenderer.on('update-mode', (event, mode) => callback(mode)),
    onToggleTimer: (callback) => ipcRenderer.on('toggle-timer', () => callback()),

    // Distraction counter
    logDistraction: () => ipcRenderer.send('log-distraction'),
    onDistractionLogged: (callback) => ipcRenderer.on('distraction-logged', (event, count) => callback(count)),
    onDistractionCountUpdate: (callback) => ipcRenderer.on('distraction-count-update', (event, count) => callback(count)),

    // Focus Mode - System Window Enumeration
    getOpenWindows: () => ipcRenderer.invoke('get-open-windows'),
    setFocusWindow: (windowId, windowName) => ipcRenderer.send('set-focus-window', windowId, windowName),
    disableFocusMode: () => ipcRenderer.send('disable-focus-mode')
});
