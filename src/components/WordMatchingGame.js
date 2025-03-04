import React, { useState, useEffect, useCallback, useRef } from 'react';
import WordCard from './WordCard';
import PictureCard from './PictureCard';
import IncorrectFlash from './IncorrectFlash';
import { allPairs } from '../data/gameData';

const WordMatchingGame = ({ settings }) => {
  const [displayPairs, setDisplayPairs] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showZoomedImage, setShowZoomedImage] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [numChoices, setNumChoices] = useState(settings?.numChoices || 4);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isIPadDevice, setIsIPadDevice] = useState(false);
  const [incorrectSelections, setIncorrectSelections] = useState(new Set());
  const [showWordsOnCards, setShowWordsOnCards] = useState(settings?.showWordsOnCards !== false);

  // Direct audio references to avoid queue complications
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Ref to track initialization
  const isInitialized = useRef(false);
  const speakTimeoutRef = useRef(null);

  // Add a ref to track if numChoices was changed manually
  const manualChoiceChange = useRef(false);

  // Add a forceUpdate function using useState hook
  const [, forceUpdate] = useState({});

  // Fisher-Yates shuffle with additional entropy
  const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];
    
    const newArray = [...array];
    const timestamp = Date.now();
    
    // Add additional entropy from timestamp
    for (let i = newArray.length - 1; i > 0; i--) {
      // Use timestamp bits to influence the random selection
      const timestampBits = (timestamp >> (i % 32)) & 1;
      const j = Math.floor((Math.random() + timestampBits) * (i + 1)) % (i + 1);
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    // Log shuffle statistics
    console.log(`Shuffled array of length ${newArray.length}`);
    return newArray;
  };

  // Speak the current word
  const speakWord = (word) => {
    if (!word || (settings && settings.soundEnabled === false)) return;
    
    // Clear any pending speak timeouts
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    
    // Cancel any ongoing audio
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    // Create and play audio
    const audioPath = `/sounds/vocabulary/${word}.wav`;
    console.log(`Speaking word: ${word}, Path: ${audioPath}`);
    
    const audio = new Audio(audioPath);
    setCurrentAudio(audio);
    
    audio.onended = () => {
      setCurrentAudio(null);
    };
    
    audio.onerror = () => {
      console.error(`Error playing audio for word: ${word}`);
      setCurrentAudio(null);
      
      // Use Web Speech API as fallback
      try {
        const utterance = new SpeechSynthesisUtterance(word);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Speech synthesis failed");
      }
    };
    
    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      setCurrentAudio(null);
    });
  };

  // Set up a new round with new cards and a new target word
  const setupNewRound = useCallback(() => {
    try {
      console.log('Setting up new round with numChoices:', numChoices);
      
      // Reset interaction states
      setIsAnimating(false);
      setShowIncorrect(false);
      
      // Filter pairs to ensure they all have images
      const eligiblePairs = allPairs.filter(pair => pair.image && pair.word);
      
      // Ensure we have enough pairs
      if (eligiblePairs.length < numChoices) {
        console.error('Not enough eligible pairs for the current game settings');
        return null;
      }
      
      // Shuffle the pairs and take required number
      const shuffledPairs = shuffleArray([...eligiblePairs]).slice(0, numChoices);
      
      // Pick one as the target word
      const targetIndex = Math.floor(Math.random() * shuffledPairs.length);
      const targetPair = shuffledPairs[targetIndex];
      
      // Set the game state
      setDisplayPairs(shuffledPairs);
      setCurrentWord(targetPair);
      setIncorrectSelections(new Set());
      
      // Clear any existing timeout
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      
      // Speak the target word after a short delay - only do it here, not in handleSelection
      speakTimeoutRef.current = setTimeout(() => {
        speakWord(targetPair.word);
        speakTimeoutRef.current = null;
      }, 500);
      
      // Return the target pair for use by the caller
      return targetPair;
    } catch (error) {
      console.error("Error in setupNewRound:", error);
      return null;
    }
  }, [numChoices]); // Add numChoices to dependency array

  // Initialize the game
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('Initializing game for the first time with numChoices:', numChoices);
      setupNewRound();
      isInitialized.current = true;
    }
  }, [setupNewRound, numChoices]);

  // Update when settings change
  useEffect(() => {
    if (settings) {
      console.log('Settings changed:', settings);
      
      // Check if numChoices changed
      if (settings.numChoices && settings.numChoices !== numChoices && !manualChoiceChange.current) {
        console.log(`Updating numChoices from ${numChoices} to ${settings.numChoices}`);
        setNumChoices(settings.numChoices);
        // Don't automatically call setupNewRound here, it will be triggered by the numChoices change
      }
      
      // Don't override manual toggles by removing this code
      // Only set from settings on initial load
      if (!isInitialized.current && settings?.showWordsOnCards !== undefined) {
        console.log(`Initial setting of showWordsOnCards to ${settings.showWordsOnCards}`);
        setShowWordsOnCards(settings.showWordsOnCards !== false);
      }
    }
  }, [settings, numChoices, showWordsOnCards]);

  // Clean up audio and timeouts on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, []);

  // Update numChoices when settings change, but don't override manual changes
  useEffect(() => {
    // Skip if this was a manual change from the dropdown
    if (manualChoiceChange.current) {
      console.log('Skipping settings sync because manual change was made');
      manualChoiceChange.current = false;
      return;
    }

    const newChoices = settings?.numChoices || 4;
    // Only update if the choice count actually changed
    if (newChoices !== numChoices) {
      console.log(`Settings changed: numChoices from ${numChoices} to ${newChoices}`);
      setNumChoices(newChoices);
    }
  }, [settings?.numChoices, numChoices]);

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
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Play sound with callback and volume control
  const playSound = (path, volume = 1, callback) => {
    if (settings && settings.soundEnabled === false) {
      if (callback) callback();
      return;
    }
    
    // Cancel any ongoing audio
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    const audio = new Audio(path);
    audio.volume = volume; // Set volume
    setCurrentAudio(audio);
    
    audio.onended = () => {
      setCurrentAudio(null);
      if (callback) callback();
    };
    
    audio.onerror = () => {
      console.error("Error playing sound");
      setCurrentAudio(null);
      if (callback) callback();
    };
    
    audio.play().catch(err => {
      console.error("Error playing sound:", err);
      setCurrentAudio(null);
      if (callback) callback();
    });
  };

  // Handle selection of a card
  const handleSelection = (isCorrect, elementRect, item) => {
    if (isAnimating) return;
    
    // Update total attempts
    setTotalAttempts(prev => prev + 1);
    
    // Prevent further interactions
    setIsAnimating(true);
    
    // Set a safety timeout to prevent permanent freezing
    const safetyTimer = setTimeout(() => {
      console.log("Safety timeout triggered");
      setIsAnimating(false);
      setShowZoomedImage(false);
      setShowIncorrect(false);
      setShowConfetti(false);
    }, 5000);
    
    if (isCorrect) {
      // Update correct answers
      setCorrectAnswers(prev => prev + 1);
      
      // Show zoomed image
      setZoomedImage(item);
      setShowZoomedImage(true);
      
      // Show confetti
      setShowConfetti(true);
      
      // Play clapping sound at 20% volume
      playSound('/sounds/clapping.mp3', 0.2);
      
      // Play a random praise audio track
      const praiseNumber = Math.floor(Math.random() * 20) + 1;
      const praiseAudio = new Audio(`/sounds/praise/praise${String(praiseNumber).padStart(2, '0')}.wav`);
      praiseAudio.play();
      
      // Clear incorrect selections for next round
      setIncorrectSelections(new Set());
      
      // Prepare for next round
      setTimeout(() => {
        // Hide zoomed image and confetti
        setShowZoomedImage(false);
        setShowConfetti(false);
        
        // Set up next round
        const newTargetWord = setupNewRound();
        
        // Don't speak word again here - it's already spoken in setupNewRound
        setTimeout(() => {
          clearTimeout(safetyTimer);
          
          // IMPORTANT: Reset animation state to allow interactions in the next round
          setIsAnimating(false);
          
          // Don't speak new word here to avoid duplication
          // if (newTargetWord && newTargetWord.word) {
          //   speakWord(newTargetWord.word);
          // }
        }, 800);
      }, 1500);
    } else {
      // Add to incorrect selections
      setIncorrectSelections(prev => new Set([...prev, item.id]));
      
      // Don't show incorrect flash
      // setShowIncorrect(false);
      
      // Play wrong sound
      playSound('/sounds/wrong.wav', 1, () => {
        // Speak correct word after delay
        setTimeout(() => {
          if (currentWord && currentWord.word) {
            speakWord(currentWord.word);
          }
          
          // Allow interactions again after speaking
          setTimeout(() => {
            // setShowIncorrect(false);
            clearTimeout(safetyTimer);
            setIsAnimating(false);
          }, 1500);
        }, 300);
      });
    }
  };

  // Add the handleLongPress function
  const handleLongPress = (item, rect) => {
    setZoomedImage(item);
    setShowZoomedImage(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowZoomedImage(false);
    }, 3000);
  };

  // Calculate accuracy
  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

  // Get the appropriate grid class based on the number of choices
  const getGridClass = () => {
    console.log(`getGridClass called with numChoices: ${numChoices}`);
    switch (numChoices) {
      case 2:
        return 'two-cards';
      case 4:
        return 'four-cards';
      case 6:
        return 'six-cards';
      case 8:
        return 'eight-cards';
      case 9:
        return 'nine-cards';
      default:
        return 'four-cards';
    }
  };

  // Toggle menu visibility
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Add a dedicated effect for numChoices changes
  useEffect(() => {
    if (isInitialized.current) {
      console.log(`numChoices changed to ${numChoices}, setting up new round`);
      setupNewRound();
    }
  }, [numChoices, setupNewRound]);

  // Add a dedicated effect to monitor showWordsOnCards changes
  useEffect(() => {
    console.log(`showWordsOnCards value changed to: ${showWordsOnCards}`);
    // This is intentionally empty except for logging - we want to track when this changes
  }, [showWordsOnCards]);

  // Toggle words on cards - improved to prevent resets
  const toggleWordsOnCards = () => {
    console.log("Toggle function called. Current value:", showWordsOnCards);
    
    // Create a local copy of the current value
    const currentValue = showWordsOnCards;
    const newValue = !currentValue;
    
    console.log(`TOGGLING words on cards from ${currentValue} to ${newValue}`);
    
    // Set the state immediately
    setShowWordsOnCards(newValue);
    
    // Also use a timeout to ensure it persists even if something else changes it
    setTimeout(() => {
      setShowWordsOnCards(prev => {
        if (prev !== newValue) {
          console.log(`State was changed back to ${prev}, re-setting to ${newValue}`);
          return newValue;
        }
        return prev;
      });
    }, 50);
    
    // Update localStorage
    try {
      localStorage.setItem('showWordsOnCards', JSON.stringify(newValue));
      localStorage.setItem('gameSettings', JSON.stringify({
        ...settings,
        showWordsOnCards: newValue
      }));
      console.log("Saved to localStorage:", newValue);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    // If settings object has an update method, call it
    if (settings && typeof settings.onSettingsChange === 'function') {
      console.log("Calling onSettingsChange with new value:", newValue);
      settings.onSettingsChange({
        ...settings,
        showWordsOnCards: newValue
      });
    }
    
    // Don't close the menu after toggling
  };

  // Log animation state changes
  useEffect(() => {
    console.log(`isAnimating changed to: ${isAnimating}`);
  }, [isAnimating]);

  return (
    <div className="game-container pt-8 sm:pt-10 px-4 sm:px-6">
      {console.log('RENDER: Current state', { 
        numChoices, 
        displayPairs: displayPairs.length, 
        currentWord: currentWord?.word,
        showWordsOnCards
      })}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=ABeeZee:ital@0;1&display=swap');
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes celebrate {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        /* Apply ABeeZee font globally */
        body, html {
          font-family: 'ABeeZee', sans-serif;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
          overscroll-behavior: none;
          min-height: 100vh;
          height: fit-content;
        }
        img {
          pointer-events: none;
        }
        
        /* Improve image fill */
        .picture-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
        }

        /* Pictures container */
        .pictures-container {
          width: 100%;
          max-width: 1200px;
          padding: 0.25rem;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        
        /* Base grid layout for all modes */
        .pictures-grid {
          display: grid;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          grid-gap: 4px;
          justify-content: center !important;
        }
        
        /* Picture card base styles for all modes */
        .picture-card {
          width: 100%;
          height: auto;
          max-height: none;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden;
        }

        /* Four cards layout (2x2 on all screens) */
        .pictures-grid.four-cards {
          grid-template-columns: repeat(2, 1fr);
        }
        
        /* Two cards layout optimized for iPad and iPhone SE */
        .pictures-grid.two-cards {
          grid-template-columns: repeat(2, 1fr) !important;
          max-width: 800px !important;
          gap: 1rem !important;
          margin: 0 auto !important;
          display: grid !important;
          visibility: visible !important;
          height: auto !important;
          min-height: 250px !important;
          max-height: none !important;
          overflow: visible !important;
          padding: 0 !important;
          justify-content: center !important;
        }
        
        .pictures-grid.two-cards .picture-card {
          height: auto !important;
          max-width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          visibility: visible !important;
          aspect-ratio: 16/9 !important;
          overflow: visible !important;
          margin: 0 auto !important;
        }
        
        /* iPad specific styles */
        @media (min-width: 768px) and (max-width: 1024px) {
          .pictures-grid.two-cards {
            max-width: 700px !important;
            gap: 1.5rem !important;
          }
          
          .pictures-grid.two-cards .picture-card {
            max-width: 340px !important;
            margin: 0 auto !important;
          }
          
          .word-card {
            min-height: 60px !important;
          }
          
          .word-card span {
            font-size: clamp(2.5rem, 10vw, 4rem) !important;
          }
          
          .picture-card .word-container {
            font-size: 32px !important;
            min-height: 56px !important;
            height: 56px !important;
          }
        }
        
        /* iPhone SE specific styles */
        @media (max-width: 375px) {
          .pictures-grid.two-cards {
            max-width: 320px !important;
            gap: 0.75rem !important;
          }
          
          .pictures-grid.two-cards .picture-card {
            max-width: 155px !important;
            margin: 0 auto !important;
          }
          
          .word-card {
            min-height: 50px !important;
          }
          
          .word-card span {
            font-size: clamp(2rem, 8vw, 3rem) !important;
          }
          
          .picture-card .word-container {
            font-size: 24px !important;
            min-height: 40px !important;
            height: 40px !important;
          }
        }
        
        /* Ensure pictures container has enough height */
        .pictures-container {
          min-height: 200px !important;
          overflow: visible !important;
          display: block !important;
          visibility: visible !important;
          padding: 0.5rem !important;
        }
        
        /* Force consistent appearance */
        .pictures-grid.four-cards,
        .pictures-grid.two-cards {
          overflow: visible !important;
          padding-bottom: 8px !important;
          display: grid !important;
          visibility: visible !important;
        }
        
        /* Mobile adjustments */
        @media (max-width: 480px) {
          .pictures-grid {
            grid-gap: 2px;
          }
        }
        
        /* Remove the CSS that forces visibility */
        /*
        .picture-card > div:last-child {
          display: flex !important;
          visibility: visible !important;
        }
        */

        /* Better word card styling */
        .word-card {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80px;
          padding: 0.5rem;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        
        @media (orientation: portrait) {
          .word-card h2 {
            font-size: clamp(2.5rem, 8vw, 4rem);
          }
        }
        
        @media (orientation: landscape) {
          .word-card h2 {
            font-size: clamp(2rem, 6vw, 3.5rem);
          }
        }
        
        /* Responsive grid layout */
        .pictures-grid {
          display: grid;
          gap: 0.5rem;
        }
        
        /* Default 2 columns for narrow screens */
        .pictures-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        /* Adjust spacing in landscape */
        @media (orientation: landscape) {
          .pictures-grid {
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          .pictures-grid::-webkit-scrollbar {
            width: 8px;
          }

          .pictures-grid::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }
          
          .pictures-grid::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          
          .pictures-grid::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
        }
        
        /* Menu styles */
        .menu-button {
          position: fixed;
          top: 28px;
          right: 12px;
          z-index: 50;
          background: white;
          border-radius: 9999px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .menu-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .menu-dropdown {
          position: fixed;
          top: 60px;
          right: 12px;
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          min-width: 200px;
          z-index: 50;
          animation: fadeIn 0.2s ease-out;
        }
        
        .menu-item {
          padding: 12px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .menu-item:hover {
          background-color: #f5f5f5;
        }
        
        .menu-item.active {
          background-color: #f0f7ff;
          font-weight: 500;
        }
        
        .menu-item-group {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .menu-item-header {
          padding: 8px 16px;
          color: #666;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          background-color: #f5f5f5;
        }
        
        .menu-divider {
          height: 1px;
          width: 100%;
          background-color: #eee;
        }

        .game-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          padding-top: 2rem;
          padding-bottom: 1rem;
          position: relative;
          justify-content: flex-start;
          text-align: center;
        }

        /* Fix for picture card text display in all modes */
        .pictures-grid.four-cards .picture-card,
        .pictures-grid.two-cards .picture-card {
          display: flex !important;
          flex-direction: column !important;
          height: auto !important;
          max-height: none !important;
        }
        
        /* Ensure word container is visible in all modes with consistent styling */
        .picture-card .word-container,
        .picture-card > div:last-child {
          display: flex !important;
          visibility: visible !important;
          min-height: 48px !important;
          height: 48px !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: white !important;
          color: black !important;
          font-size: 28px !important;
          font-weight: 500 !important;
          padding: 8px !important;
          border-top: 1px solid #f0f0f0 !important;
          text-align: center !important;
          line-height: 1.3 !important;
        }
      `}</style>
      
      {/* Menu Button and Dropdown */}
      <div 
        className="menu-button"
        onClick={toggleMenu}
        style={{ top: '28px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="menu-dropdown">
            <div className="menu-item" onClick={() => {
              setupNewRound();
              toggleMenu();
            }}>
              <span>New Round</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12L20 12M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div className="menu-divider"></div>
            
            <div className="menu-item">
              <span>Number of Cards</span>
              <select 
                value={numChoices} 
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  console.log(`Dropdown selected: ${newValue} cards (current: ${numChoices})`);
                  
                  // Set the manual change flag to prevent settings sync from overriding
                  manualChoiceChange.current = true;
                  
                  // Update state - this will trigger the useEffect that calls setupNew
                  setNumChoices(newValue);
                  
                  // Update settings if available
                  if (settings?.onSettingsChange) {
                    settings.onSettingsChange({ 
                      ...settings,
                      numChoices: newValue 
                    });
                  } else {
                    // Direct update without settings callback
                    // Save to localStorage
                    try {
                      const savedSettings = localStorage.getItem('gameSettings');
                      if (savedSettings) {
                        const parsedSettings = JSON.parse(savedSettings);
                        parsedSettings.numChoices = newValue;
                        localStorage.setItem('gameSettings', JSON.stringify(parsedSettings));
                      } else {
                        localStorage.setItem('gameSettings', JSON.stringify({ numChoices: newValue }));
                      }
                    } catch (error) {
                      console.error('Error updating localStorage:', error);
                    }
                    
                    // We don't need to call setupNew() here anymore
                    // The useEffect will handle it when numChoices changes
                  }
                }}
                className="ml-2 p-1 rounded border"
              >
                {isMobileDevice ? (
                  <>
                    <option value={2}>2 Cards</option>
                    <option value={4}>4 Cards</option>
                    <option value={6}>6 Cards</option>
                    <option value={8}>8 Cards</option>
                  </>
                ) : isIPadDevice || !isMobileDevice ? (
                  <>
                    <option value={2}>2 Cards</option>
                    <option value={4}>4 Cards</option>
                    <option value={6}>6 Cards</option>
                    <option value={9}>9 Cards</option>
                  </>
                ) : (
                  <>
                    <option value={4}>4 Cards</option>
                    <option value={6}>6 Cards</option>
                    <option value={9}>9 Cards</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="menu-divider" />
            
            <div className="menu-item">
              <span>Sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.soundEnabled !== false}
                  onChange={(e) => {
                    if (settings?.onSettingsChange) {
                      settings.onSettingsChange({ 
                        ...settings,
                        soundEnabled: e.target.checked 
                      });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="menu-divider" />
            
            <div className="menu-item">
              <span>Show Words on Cards</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWordsOnCards}
                  onChange={() => {
                    console.log("Toggle button clicked in menu");
                    toggleWordsOnCards();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="menu-divider" />
            
            <div className="menu-item">
              <span>Accuracy</span>
              <span className="font-bold">{accuracy}%</span>
            </div>
            
            <div className="menu-divider" />
            
            <div 
              className="menu-item text-red-600 font-medium"
              onClick={() => {
                if (settings?.onExit) {
                  settings.onExit();
                }
              }}
            >
              Exit Game
            </div>
          </div>
        </>
      )}
      
      <IncorrectFlash 
        active={showIncorrect} 
        currentWord={currentWord?.word}
        onSpeak={speakWord}
      />
      
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5vh',
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: ['#FFC700', '#FF0058', '#2E7CF6', '#FB6C42', '#A4DD00'][Math.floor(Math.random() * 5)],
                borderRadius: '50%',
                animation: `confettiFall ${Math.random() * 2 + 1}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Zoomed image overlay */}
      {showZoomedImage && zoomedImage && (
        <div 
          className="fixed inset-0 bg-opacity-100 flex items-center justify-center z-40"
          style={{ 
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }}
        >
          <img 
            src={zoomedImage.image} 
            alt={zoomedImage.word} 
            style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.4)',
              zIndex: '-1'
            }} 
          />
          <div className="text-center">
            <div 
              className="text-white font-bold"
              style={{ 
                textShadow: '4px 4px 12px rgba(0,0,0,0.9)',
                animation: 'fadeIn 0.5s ease-out, pulse 1s ease-in-out infinite',
                lineHeight: '1.2',
                fontSize: 'clamp(4rem, 20vw, 24rem)',
                wordBreak: 'break-word',
                hyphens: 'auto',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                padding: '20px',
              }}
            >
              {zoomedImage.word}
            </div>
          </div>
        </div>
      )}
      
      <div className="game-content w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Word Card */}
        <div className="word-card mb-4 sm:mb-6">
          <span 
            className="font-bold text-center"
            style={{
              fontSize: 'clamp(3.36rem, 14vw, 6.72rem)',
              lineHeight: '1.1',
              display: 'block',
              fontWeight: '800'
            }}
          >
            {currentWord?.word}
          </span>
        </div>
        
        {/* Pictures Container with Scrolling */}
        <div className="pictures-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {console.log('Rendering pictures container, displayPairs:', displayPairs)}
          {/* Pictures Grid */}
          <div className={`pictures-grid ${getGridClass()}`}>
            {console.log('GRID RENDER with displayPairs:', displayPairs.length, 'cards,', 'grid class:', getGridClass())}
            {displayPairs.length > 0 ? (
              // Map each item to a PictureCard
              displayPairs.map((item, index) => {
                console.log(`Rendering card ${index + 1}/${displayPairs.length}: ${item.word} with showWordsOnCards=${showWordsOnCards}`);
                return (
                  <PictureCard
                    key={`${item.id}-${index}`}
                    item={item}
                    isIncorrect={incorrectSelections.has(item.id)}
                    onClick={(elementRect) => handleSelection(
                      item.id === currentWord?.id,
                      elementRect,
                      item
                    )}
                    onLongPress={() => {
                      setZoomedImage(item);
                      setShowZoomedImage(true);
                      
                      // Auto-hide after 3 seconds
                      setTimeout(() => {
                        setShowZoomedImage(false);
                      }, 3000);
                    }}
                    disabled={isAnimating}
                    showWords={showWordsOnCards}
                  />
                );
              })
            ) : (
              // If no items, show a loading message
              <div className="col-span-full text-center py-8">
                <p>Loading cards...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Debug Area - with more reliable state display */}
      {process.env.NODE_ENV !== 'production' && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          <div>Words Visible: <span style={{color: showWordsOnCards ? '#5f5' : '#f55', fontWeight: 'bold'}}>{String(showWordsOnCards)} ({showWordsOnCards ? 'YES' : 'NO'})</span></div>
          <div>Num Choices: {numChoices}</div>
          <div>Sound: {settings?.soundEnabled !== false ? 'ON' : 'OFF'}</div>
          <button
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              marginTop: '5px',
              cursor: 'pointer',
            }}
            onClick={() => {
              console.log("Debug toggle button clicked");
              toggleWordsOnCards();
            }}
          >
            Debug: Toggle Words
          </button>
        </div>
      )}
    </div>
  );
};

export default WordMatchingGame;