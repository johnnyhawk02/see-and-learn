import React, { useState, useEffect } from 'react';
import { allPairs } from '../data/gameData';

const SettingsDialog = ({ isOpen, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [numChoices, setNumChoices] = useState(4);
  const [showWordsOnCards, setShowWordsOnCards] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // States for individual resource loading
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [resourceList, setResourceList] = useState([]);
  const [currentResource, setCurrentResource] = useState(null);
  const [isLoadingIndividual, setIsLoadingIndividual] = useState(false);

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
    
    // Generate the resource list for individual loading
    generateResourceList();
  }, []);
  
  // Generate the complete resource list
  const generateResourceList = () => {
    // First, add all images
    const imageResources = allPairs.map(pair => ({
      type: 'image',
      path: `/${pair.image}`,
      name: pair.word,
      loaded: false
    }));
    
    // Then add all vocabulary audio
    const wordAudioResources = allPairs.map(pair => ({
      type: 'audio',
      path: `/sounds/vocabulary/${pair.word}.wav`,
      name: pair.word,
      loaded: false
    }));
    
    // Finally add all praise audio
    const praiseAudioResources = Array.from({ length: 20 }, (_, i) => ({
      type: 'audio',
      path: `/sounds/praise/praise${String(i + 1).padStart(2, '0')}.wav`,
      name: `Praise ${i + 1}`,
      loaded: false
    }));
    
    // Combine all resources into one list
    const allResources = [
      ...imageResources,
      ...wordAudioResources, 
      ...praiseAudioResources
    ];
    
    setResourceList(allResources);
    setCurrentResource(allResources[0]);
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

  // Load a single resource based on current index
  const loadSingleResource = () => {
    if (currentResourceIndex >= resourceList.length) {
      // All resources loaded
      setIsLoadingIndividual(false);
      localStorage.setItem('resourcesPreloaded', 'true');
      alert('All resources have been preloaded successfully!');
      return;
    }
    
    setIsLoadingIndividual(true);
    const resource = resourceList[currentResourceIndex];
    setCurrentResource(resource);
    
    if (resource.type === 'image') {
      const img = new Image();
      img.onload = () => {
        handleResourceLoaded();
      };
      img.onerror = (error) => {
        console.error(`Error loading image: ${resource.path}`, error);
        handleResourceLoaded();
      };
      img.src = resource.path;
    } else if (resource.type === 'audio') {
      const audio = new Audio();
      
      // For iOS compatibility, we need to play a short sound
      audio.oncanplaythrough = () => {
        // Play a tiny bit of audio to register it with iOS
        try {
          audio.volume = 0.01; // Very low volume
          audio.play()
            .then(() => {
              // Quickly pause after a short time
              setTimeout(() => {
                audio.pause();
                handleResourceLoaded();
              }, 50);
            })
            .catch((err) => {
              console.error('Error playing audio:', err);
              handleResourceLoaded();
            });
        } catch (error) {
          console.error('Error with audio playback:', error);
          handleResourceLoaded();
        }
      };
      
      audio.onerror = (error) => {
        console.error(`Error loading audio: ${resource.path}`, error);
        handleResourceLoaded();
      };
      
      audio.src = resource.path;
    }
  };
  
  // Called when a resource finishes loading
  const handleResourceLoaded = () => {
    // Mark current resource as loaded
    const updatedList = [...resourceList];
    updatedList[currentResourceIndex].loaded = true;
    setResourceList(updatedList);
    
    // Increment counters
    setLoadedCount(prevCount => prevCount + 1);
    setCurrentResourceIndex(prevIndex => prevIndex + 1);
    
    // Set next resource
    if (currentResourceIndex + 1 < resourceList.length) {
      setCurrentResource(resourceList[currentResourceIndex + 1]);
    }
    
    // Reset loading state so button is clickable again
    setIsLoadingIndividual(false);
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
            This will download all images and sounds for offline use
          </p>
        </div>
        
        {/* Individual resource loading - iOS friendly */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">iOS Friendly Resource Loading</h3>
          
          <div className="mb-2 p-2 border rounded bg-gray-50">
            <div className="flex justify-between mb-1">
              <span className="font-medium">Progress:</span>
              <span>{loadedCount} / {resourceList.length} resources</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${resourceList.length > 0 ? (loadedCount / resourceList.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mb-3 p-2 border rounded bg-blue-50">
            <p className="text-sm">
              <strong>Current Resource:</strong> {currentResource ? (
                <>
                  {currentResource.type === 'image' ? '🖼️' : '🔊'} {currentResource.name}
                </>
              ) : 'Ready to start'}
            </p>
          </div>
          
          <button
            onClick={loadSingleResource}
            disabled={isLoadingIndividual}
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded ${isLoadingIndividual ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoadingIndividual ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">Loading...</span>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            ) : (
              currentResourceIndex >= resourceList.length ?
              'All Resources Loaded!' :
              'Tap to Load Next Resource'
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            For iOS devices: Press this button repeatedly to load one resource at a time
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
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;