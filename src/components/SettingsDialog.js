import React, { useState, useEffect } from 'react';
import { allPairs } from '../data/gameData';

const SettingsDialog = ({ isOpen, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [numChoices, setNumChoices] = useState(4);
  const [showWordsOnCards, setShowWordsOnCards] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // States for visual resource loading
  const [loadingMode, setLoadingMode] = useState('none'); // 'none', 'images', 'audio'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalResources, setTotalResources] = useState(0);
  const [currentResource, setCurrentResource] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio states
  const [audioSources, setAudioSources] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Load saved settings when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setPlayerName(settings.playerName || '');
      setSoundEnabled(settings.soundEnabled !== false);
      // Ensure we only use 2 or 4 choices
      const savedChoices = settings.numChoices || 4;
      setNumChoices(savedChoices === 2 ? 2 : 4);
      setShowWordsOnCards(settings.showWordsOnCards !== false);
    }
    
    // Prepare audio sources
    prepareAudioSources();
  }, []);
  
  // Prepare the list of audio files
  const prepareAudioSources = () => {
    // Vocabulary audio
    const wordAudioSources = allPairs.map(pair => ({
      type: 'word',
      path: `/sounds/vocabulary/${pair.word}.wav`,
      name: pair.word
    }));
    
    // Praise audio
    const praiseAudioSources = Array.from({ length: 20 }, (_, i) => ({
      type: 'praise',
      path: `/sounds/praise/praise${String(i + 1).padStart(2, '0')}.wav`,
      name: `Praise ${i + 1}`
    }));
    
    // Set audio sources and total resources
    const allAudioSources = [...wordAudioSources, ...praiseAudioSources];
    setAudioSources(allAudioSources);
    setTotalResources(allPairs.length + allAudioSources.length);
  };

  const handleSave = () => {
    const settings = {
      playerName,
      soundEnabled,
      numChoices,
      showWordsOnCards,
    };
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  // Start image loading mode
  const startImageLoading = () => {
    setLoadingMode('images');
    setCurrentIndex(0);
    setLoadedCount(0);
    setCurrentResource(allPairs[0]);
    setIsLoading(false);
  };
  
  // Start audio loading mode
  const startAudioLoading = () => {
    setLoadingMode('audio');
    setCurrentIndex(0);
    setCurrentResource(audioSources[0]);
    setIsPlaying(false);
  };
  
  // Handle image loaded event
  const handleImageLoaded = () => {
    const newIndex = currentIndex + 1;
    setLoadedCount(prevCount => prevCount + 1);
    
    if (newIndex < allPairs.length) {
      setCurrentIndex(newIndex);
      setCurrentResource(allPairs[newIndex]);
    } else {
      // All images loaded, prompt for audio
      alert('All images have been viewed! Next, we will play each sound to ensure they are loaded.');
      startAudioLoading();
    }
  };
  
  // Handle playing the current audio
  const playCurrentAudio = () => {
    if (isPlaying || currentIndex >= audioSources.length) return;
    
    setIsPlaying(true);
    const audio = new Audio(audioSources[currentIndex].path);
    setCurrentAudio(audio);
    
    audio.onended = () => {
      setIsPlaying(false);
      setLoadedCount(prevCount => prevCount + 1);
      
      // Move to next audio
      const newIndex = currentIndex + 1;
      if (newIndex < audioSources.length) {
        setCurrentIndex(newIndex);
        setCurrentResource(audioSources[newIndex]);
      } else {
        // All audio played
        setCurrentAudio(null);
        alert('All resources have been loaded! You can now use the app offline.');
        localStorage.setItem('resourcesPreloaded', 'true');
      }
    };
    
    audio.onerror = (error) => {
      console.error(`Error playing audio: ${audioSources[currentIndex].path}`, error);
      setIsPlaying(false);
      
      // Move to next audio even if there was an error
      const newIndex = currentIndex + 1;
      setLoadedCount(prevCount => prevCount + 1);
      
      if (newIndex < audioSources.length) {
        setCurrentIndex(newIndex);
        setCurrentResource(audioSources[newIndex]);
      } else {
        setCurrentAudio(null);
        alert('All resources have been loaded! You can now use the app offline.');
        localStorage.setItem('resourcesPreloaded', 'true');
      }
    };
    
    // Play with lowered volume for testing
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error starting audio playback:', error);
      setIsPlaying(false);
    });
  };
  
  // Handle stopping the current audio
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const preloadResources = async () => {
    setIsPreloading(true);
    setPreloadProgress(0);
    
    const totalResources = allPairs.length * 2 + 20; // Images + audio + praise sounds
    let loadedResources = 0;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const AUDIO_TIMEOUT = 5000; // 5 seconds timeout for audio loading
    
    // Helper function to update progress
    const updateProgress = () => {
      loadedResources++;
      const percentage = Math.round((loadedResources / totalResources) * 100);
      setPreloadProgress(percentage);
      console.log(`Preloading progress: ${percentage}%`);
    };
    
    try {
      // Preload all images
      const imagePromises = allPairs.map(pair => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            updateProgress();
            resolve();
          };
          img.onerror = (error) => {
            console.error(`Error loading image: ${pair.image}`, error);
            updateProgress(); // Still increment to avoid getting stuck
            resolve(); // Resolve anyway to continue preloading
          };
          // Use the direct path from public folder
          img.src = `/${pair.image}`;
        });
      });

      // Preload all word audio - with timeout for mobile
      const wordAudioPromises = allPairs.map(pair => {
        return new Promise((resolve) => {
          const audio = new Audio();
          
          // Safety timeout for mobile devices
          const timeoutId = setTimeout(() => {
            console.log(`Audio timeout for word: ${pair.word}`);
            updateProgress();
            resolve();
          }, AUDIO_TIMEOUT);
          
          audio.oncanplaythrough = () => {
            clearTimeout(timeoutId);
            updateProgress();
            resolve();
          };
          
          audio.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error(`Error loading audio: /sounds/vocabulary/${pair.word}.wav`, error);
            updateProgress(); // Still increment to avoid getting stuck
            resolve(); // Resolve anyway to continue preloading
          };
          
          // For mobile: preload as blob first for better reliability
          if (isMobile) {
            fetch(`/sounds/vocabulary/${pair.word}.wav`)
              .then(response => response.blob())
              .then(blob => {
                audio.src = URL.createObjectURL(blob);
              })
              .catch(() => {
                audio.src = `/sounds/vocabulary/${pair.word}.wav`;
              });
          } else {
            audio.src = `/sounds/vocabulary/${pair.word}.wav`;
          }
        });
      });

      // Preload praise audio - with timeout for mobile
      const praiseAudioPromises = Array.from({ length: 20 }, (_, i) => {
        return new Promise((resolve) => {
          const audio = new Audio();
          const praiseFile = `/sounds/praise/praise${String(i + 1).padStart(2, '0')}.wav`;
          
          // Safety timeout for mobile devices
          const timeoutId = setTimeout(() => {
            console.log(`Audio timeout for praise: ${i + 1}`);
            updateProgress();
            resolve();
          }, AUDIO_TIMEOUT);
          
          audio.oncanplaythrough = () => {
            clearTimeout(timeoutId);
            updateProgress();
            resolve();
          };
          
          audio.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error(`Error loading praise audio: ${praiseFile}`, error);
            updateProgress(); // Still increment to avoid getting stuck
            resolve(); // Resolve anyway to continue preloading
          };
          
          // For mobile: preload as blob first for better reliability
          if (isMobile) {
            fetch(praiseFile)
              .then(response => response.blob())
              .then(blob => {
                audio.src = URL.createObjectURL(blob);
              })
              .catch(() => {
                audio.src = praiseFile;
              });
          } else {
            audio.src = praiseFile;
          }
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

  // Render the visual loading interface based on mode
  const renderLoadingInterface = () => {
    if (loadingMode === 'none') {
      return (
        <div className="text-center py-4">
          <h3 className="text-md font-semibold mb-3">iOS Friendly Resource Loading</h3>
          <p className="mb-4 text-sm">For iPads and iOS devices, use this method to ensure all resources are loaded:</p>
          
          <button
            onClick={startImageLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded mb-3"
          >
            Step 1: Load Images One-by-One
          </button>
          
          <p className="text-xs text-gray-500 mb-4">
            You'll see each image and can tap "Next" to continue
          </p>
          
          <button
            onClick={startAudioLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded"
          >
            Step 2: Play Sounds One-by-One
          </button>
          
          <p className="text-xs text-gray-500 mt-1">
            You'll hear each sound and can tap "Next" to continue
          </p>
        </div>
      );
    } else if (loadingMode === 'images') {
      // Image loading interface
      return (
        <div className="text-center py-2">
          <h3 className="text-md font-semibold mb-2">Loading Images</h3>
          
          <div className="mb-2 p-2 border rounded bg-gray-50">
            <div className="flex justify-between mb-1">
              <span className="font-medium">Progress:</span>
              <span>{loadedCount} / {allPairs.length} images</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(loadedCount / allPairs.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Display current image */}
          {currentResource && (
            <div className="mb-3 p-2 border rounded">
              <p className="mb-2 text-sm font-medium">{currentResource.word}</p>
              <div className="flex justify-center mb-3">
                <img 
                  src={`/${currentResource.image}`} 
                  alt={currentResource.word}
                  className="h-48 object-contain border rounded"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>
              
              <button
                onClick={handleImageLoaded}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
              >
                Next Image
              </button>
            </div>
          )}
        </div>
      );
    } else if (loadingMode === 'audio') {
      // Audio loading interface
      return (
        <div className="text-center py-2">
          <h3 className="text-md font-semibold mb-2">Loading Sounds</h3>
          
          <div className="mb-2 p-2 border rounded bg-gray-50">
            <div className="flex justify-between mb-1">
              <span className="font-medium">Progress:</span>
              <span>{loadedCount - allPairs.length} / {audioSources.length} sounds</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${((loadedCount - allPairs.length) / audioSources.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Display current audio info */}
          {currentResource && currentIndex < audioSources.length && (
            <div className="mb-3 p-3 border rounded bg-purple-50">
              <p className="mb-2 text-sm font-medium">
                {currentResource.type === 'word' ? '🔤' : '🎉'} {currentResource.name}
              </p>
              
              <div className="flex justify-center space-x-3 mt-3">
                {!isPlaying ? (
                  <button
                    onClick={playCurrentAudio}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded"
                  >
                    Play Sound
                  </button>
                ) : (
                  <button
                    onClick={stopCurrentAudio}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded"
                  >
                    Stop
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Each sound must be played to ensure it's loaded
              </p>
            </div>
          )}
          
          {currentIndex >= audioSources.length && (
            <div className="mb-3 p-3 border rounded bg-green-50">
              <p className="text-green-600 font-bold mb-2">All resources loaded successfully!</p>
              <button
                onClick={() => setLoadingMode('none')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
              >
                Done
              </button>
            </div>
          )}
        </div>
      );
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
            Standard preloading (works best on desktop)
          </p>
        </div>
        
        {/* iOS friendly visual resource loader */}
        <div className="mb-6 border rounded p-3 bg-gray-50">
          {renderLoadingInterface()}
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
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;