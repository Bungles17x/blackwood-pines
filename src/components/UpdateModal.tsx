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
      case 'error': {
        const raw = String(message.data || '');
        let clean = 'No updates available. You are playing the latest build.';
        if (raw.includes('net::ERR') || raw.includes('ENOTFOUND') || raw.includes('offline')) {
          clean = 'Network offline. Could not connect to the update server.';
        } else if (raw.includes('404') || raw.includes('latest.yml')) {
          clean = 'You are already running the latest version.';
        }
        setUpdateStatus(clean);
        setUpdatePhase('error');
        break;
      }
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
    await handleDownload();
    await handleInstall();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border-2 border-red-600 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col text-center font-mono">
        <div className="mb-4">
          {updatePhase === 'checking' && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          )}
          {updatePhase === 'available' && (
            <div className="text-amber-400 text-4xl">⚠</div>
          )}
          {updatePhase === 'downloading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          )}
          {updatePhase === 'ready' && (
            <div className="text-emerald-400 text-4xl">✓</div>
          )}
          {updatePhase === 'error' && (
            <div className="text-zinc-400 text-4xl">ℹ</div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mb-3">
          {updatePhase === 'checking' && 'Checking for Updates...'}
          {updatePhase === 'available' && 'Update Available'}
          {updatePhase === 'downloading' && 'Downloading Update...'}
          {updatePhase === 'ready' && 'Update Ready'}
          {updatePhase === 'error' && 'Update Status'}
        </h2>

        <div className="bg-zinc-800/80 rounded-lg p-4 mb-5 text-zinc-300 text-xs leading-relaxed border border-zinc-700">
          <p className="whitespace-pre-wrap break-words">
            {updateStatus}
          </p>
          {updateInfo && updatePhase === 'available' && (
            <div className="mt-3 text-left border-t border-zinc-700/60 pt-2 text-[11px] text-zinc-400">
              <p>New version: <span className="text-zinc-200">{updateInfo.version}</span></p>
              {updateInfo.releaseDate && (
                <p>Release date: <span className="text-zinc-200">{new Date(updateInfo.releaseDate).toLocaleDateString()}</span></p>
              )}
            </div>
          )}
        </div>

        {updatePhase === 'available' && (
          <div className="space-y-2">
            {gameState === 'PLAYING' && (
              <button
                onClick={handleSaveAndQuit}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded transition-colors text-xs uppercase tracking-wider"
              >
                Save Game & Update
              </button>
            )}
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded transition-colors text-xs uppercase tracking-wider"
            >
              Download Update
            </button>
            <button
              onClick={onClose}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors text-xs uppercase tracking-wider"
            >
              Update Later
            </button>
          </div>
        )}

        {updatePhase === 'ready' && (
          <button
            onClick={handleInstall}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded transition-colors text-xs uppercase tracking-wider"
          >
            Install & Restart
          </button>
        )}

        {(updatePhase === 'error' || updatePhase === 'checking') && (
          <button
            onClick={onClose}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors text-xs uppercase tracking-wider"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
