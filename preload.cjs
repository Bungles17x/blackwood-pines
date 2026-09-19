const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, message) => callback(message)),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  isUpdateAvailable: () => ipcRenderer.invoke('is-update-available'),
  getUpdateInfo: () => ipcRenderer.invoke('get-update-info'),
  startUpdateChecks: () => ipcRenderer.invoke('start-update-checks'),
  stopUpdateChecks: () => ipcRenderer.invoke('stop-update-checks')
});
