import React, { useEffect, useState } from 'react';
import type { UpdateInfo, UpdateProgress, UpdateStatus } from '../types';

interface UpdateModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSaveGame?: () => void;
  gameState?: string;
}

type UpdatePhase = 'checking' | 'up-to-date' | 'available' | 'downloading' | 'ready' | 'error';

const getErrorMessage = (value: unknown) => {
  const raw = String(value || '');
  if (raw.includes('net::ERR') || raw.includes('ENOTFOUND') || raw.includes('offline')) {
    return 'Network offline. Could not connect to the update server.';
  }
  if (raw.includes('404') || raw.includes('latest.yml')) {
    return 'The update server has no newer release available.';
  }
  return 'Unable to check for updates right now. Please try again later.';
};

const getReleaseNotes = (releaseNotes: UpdateInfo['releaseNotes']) => {
  if (typeof releaseNotes === 'string') return releaseNotes;
  if (Array.isArray(releaseNotes)) {
    return releaseNotes.map((release) => release.note).filter(Boolean).join('\n');
  }
  return '';
};

export const UpdateModal: React.FC<UpdateModalProps> = ({ isVisible, onClose, onSaveGame, gameState }) => {
  const [updateStatus, setUpdateStatus] = useState<string>('Checking for updates...');
  const [updatePhase, setUpdatePhase] = useState<UpdatePhase>('checking');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isActionPending, setIsActionPending] = useState(false);

  const handleUpdateMessage = (message: UpdateStatus) => {
    switch (message.type) {
      case 'checking-for-update':
        setUpdateStatus('Checking for updates...');
        setUpdatePhase('checking');
        break;
      case 'update-available': {
        const info = (message.data || {}) as UpdateInfo;
        setUpdateStatus(`Update available: ${info.version || 'new version'}`);
        setUpdatePhase('available');
        setUpdateInfo(info);
        break;
      }
      case 'update-not-available':
        setUpdateStatus('You are on the latest version');
        setUpdatePhase('up-to-date');
        break;
      case 'error':
        setUpdateStatus(getErrorMessage(message.data));
        setUpdatePhase('error');
        break;
      case 'download-progress': {
        const progress = (message.data || { percent: 0 }) as UpdateProgress;
        const percent = Math.max(0, Math.min(100, progress.percent || 0));
        setUpdateStatus(`Downloading update... ${Math.round(percent)}%`);
        setUpdatePhase('downloading');
        setDownloadProgress(percent);
        break;
      }
      case 'update-downloaded':
        setUpdateStatus('Update downloaded and ready to install');
        setUpdatePhase('ready');
        setDownloadProgress(100);
        break;
    }
  };

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined' || !window.electronAPI) return;

    let active = true;
    const api = window.electronAPI;
    setUpdateStatus('Checking for updates...');
    setUpdatePhase('checking');
    setUpdateInfo(null);
    setDownloadProgress(0);

    const cleanup = api.onUpdateStatus((message) => {
      if (active) handleUpdateMessage(message);
    });

    void api.getUpdateState().then((state) => {
      if (!active) return;

      if (state.type !== 'idle') handleUpdateMessage(state);
      if (state.type !== 'update-available' && state.type !== 'update-downloaded') {
        void api.checkForUpdates();
      }
    });
    void api.getUpdateInfo().then((info) => {
      if (active && info) setUpdateInfo(info);
    });

    return () => {
      active = false;
      cleanup();
    };
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


  const handleDownload = async () => {
    if (typeof window === 'undefined' || !window.electronAPI || isActionPending) return;

    setIsActionPending(true);
    setUpdateStatus('Starting download...');
    setUpdatePhase('downloading');
    try {
      await window.electronAPI.downloadUpdate();
    } finally {
      setIsActionPending(false);
    }
  };

  const handleInstall = async () => {
    if (typeof window === 'undefined' || !window.electronAPI || isActionPending) return;

    setIsActionPending(true);
    try {
      await window.electronAPI.installUpdate();
    } finally {
      setIsActionPending(false);
    }
  };

  const handleSaveAndQuit = async () => {
    if (isActionPending) return;

    setIsActionPending(true);
    try {
      if (onSaveGame) await onSaveGame();
      if (typeof window !== 'undefined' && window.electronAPI) {
        setUpdateStatus('Downloading update...');
        setUpdatePhase('downloading');
        await window.electronAPI.downloadUpdate();
        await window.electronAPI.installUpdate();
      }
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRetry = () => {
    if (typeof window !== 'undefined' && window.electronAPI && !isActionPending) {
      setUpdateStatus('Checking for updates...');
      setUpdatePhase('checking');
      void window.electronAPI.checkForUpdates();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border-2 border-red-600 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col text-center font-mono">
        <div className="mb-4">
          {(updatePhase === 'checking' || updatePhase === 'downloading') && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          )}
          {updatePhase === 'available' && (
            <div className="text-amber-400 text-4xl">⚠</div>
          )}

          {updatePhase === 'ready' && (
            <div className="text-emerald-400 text-4xl">✓</div>
          )}
          {updatePhase === 'up-to-date' && (
            <div className="text-emerald-400 text-4xl">✓</div>
          )}
          {updatePhase === 'error' && (
            <div className="text-zinc-400 text-4xl">ℹ</div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mb-3">
          {updatePhase === 'checking' && 'Checking for Updates...'}
          {updatePhase === 'up-to-date' && 'You’re Up to Date'}
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
              {getReleaseNotes(updateInfo.releaseNotes) && (
                <p className="mt-2 whitespace-pre-wrap">{getReleaseNotes(updateInfo.releaseNotes)}</p>
              )}
            </div>
          )}
        </div>

        {updatePhase === 'downloading' && (
          <div className="mb-5 text-left">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>Download progress</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-700 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={downloadProgress}>
              <div className="h-full bg-blue-500 transition-[width] duration-200" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        )}

        {updatePhase === 'available' && (
          <div className="space-y-2">
            {gameState === 'PLAYING' && (
              <button
                onClick={handleSaveAndQuit}
                disabled={isActionPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded transition-colors text-xs uppercase tracking-wider"
              >
                Save Game & Update
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={isActionPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded transition-colors text-xs uppercase tracking-wider"
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

        {updatePhase === 'error' && (
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              disabled={isActionPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors text-xs uppercase tracking-wider"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors text-xs uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        )}

        {(updatePhase === 'up-to-date' || updatePhase === 'checking') && (
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
