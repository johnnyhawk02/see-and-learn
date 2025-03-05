import React, { useState, useEffect } from 'react';
import { allPairs } from '../data/gameData';

const SettingsDialog = ({ isOpen, onClose, onSave }) => {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [numChoices, setNumChoices] = useState(4);
  const [showWordsOnCards, setShowWordsOnCards] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // Device detection states
  const [isIPadDevice, setIsIPadDevice] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // States for visual resource loading
  const [loadingMode, setLoadingMode] = useState('none'); // 'none', 'images', 'audio'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalResources, setTotalResources] = useState(0);
  const [currentResource, setCurrentResource] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug logging state
  const [logMessages, setLogMessages] = useState([]);
  
  // Cache status tracking
  const [cachedItems, setCachedItems] = useState({});
  
  // Audio states
  const [audioSources, setAudioSources] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Constants
  const CACHE_NAME = 'see-and-learn-resources-v1';
  
  // Log function for debugging
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
    console.log(`[SettingsDialog] ${message}`);
  };

  // Detect device type on mount
  useEffect(() => {
    const checkDeviceType = () => {
      // Check for iPad specifically
      const isIPad = /iPad/i.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && window.innerWidth >= 768 && window.innerWidth <= 1024);
      
      // Check for mobile phones (iPhone, Android phones)
      const isMobile = /iPhone|Android/i.test(navigator.userAgent) && window.innerWidth <= 480;
      
      setIsIPadDevice(isIPad);
      setIsMobileDevice(isMobile);
      
      console.log(`Device detection: iPad=${isIPad}, Mobile=${isMobile}`);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Load saved settings when component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setPlayerName(settings.playerName || '');
      setSoundEnabled(settings.soundEnabled !== false);
      
      // Ensure the number of choices is appropriate for the device
      let savedChoices = settings.numChoices || 4;
      
      // For iPad, only allow 2 or 4 choices
      if (isIPadDevice) {
        savedChoices = savedChoices <= 2 ? 2 : 4;
      } 
      // For mobile, allow 2, 4, or 6 choices
      else if (isMobileDevice) {
        if (savedChoices <= 2) savedChoices = 2;
        else if (savedChoices <= 4) savedChoices = 4;
        else savedChoices = 6;
      }
      // For desktop, default to 4
      else {
        savedChoices = savedChoices === 2 ? 2 : 4;
      }
      
      setNumChoices(savedChoices);
      setShowWordsOnCards(settings.showWordsOnCards !== false);
    }
    
    // Prepare audio sources
    prepareAudioSources();
    
    // Check which resources are already cached
    checkCachedResources();
  }, [isIPadDevice, isMobileDevice]);
  
  // Check which resources are already in the cache
  const checkCachedResources = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const cachedUrls = keys.map(request => request.url);
      
      addLog(`Found ${cachedUrls.length} items in cache`);
      
      // Create a map of cached status
      const cachedStatus = {};
      
      // Check images
      for (const pair of allPairs) {
        const imageUrl = `${window.location.origin}/${pair.image}`;
        cachedStatus[imageUrl] = cachedUrls.includes(imageUrl);
      }
      
      // Check vocabulary audio (now using .mp3)
      for (const pair of allPairs) {
        const audioUrl = `${window.location.origin}/sounds/vocabulary/${pair.word}.mp3`;
        cachedStatus[audioUrl] = cachedUrls.includes(audioUrl);
      }
      
      // Check praise audio (now using .mp3)
      for (let i = 1; i <= 20; i++) {
        const praiseFile = `/sounds/praise/praise${String(i).padStart(2, '0')}.mp3`;
        const audioUrl = `${window.location.origin}${praiseFile}`;
        cachedStatus[audioUrl] = cachedUrls.includes(audioUrl);
      }
      
      setCachedItems(cachedStatus);
      
      // Count total cached
      const totalCached = Object.values(cachedStatus).filter(Boolean).length;
      addLog(`${totalCached} resources are already cached for offline use`);
      
    } catch (error) {
      addLog(`Error checking cache: ${error.message}`);
    }
  };
  
  // Prepare audio sources
  const prepareAudioSources = () => {
    // Get all vocabulary audio files from allPairs
    const vocabularyAudio = allPairs.map(pair => ({
      type: 'vocabulary',
      name: pair.word,
      path: `/sounds/vocabulary/${pair.word}.mp3`,
      fullPath: `${window.location.origin}/sounds/vocabulary/${pair.word}.mp3`
    }));
    
    // Get praise audio files
    const praiseAudio = Array.from({ length: 20 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        type: 'praise',
        name: `praise${num}`,
        path: `/sounds/praise/praise${num}.mp3`,
        fullPath: `${window.location.origin}/sounds/praise/praise${num}.mp3`
      };
    });
    
    // Add sound effects
    const soundEffects = [
      {
        type: 'effect',
        name: 'clapping',
        path: '/sounds/clapping.mp3',
        fullPath: `${window.location.origin}/sounds/clapping.mp3`
      },
      {
        type: 'effect',
        name: 'wrong',
        path: '/sounds/wrong.mp3',
        fullPath: `${window.location.origin}/sounds/wrong.mp3`
      },
      {
        type: 'effect',
        name: 'silent',
        path: '/sounds/silent.mp3',
        fullPath: `${window.location.origin}/sounds/silent.mp3`
      }
    ];
    
    // Combine all audio sources
    setAudioSources([...vocabularyAudio, ...praiseAudio, ...soundEffects]);
    
    // Check for iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
    if (isIOS) {
      // Add a touch event listener to initialize audio on iOS
      const initIOSAudio = () => {
        console.log("Initializing iOS audio");
        const silentAudio = new Audio('/sounds/silent.mp3');
        silentAudio.play().catch(err => console.log("Silent audio init error:", err));
        document.removeEventListener('touchstart', initIOSAudio);
      };
      
      document.addEventListener('touchstart', initIOSAudio);
    }
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

  // Manually cache a resource using Cache API
  const cacheResource = async (url) => {
    if (!('caches' in window)) {
      addLog('Cache API not available');
      return false;
    }
    
    try {
      addLog(`Caching resource: ${url}`);
      const cache = await caches.open(CACHE_NAME);
      
      // Fetch with cache busting query parameter to ensure we get a fresh copy
      const fetchResponse = await fetch(`${url}?nocache=${Date.now()}`);
      
      if (!fetchResponse.ok) {
        addLog(`Failed to fetch resource: ${url} (${fetchResponse.status})`);
        return false;
      }
      
      // Clone the response before using it
      const responseClone = fetchResponse.clone();
      
      // Store the original URL in the cache (without the cache busting parameter)
      await cache.put(url, responseClone);
      
      // Update cached items status
      setCachedItems(prev => ({
        ...prev,
        [url]: true
      }));
      
      addLog(`Successfully cached: ${url}`);
      return true;
    } catch (error) {
      addLog(`Error caching resource: ${error.message}`);
      return false;
    }
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
  const handleImageLoaded = async () => {
    // Cache the current image
    const imageUrl = `${window.location.origin}/${currentResource.image}`;
    const success = await cacheResource(imageUrl);
    
    if (success) {
      addLog(`Cached image for: ${currentResource.word}`);
    }
    
    const newIndex = currentIndex + 1;
    setLoadedCount(prevCount => prevCount + 1);
    
    if (newIndex < allPairs.length) {
      setCurrentIndex(newIndex);
      setCurrentResource(allPairs[newIndex]);
    } else {
      // All images loaded, prompt for audio
      addLog('All images have been processed');
      alert('All images have been cached! Next, we will play each sound to ensure they are loaded.');
      startAudioLoading();
    }
  };
  
  // Handle playing the current audio
  const playCurrentAudio = async () => {
    if (isPlaying || currentIndex >= audioSources.length) return;
    
    setIsPlaying(true);
    const audioSource = audioSources[currentIndex];
    const audio = new Audio(audioSource.path);
    setCurrentAudio(audio);
    
    // Attempt to cache the audio file first
    const audioUrl = audioSource.fullPath;
    const success = await cacheResource(audioUrl);
    
    if (success) {
      addLog(`Cached audio for: ${audioSource.name}`);
    }
    
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
        addLog('All audio files have been processed');
        
        // Verify cache status
        checkCachedResources().then(() => {
          alert('All resources have been cached! You can now use the app offline.');
          localStorage.setItem('resourcesPreloaded', 'true');
        });
      }
    };
    
    audio.onerror = (error) => {
      console.error(`Error playing audio: ${audioSource.path}`, error);
      addLog(`Error playing audio: ${audioSource.name}`);
      setIsPlaying(false);
      
      // Move to next audio even if there was an error
      const newIndex = currentIndex + 1;
      setLoadedCount(prevCount => prevCount + 1);
      
      if (newIndex < audioSources.length) {
        setCurrentIndex(newIndex);
        setCurrentResource(audioSources[newIndex]);
      } else {
        setCurrentAudio(null);
        checkCachedResources().then(() => {
          alert('Finished processing all resources. Some errors occurred.');
          localStorage.setItem('resourcesPreloaded', 'true');
        });
      }
    };
    
    // Play with normal volume
    audio.volume = 0.7;
    audio.play().catch(error => {
      console.error('Error starting audio playback:', error);
      addLog(`Playback error: ${error.message}`);
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
  
  // Force download all resources at once
  const forceDownloadAllResources = async () => {
    if (!('caches' in window)) {
      alert('Cache API is not available in your browser. Offline functionality may not work.');
      return;
    }
    
    setIsPreloading(true);
    setPreloadProgress(0);
    
    // Calculate total resources
    const totalItems = allPairs.length * 2 + 20 + 3; // Images + vocabulary audio + praise sounds + clapping/wrong/silent
    let processedItems = 0;
    
    try {
      addLog('Starting force download of all resources');
      
      // Open cache
      const cache = await caches.open(CACHE_NAME);
      
      // Cache all images
      for (const pair of allPairs) {
        try {
          const imageUrl = `${window.location.origin}/${pair.image}`;
          await cacheResource(imageUrl);
          
          processedItems++;
          const percentage = Math.round((processedItems / totalItems) * 100);
          setPreloadProgress(percentage);
        } catch (error) {
          addLog(`Error caching image ${pair.word}: ${error.message}`);
        }
      }
      
      // Cache all vocabulary audio (now using .mp3)
      for (const pair of allPairs) {
        try {
          const audioUrl = `${window.location.origin}/sounds/vocabulary/${pair.word}.mp3`;
          await cacheResource(audioUrl);
          
          processedItems++;
          const percentage = Math.round((processedItems / totalItems) * 100);
          setPreloadProgress(percentage);
        } catch (error) {
          addLog(`Error caching audio for ${pair.word}: ${error.message}`);
        }
      }
      
      // Cache all praise audio (now using .mp3)
      for (let i = 1; i <= 20; i++) {
        try {
          const praiseFile = `/sounds/praise/praise${String(i).padStart(2, '0')}.mp3`;
          const audioUrl = `${window.location.origin}${praiseFile}`;
          await cacheResource(audioUrl);
          
          processedItems++;
          const percentage = Math.round((processedItems / totalItems) * 100);
          setPreloadProgress(percentage);
        } catch (error) {
          addLog(`Error caching praise audio ${i}: ${error.message}`);
        }
      }
      
      // Cache sound effects (clapping and wrong)
      try {
        const clappingUrl = `${window.location.origin}/sounds/clapping.mp3`;
        await cacheResource(clappingUrl);
        
        processedItems++;
        const percentage = Math.round((processedItems / totalItems) * 100);
        setPreloadProgress(percentage);
        addLog('Cached clapping sound effect');
      } catch (error) {
        addLog(`Error caching clapping sound: ${error.message}`);
      }
      
      try {
        const wrongUrl = `${window.location.origin}/sounds/wrong.mp3`;
        await cacheResource(wrongUrl);
        
        processedItems++;
        const percentage = Math.round((processedItems / totalItems) * 100);
        setPreloadProgress(percentage);
        addLog('Cached wrong sound effect');
      } catch (error) {
        addLog(`Error caching wrong sound: ${error.message}`);
      }
      
      try {
        const silentUrl = `${window.location.origin}/sounds/silent.mp3`;
        await cacheResource(silentUrl);
        
        processedItems++;
        const percentage = Math.round((processedItems / totalItems) * 100);
        setPreloadProgress(percentage);
        addLog('Cached silent sound for iOS audio initialization');
      } catch (error) {
        addLog(`Error caching silent sound: ${error.message}`);
      }
      
      // Verify cache status
      await checkCachedResources();
      
      addLog('Finished force downloading all resources');
      alert('All resources have been force downloaded for offline use!');
      localStorage.setItem('resourcesPreloaded', 'true');
    } catch (error) {
      addLog(`Error during force download: ${error.message}`);
      alert('There was an error downloading resources. Please try again.');
    } finally {
      setIsPreloading(false);
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
            Step 1: Cache Images One-by-One
          </button>
          
          <p className="text-xs text-gray-500 mb-4">
            You'll see each image and tap "Cache & Continue" to store it
          </p>
          
          <button
            onClick={startAudioLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded mb-3"
          >
            Step 2: Cache Sounds One-by-One
          </button>
          
          <p className="text-xs text-gray-500 mb-4">
            You'll hear each sound and tap "Play Sound" to store it
          </p>
          
          <button
            onClick={forceDownloadAllResources}
            disabled={isPreloading}
            className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded ${isPreloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Force Download All Resources
          </button>
          
          <p className="text-xs text-gray-500 mt-1">
            Attempts to download all resources at once with explicit caching
          </p>
        </div>
      );
    } else if (loadingMode === 'images') {
      // Image loading interface
      return (
        <div className="text-center py-2">
          <h3 className="text-md font-semibold mb-2">Caching Images</h3>
          
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
                Cache & Continue
              </button>
            </div>
          )}
        </div>
      );
    } else if (loadingMode === 'audio') {
      // Audio loading interface
      return (
        <div className="text-center py-2">
          <h3 className="text-md font-semibold mb-2">Caching Sounds</h3>
          
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
                Each sound is cached when you press play
              </p>
            </div>
          )}
          
          {currentIndex >= audioSources.length && (
            <div className="mb-3 p-3 border rounded bg-green-50">
              <p className="text-green-600 font-bold mb-2">All resources cached successfully!</p>
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
  
  // Debug log display
  const renderDebugLogs = () => {
    return (
      <div className="mt-4 p-2 border rounded bg-gray-100 text-xs text-left h-32 overflow-y-auto">
        <div className="font-medium mb-1">Debug Logs:</div>
        {logMessages.length === 0 ? (
          <div className="text-gray-500">No logs yet</div>
        ) : (
          logMessages.map((message, index) => (
            <div key={index} className="mb-1">{message}</div>
          ))
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
        
        {/* Game settings */}
        <div className="mb-6 border rounded p-3 bg-gray-50">
          <h3 className="text-md font-semibold mb-3">Game Options</h3>
          
          {/* Number of picture choices */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Number of Pictures:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setNumChoices(2)}
                className={`px-4 py-2 rounded ${numChoices === 2 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                2 Pictures
              </button>
              
              <button
                onClick={() => setNumChoices(4)}
                className={`px-4 py-2 rounded ${numChoices === 4 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                4 Pictures
              </button>
              
              {/* Only show 6 pictures option for mobile */}
              {isMobileDevice && (
                <button
                  onClick={() => setNumChoices(6)}
                  className={`px-4 py-2 rounded ${numChoices === 6 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'}`}
                >
                  6 Pictures
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isIPadDevice ? "iPad supports 2 or 4 pictures" : 
               isMobileDevice ? "Mobile supports 2, 4, or 6 pictures" : 
               "Choose how many pictures to display"}
            </p>
          </div>
          
          {/* Sound enabled toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Sound:</label>
            <div className="flex items-center">
              <button
                onClick={() => setSoundEnabled(true)}
                className={`px-4 py-2 rounded-l ${soundEnabled 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                On
              </button>
              <button
                onClick={() => setSoundEnabled(false)}
                className={`px-4 py-2 rounded-r ${!soundEnabled 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                Off
              </button>
            </div>
          </div>
          
          {/* Show words on cards toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Show Words on Cards:</label>
            <div className="flex items-center">
              <button
                onClick={() => setShowWordsOnCards(true)}
                className={`px-4 py-2 rounded-l ${showWordsOnCards 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                Yes
              </button>
              <button
                onClick={() => setShowWordsOnCards(false)}
                className={`px-4 py-2 rounded-r ${!showWordsOnCards 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                No
              </button>
            </div>
          </div>
          
          {/* Player name input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Player Name (optional):</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter player name"
            />
          </div>
        </div>
        
        {/* iOS friendly visual resource loader */}
        <div className="mb-6 border rounded p-3 bg-gray-50">
          {renderLoadingInterface()}
        </div>
        
        {/* Debug logs for troubleshooting */}
        {renderDebugLogs()}
        
        <div className="flex justify-end mt-4">
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