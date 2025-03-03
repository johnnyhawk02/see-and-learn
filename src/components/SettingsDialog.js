import React, { useState, useEffect } from 'react';

const SettingsDialog = ({ isOpen, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Load saved settings when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setPlayerName(settings.playerName || '');
      setSoundEnabled(settings.soundEnabled !== false); // Default to true if not set
    }
  }, []);

  // Reset status messages when dialog opens
  useEffect(() => {
    if (isOpen) {
      setGenerationSuccess(false);
      setGenerationError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Save basic settings immediately
    const settings = {
      playerName,
      soundEnabled
    };
    
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    
    // Only generate audio if name provided and changed
    const savedSettings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
    const previousName = savedSettings.previousName || '';
    
    if (playerName && playerName !== previousName) {
      try {
        setIsGenerating(true);
        setGenerationSuccess(false);
        setGenerationError('');
        
        // Generate personalized audio using gTTS
        await generatePersonalizedAudio(playerName);
        
        // Update settings with the name that now has audio
        settings.previousName = playerName;
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        
        setGenerationSuccess(true);
      } catch (error) {
        console.error('Error generating audio:', error);
        setGenerationError('Failed to generate personalized audio. Please try again later.');
      } finally {
        setIsGenerating(false);
      }
    }
    
    // Notify parent component
    onSave(settings);
  };
  
  // This function would call your backend to generate audio using gTTS
  const generatePersonalizedAudio = async (name) => {
    // This would be replaced with your actual API call
    // For demo purposes, we'll simulate a delay
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // In reality, this would make an API request to a backend
        // that uses gTTS to generate audio and returns file URLs
        console.log(`Generated audio for name: ${name}`);
        
        // Normally you'd save the returned audio URLs
        const mockAudioUrls = {
          wellDone: `/generated-audio/well-done-${name.toLowerCase()}.mp3`,
          greatJob: `/generated-audio/great-job-${name.toLowerCase()}.mp3`,
          excellent: `/generated-audio/excellent-${name.toLowerCase()}.mp3`,
          keepItUp: `/generated-audio/keep-it-up-${name.toLowerCase()}.mp3`,
        };
        
        // Store these URLs for later use
        localStorage.setItem('personalizedAudio', JSON.stringify(mockAudioUrls));
        
        resolve(mockAudioUrls);
      }, 1500); // Simulate 1.5 second delay for API call
    });
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
        
        {isGenerating && (
          <div className="mb-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-500">Generating personalized audio...</p>
          </div>
        )}
        
        {generationSuccess && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            Personalized audio generated successfully!
          </div>
        )}
        
        {generationError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {generationError}
          </div>
        )}
        
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
            disabled={isGenerating}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;