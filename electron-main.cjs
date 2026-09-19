const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;
let autoUpdater = null;
let updateCheckInterval = null;
let updateAvailable = false;
let updateInfo = null;

// Try to load electron-updater, but don't fail if it's not available
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (err) {
  console.log('electron-updater not available, auto-updates disabled');
}

function createWindow() {
  // Remove the native application menu (File/Edit/View/Window bar)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets', 'icon.png') // Optional: Add an icon file
  });

  // Load the game
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-updater configuration and events (only if available)
if (autoUpdater) {
  // Feed URL is automatically configured by electron-builder from package.json publish config
  autoUpdater.autoDownload = false; // Don't auto-download, let user choose

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true;
    updateInfo = info;
    sendStatusToWindow('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    updateAvailable = false;
    sendStatusToWindow('update-not-available');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Update check error (ignored gracefully):', err ? (err.message || err) : 'Unknown error');
    // Silently log or send simplified message without disruptive modal
    sendStatusToWindow('error', err ? (err.message || String(err)) : 'Unable to check for updates');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('update-downloaded', info);
  });
}

function sendStatusToWindow(type, data) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', { type, data });
  }
}

// Start periodic update checks (every 5 minutes during gameplay)
function startPeriodicUpdateChecks() {
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  
  if (autoUpdater && process.env.NODE_ENV !== 'development') {
    updateCheckInterval = setInterval(() => {
      if (autoUpdater) {
        autoUpdater.checkForUpdates().catch((err) => {
          console.warn('[AutoUpdater] Periodic check failed:', err?.message || err);
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

function stopPeriodicUpdateChecks() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}

// IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (autoUpdater) {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      console.warn('[AutoUpdater] Check for updates failed:', err?.message || err);
    }
  } else {
    sendStatusToWindow('error', 'Auto-updater not available');
  }
});

ipcMain.handle('download-update', async () => {
  if (autoUpdater && updateAvailable) {
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      console.warn('[AutoUpdater] Download failed:', err?.message || err);
    }
  }
});

ipcMain.handle('install-update', async () => {
  if (autoUpdater) {
    try {
      autoUpdater.quitAndInstall();
    } catch (err) {
      console.warn('[AutoUpdater] Install failed:', err?.message || err);
    }
  }
});

ipcMain.handle('is-update-available', async () => {
  return updateAvailable;
});

ipcMain.handle('get-update-info', async () => {
  return updateInfo;
});

ipcMain.handle('start-update-checks', async () => {
  startPeriodicUpdateChecks();
});

ipcMain.handle('stop-update-checks', async () => {
  stopPeriodicUpdateChecks();
});

// Fullscreen IPC handlers
ipcMain.handle('toggle-fullscreen', async () => {
  if (mainWindow) {
    const isFullscreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullscreen);
    return !isFullscreen;
  }
  return false;
});

ipcMain.handle('set-fullscreen', async (event, enable) => {
  if (mainWindow) {
    mainWindow.setFullScreen(enable);
    return enable;
  }
  return false;
});

ipcMain.handle('is-fullscreen', async () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

app.on('ready', () => {
  createWindow();
  // Check for updates on startup (only in production and if auto-updater is available)
  if (process.env.NODE_ENV !== 'development' && autoUpdater) {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[AutoUpdater] Startup check failed:', err?.message || err);
    });
  }
});

app.on('window-all-closed', () => {
  stopPeriodicUpdateChecks();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
