import React, { useState, useEffect } from 'react';
import { allPairs } from '../data/gameData';

const SettingsDialog = ({ isOpen, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [numChoices, setNumChoices] = useState(4);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Load saved settings when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setPlayerName(settings.playerName || '');
      setSoundEnabled(settings.soundEnabled !== false);
      setNumChoices(settings.numChoices || 4);
    }
  }, []);

  const handleSave = () => {
    const settings = {
      playerName,
      soundEnabled,
      numChoices
    };
    
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    onSave(settings);
  };

  const preloadResources = async () => {
    setIsPreloading(true);
    setPreloadProgress(0);
    
    const totalResources = allPairs.length * 2 + 20; // Images + audio + praise sounds
    let loadedResources = 0;
    
    try {
      // Preload all images
      const imagePromises = allPairs.map(pair => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            loadedResources++;
            setPreloadProgress(Math.round((loadedResources / totalResources) * 100));
            resolve();
          };
          img.onerror = (error) => {
            console.error(`Error loading image: ${pair.image}`, error);
            reject(error);
          };
          // Use the direct path from public folder
          img.src = `/${pair.image}`;
        });
      });

      // Preload all word audio
      const wordAudioPromises = allPairs.map(pair => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(`/sounds/vocabulary/${pair.word}.wav`);
          audio.oncanplaythrough = () => {
            loadedResources++;
            setPreloadProgress(Math.round((loadedResources / totalResources) * 100));
            resolve();
          };
          audio.onerror = (error) => {
            console.error(`Error loading audio: /sounds/vocabulary/${pair.word}.wav`, error);
            reject(error);
          };
        });
      });

      // Preload praise audio
      const praiseAudioPromises = Array.from({ length: 20 }, (_, i) => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(`/sounds/praise/praise${String(i + 1).padStart(2, '0')}.wav`);
          audio.oncanplaythrough = () => {
            loadedResources++;
            setPreloadProgress(Math.round((loadedResources / totalResources) * 100));
            resolve();
          };
          audio.onerror = (error) => {
            console.error(`Error loading praise audio: /sounds/praise/praise${String(i + 1).padStart(2, '0')}.wav`, error);
            reject(error);
          };
        });
      });

      // Wait for all resources to load
      await Promise.all([
        ...imagePromises,
        ...wordAudioPromises,
        ...praiseAudioPromises
      ]);

      // Cache success status
      localStorage.setItem('resourcesPreloaded', 'true');
      
      alert('All resources have been preloaded successfully!');
    } catch (error) {
      console.error('Error preloading resources:', error);
      alert('There was an error preloading some resources. Please try again.');
    } finally {
      setIsPreloading(false);
      setPreloadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Game Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="playerName">
            Player Name
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your name"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll use this to personalize your game experience
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Number of Choices
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={numChoices === 4}
                onChange={() => setNumChoices(4)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">4 Choices (Easier)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={numChoices === 6}
                onChange={() => setNumChoices(6)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">6 Choices (Harder)</span>
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Enable Sound</span>
          </label>
        </div>

        <div className="mb-6">
          <button
            onClick={preloadResources}
            disabled={isPreloading}
            className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded ${isPreloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPreloading ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">Preloading... {preloadProgress}%</span>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            ) : (
              'Preload All Resources for Offline Use'
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            This will download all images and sounds for offline use
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;