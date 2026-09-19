const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let autoUpdater = null;

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

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available: ' + info.version);
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available. Current version: ' + app.getVersion());
  });

  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater: ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded. Will install now...');
    autoUpdater.quitAndInstall();
  });
}

function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
  if (autoUpdater) {
    autoUpdater.checkForUpdates();
  } else {
    sendStatusToWindow('Auto-updater not available');
  }
});

app.on('ready', () => {
  createWindow();
  // Check for updates on startup (only in production and if auto-updater is available)
  if (process.env.NODE_ENV !== 'development' && autoUpdater) {
    autoUpdater.checkForUpdates();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
