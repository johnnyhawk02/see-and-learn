import React, { useState, useEffect } from 'react';
import WordMatchingGame from './components/WordMatchingGame';
import SettingsDialog from './components/SettingsDialog';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import PWAStatus from './components/PWAStatus';
import './App.css';

const App = () => {
  console.log('App component rendering');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    playerName: '',
    soundEnabled: true
  });

  // Load settings on initial render
  useEffect(() => {
    console.log('Loading settings from localStorage');
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Loaded settings:', parsedSettings);
        setGameSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  // Prevent default behavior for touchmove to stop scrolling/dragging
  useEffect(() => {
    const preventDrag = (e) => {
      e.preventDefault();
    };
    
    // Add event listeners when the game is playing
    if (isPlaying) {
      document.addEventListener('touchmove', preventDrag, { passive: false });
      document.addEventListener('contextmenu', preventDrag);
    }
    
    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('touchmove', preventDrag);
      document.removeEventListener('contextmenu', preventDrag);
    };
  }, [isPlaying]);

  const startGame = () => {
    setIsPlaying(true);
  };

  const exitGame = () => {
    setIsPlaying(false);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const saveSettings = (settings) => {
    setGameSettings(settings);
    closeSettings();
  };

  const getWelcomeMessage = () => {
    if (gameSettings.playerName) {
      return `Hi ${gameSettings.playerName}! Match the word with the correct picture!`;
    }
    return 'Match the word with the correct picture!';
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center">
      {console.log('Rendering main app container, isPlaying:', isPlaying)}
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={closeSettings} 
        onSave={saveSettings} 
      />
      
      {!isPlaying ? (
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-xl w-[90%] mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-blue-600">Word Matching Game</h1>
          <p className="text-xl mb-8 text-gray-700">{getWelcomeMessage()}</p>
          <button 
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-md transform transition-transform duration-200 hover:scale-105"
          >
            Play Game
          </button>
          <div className="mt-4">
            <button 
              onClick={openSettings}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Game Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full">
          <WordMatchingGame 
            settings={{
              ...gameSettings,
              onSettingsChange: saveSettings,
              onExit: exitGame
            }} 
          />
        </div>
      )}
      
      {/* PWA components */}
      <PWAUpdateNotification />
      <PWAStatus />
    </div>
  );
};

export default App;