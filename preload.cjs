const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, message) => callback(message)),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
