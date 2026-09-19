import React from 'react';

interface UpdateNotificationProps {
  isVisible: boolean;
  version?: string;
  onClick: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ isVisible, version, onClick }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <button
        onClick={onClick}
        aria-label={version ? `Update available: version ${version}` : 'Update available'}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-400 flex items-center gap-2 transition-colors"
      >
        <span className="text-xl">⚠</span>
        <span className="font-bold">{version ? `Update ${version} Available` : 'Update Available'}</span>
      </button>
    </div>
  );
};
