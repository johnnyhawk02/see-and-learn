import React, { useState, useEffect } from 'react';

const PWAStatus = () => {
  console.log('PWAStatus component rendering');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    try {
      // Check if already installed as PWA
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        console.log('App is running in standalone mode');
        setIsStandalone(true);
      }

      // Listen for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e) => {
        console.log('Received beforeinstallprompt event');
        // Prevent Chrome 76+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setInstallPrompt(e);
      };

      // Listen for app installed event
      const handleAppInstalled = () => {
        console.log('PWA was installed');
        setInstallPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    } catch (error) {
      console.error('Error in PWAStatus component:', error);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
  };

  if (isStandalone) {
    return null; // Don't show anything if already in standalone mode
  }

  if (!installPrompt) {
    return null; // Don't show if not installable
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        backgroundColor: '#4b7bec',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 9000,
        maxWidth: '300px',
      }}
    >
      <div style={{ marginRight: '12px' }}>
        <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
          Install App
        </span>
        <span style={{ fontSize: '0.8rem' }}>
          Install for a better experience
        </span>
      </div>
      <button
        onClick={handleInstallClick}
        style={{
          backgroundColor: 'white',
          color: '#4b7bec',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Install
      </button>
    </div>
  );
};

export default PWAStatus; 