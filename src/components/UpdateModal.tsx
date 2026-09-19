import React, { useEffect, useState } from 'react';

interface UpdateModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isVisible, onClose }) => {
  const [updateStatus, setUpdateStatus] = useState<string>('Checking for updates...');
  const [isUpdating, setIsUpdating] = useState<boolean>(true);

  useEffect(() => {
    if (isVisible && typeof window !== 'undefined' && window.electronAPI) {
      // Listen for update status updates
      const cleanup = window.electronAPI.onUpdateStatus((message: string) => {
        setUpdateStatus(message);
        
        // Hide modal if update is complete or not available
        if (message.includes('Update not available') || message.includes('Update downloaded')) {
          setTimeout(() => {
            setIsUpdating(false);
            if (message.includes('Update not available')) {
              onClose();
            }
          }, 2000);
        }
      });

      // Trigger update check
      window.electronAPI.checkForUpdates();

      return cleanup;
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            {isUpdating ? (
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto"></div>
            ) : (
              <div className="text-green-500 text-5xl">✓</div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {isUpdating ? 'Updating Blackwood Pines...' : 'Update Complete'}
          </h2>
          
          <p className="text-gray-300 mb-6 text-lg">
            {updateStatus}
          </p>
          
          {!isUpdating && (
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Continue to Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
