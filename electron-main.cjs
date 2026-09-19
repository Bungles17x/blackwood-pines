const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;
let autoUpdater = null;
let updateCheckInterval = null;
let updateCheckPromise = null;
let updateDownloadPromise = null;
let updateAvailable = false;
let updateInfo = null;
let updateStatus = { type: 'idle', data: null };
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

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
  if (!app.isPackaged) {
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
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    setUpdateStatus('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true;
    updateInfo = info;
    setUpdateStatus('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    updateAvailable = false;
    updateInfo = null;
    setUpdateStatus('update-not-available');
  });

  autoUpdater.on('error', (err) => {
    const message = err ? (err.message || String(err)) : 'Unable to check for updates';
    console.warn('[AutoUpdater] Update check error:', message);
    setUpdateStatus('error', message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    setUpdateStatus('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateAvailable = true;
    updateInfo = info;
    setUpdateStatus('update-downloaded', info);
  });
}

function sendStatusToWindow(type, data = null) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', { type, data });
  }
}

function setUpdateStatus(type, data = null) {
  updateStatus = { type, data };
  sendStatusToWindow(type, data);
}

function isUpdaterEnabled() {
  return Boolean(autoUpdater && app.isPackaged);
}

function checkForUpdates() {
  if (!isUpdaterEnabled() || updateDownloadPromise || updateStatus.type === 'download-progress' || updateStatus.type === 'update-downloaded') {
    return Promise.resolve(null);
  }
  if (updateCheckPromise) return updateCheckPromise;

  updateCheckPromise = autoUpdater.checkForUpdates()
    .catch((err) => {
      console.warn('[AutoUpdater] Check failed:', err?.message || err);
      return null;
    })
    .finally(() => {
      updateCheckPromise = null;
    });

  return updateCheckPromise;
}

// Start periodic update checks (every 5 minutes during gameplay)
function startPeriodicUpdateChecks() {
  stopPeriodicUpdateChecks();

  if (isUpdaterEnabled()) {
    updateCheckInterval = setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);
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
  if (!isUpdaterEnabled()) {
    setUpdateStatus('error', 'Auto-updater is only available in an installed build');
    return null;
  }
  return checkForUpdates();
});

ipcMain.handle('download-update', async () => {
  if (!isUpdaterEnabled() || !updateAvailable) return null;
  if (updateDownloadPromise) return updateDownloadPromise;

  updateDownloadPromise = autoUpdater.downloadUpdate()
    .catch((err) => {
      console.warn('[AutoUpdater] Download failed:', err?.message || err);
      setUpdateStatus('error', err?.message || 'Unable to download update');
      return null;
    })
    .finally(() => {
      updateDownloadPromise = null;
    });

  return updateDownloadPromise;
});

ipcMain.handle('install-update', async () => {
  if (!isUpdaterEnabled() || updateStatus.type !== 'update-downloaded') return false;

  try {
    autoUpdater.quitAndInstall(false, true);
    return true;
  } catch (err) {
    console.warn('[AutoUpdater] Install failed:', err?.message || err);
    setUpdateStatus('error', err?.message || 'Unable to install update');
    return false;
  }
});

ipcMain.handle('is-update-available', async () => {
  return updateAvailable;
});

ipcMain.handle('get-update-info', async () => {
  return updateInfo;
});

ipcMain.handle('get-update-state', async () => {
  return updateStatus;
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

  if (isUpdaterEnabled() && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      void checkForUpdates();
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
