import React, { useEffect, useState } from 'react';

interface UpdateModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSaveGame?: () => void;
  gameState?: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isVisible, onClose, onSaveGame, gameState }) => {
  const [updateStatus, setUpdateStatus] = useState<string>('Checking for updates...');
  const [updatePhase, setUpdatePhase] = useState<'checking' | 'available' | 'downloading' | 'ready' | 'error'>('checking');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (isVisible && typeof window !== 'undefined' && window.electronAPI) {
      // Listen for update status updates
      const cleanup = window.electronAPI.onUpdateStatus((message: any) => {
        if (typeof message === 'string') {
          setUpdateStatus(message);
        } else {
          handleUpdateMessage(message);
        }
      });

      // Trigger update check
      window.electronAPI.checkForUpdates();

      return cleanup;
    }
  }, [isVisible]);

  useEffect(() => {
    // Start periodic update checks when game is playing
    if (gameState === 'PLAYING' && typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.startUpdateChecks();
      return () => {
        window.electronAPI.stopUpdateChecks();
      };
    }
  }, [gameState]);

  const handleUpdateMessage = (message: { type: string; data: any }) => {
    switch (message.type) {
      case 'checking-for-update':
        setUpdateStatus('Checking for updates...');
        setUpdatePhase('checking');
        break;
      case 'update-available':
        setUpdateStatus(`Update available: ${message.data.version}`);
        setUpdatePhase('available');
        setUpdateInfo(message.data);
        break;
      case 'update-not-available':
        setUpdateStatus('You are on the latest version');
        setUpdatePhase('checking');
        setTimeout(() => onClose(), 1500);
        break;
      case 'error':
        setUpdateStatus(`Error: ${message.data}`);
        setUpdatePhase('error');
        break;
      case 'download-progress':
        setUpdateStatus(`Downloading update... ${Math.round(message.data.percent)}%`);
        setUpdatePhase('downloading');
        setDownloadProgress(message.data.percent);
        break;
      case 'update-downloaded':
        setUpdateStatus('Update downloaded and ready to install');
        setUpdatePhase('ready');
        break;
    }
  };

  const handleDownload = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      setUpdateStatus('Starting download...');
      setUpdatePhase('downloading');
      await window.electronAPI.downloadUpdate();
    }
  };

  const handleInstall = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.installUpdate();
    }
  };

  const handleSaveAndQuit = async () => {
    if (onSaveGame) {
      await onSaveGame();
    }
    handleInstall();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="text-center flex-1 flex flex-col">
          <div className="mb-4">
            {updatePhase === 'checking' && (
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto"></div>
            )}
            {updatePhase === 'available' && (
              <div className="text-yellow-500 text-5xl">⚠</div>
            )}
            {updatePhase === 'downloading' && (
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            )}
            {updatePhase === 'ready' && (
              <div className="text-green-500 text-5xl">✓</div>
            )}
            {updatePhase === 'error' && (
              <div className="text-red-500 text-5xl">✕</div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {updatePhase === 'checking' && 'Checking for Updates...'}
            {updatePhase === 'available' && 'Update Available'}
            {updatePhase === 'downloading' && 'Downloading Update...'}
            {updatePhase === 'ready' && 'Update Ready'}
            {updatePhase === 'error' && 'Update Error'}
          </h2>

          <div className="bg-gray-800 rounded-lg p-4 mb-6 flex-1 overflow-y-auto max-h-48 border border-gray-700">
            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
              {updateStatus}
            </p>
            {updateInfo && updatePhase === 'available' && (
              <div className="mt-4 text-left">
                <p className="text-gray-400 text-xs mb-2">New version: {updateInfo.version}</p>
                <p className="text-gray-400 text-xs">Release date: {new Date(updateInfo.releaseDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {updatePhase === 'available' && (
            <div className="space-y-3">
              {gameState === 'PLAYING' && (
                <button
                  onClick={handleSaveAndQuit}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Save Game & Update
                </button>
              )}
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Download Update
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Update Later
              </button>
            </div>
          )}

          {updatePhase === 'ready' && (
            <button
              onClick={handleInstall}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Install & Restart
            </button>
          )}

          {updatePhase === 'error' && (
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
