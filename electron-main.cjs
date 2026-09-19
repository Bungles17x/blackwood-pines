const { app, BrowserWindow, ipcMain } = require('electron');
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
    sendStatusToWindow('error', err);
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
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { type, data });
  }
}

// Start periodic update checks (every 5 minutes during gameplay)
function startPeriodicUpdateChecks() {
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  
  if (autoUpdater && process.env.NODE_ENV !== 'development') {
    updateCheckInterval = setInterval(() => {
      if (autoUpdater) {
        autoUpdater.checkForUpdates();
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
    autoUpdater.checkForUpdates();
  } else {
    sendStatusToWindow('error', 'Auto-updater not available');
  }
});

ipcMain.handle('download-update', async () => {
  if (autoUpdater && updateAvailable) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.handle('install-update', async () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
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

app.on('ready', () => {
  createWindow();
  // Check for updates on startup (only in production and if auto-updater is available)
  if (process.env.NODE_ENV !== 'development' && autoUpdater) {
    autoUpdater.checkForUpdates();
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
