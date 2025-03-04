import React, { useEffect, useState } from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

const PWAUpdateNotification = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const onSWUpdate = (registration) => {
    setShowReload(true);
    setWaitingWorker(registration.waiting);
  };

  useEffect(() => {
    // Register the service worker and set up the update handler
    serviceWorkerRegistration.register({
      onUpdate: onSWUpdate,
    });
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: '#4b7bec',
        color: 'white',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
      }}
    >
      <span>New version available!</span>
      <button
        onClick={reloadPage}
        style={{
          backgroundColor: 'white',
          color: '#4b7bec',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        Update Now
      </button>
    </div>
  );
};

export default PWAUpdateNotification; 