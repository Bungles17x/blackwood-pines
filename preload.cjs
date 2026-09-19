const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onUpdateStatus: (callback) => {
    const listener = (event, message) => callback(message);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  isUpdateAvailable: () => ipcRenderer.invoke('is-update-available'),
  getUpdateInfo: () => ipcRenderer.invoke('get-update-info'),
  getUpdateState: () => ipcRenderer.invoke('get-update-state'),
  startUpdateChecks: () => ipcRenderer.invoke('start-update-checks'),
  stopUpdateChecks: () => ipcRenderer.invoke('stop-update-checks'),
  // Fullscreen controls
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  setFullscreen: (enable) => ipcRenderer.invoke('set-fullscreen', enable),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
});
