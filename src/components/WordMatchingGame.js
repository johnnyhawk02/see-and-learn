import React, { useState, useEffect, useCallback } from 'react';
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

  // Direct audio references to avoid queue complications
  const [currentAudio, setCurrentAudio] = useState(null);

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];
    
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Set up a new round
  const setupNewRound = useCallback(() => {
    // Prevent interactions during setup
    setIsAnimating(true);
    setShowIncorrect(false);
    setShowZoomedImage(false);
    
    try {
      // Get all available pairs
      const availablePairs = [...allPairs];
      
      // Ensure we have enough pairs for the current number of choices
      if (availablePairs.length < numChoices) {
        console.error(`Not enough pairs available for ${numChoices} choices`);
        return null;
      }
      
      // Shuffle and pick target word
      const shuffled = shuffleArray(availablePairs);
      const targetWord = shuffled[0];
      
      // Get more random words based on number of choices (minus the target)
      const otherWords = shuffled.slice(1, numChoices);
      
      // Combine and shuffle display order
      const roundPairs = shuffleArray([targetWord, ...otherWords]);
      
      // Update state
      setDisplayPairs(roundPairs);
      setCurrentWord(targetWord);
      
      console.log(`New round: Target word = ${targetWord.word}, Choices = ${numChoices}`);
      
      // Allow interactions
      setIsAnimating(false);
      
      // Return the target word
      return targetWord;
    } catch (error) {
      console.error("Error setting up round:", error);
      setIsAnimating(false);
      return null;
    }
  }, [numChoices]);

  // Update numChoices when settings change
  useEffect(() => {
    const newChoices = settings?.numChoices || 4;
    // Only update if the choice count actually changed
    if (newChoices !== numChoices) {
      console.log(`Settings changed: numChoices from ${numChoices} to ${newChoices}`);
      setNumChoices(newChoices);
    }
  }, [settings?.numChoices, numChoices]);

  // Initialize on first load and when numChoices changes
  useEffect(() => {
    console.log(`Initializing game with ${numChoices} choices...`);
    const targetWord = setupNewRound();
    
    // Speak the word after delay
    const timer = setTimeout(() => {
      if (targetWord && targetWord.word) {
        speakWord(targetWord.word);
        console.log(`Speaking initial word: ${targetWord.word}`);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [numChoices, setupNewRound]);

  // Basic function to speak a word
  const speakWord = (word) => {
    if (!word || (settings && settings.soundEnabled === false)) return;
    
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
      
      // Prepare for next round
      setTimeout(() => {
        // Hide zoomed image and confetti
        setShowZoomedImage(false);
        setShowConfetti(false);
        
        // Set up next round
        const newTargetWord = setupNewRound();
        
        // Speak new word after transition
        setTimeout(() => {
          clearTimeout(safetyTimer);
          
          // Speak new word
          if (newTargetWord && newTargetWord.word) {
            speakWord(newTargetWord.word);
          }
        }, 800);
      }, 1500);
    } else {
      // Show incorrect flash
      setShowIncorrect(true);
      
      // Play wrong sound
      playSound('/sounds/wrong.wav', 1, () => {
        // Speak correct word after delay
        setTimeout(() => {
          if (currentWord && currentWord.word) {
            speakWord(currentWord.word);
          }
          
          // Hide incorrect flash after speaking
          setTimeout(() => {
            setShowIncorrect(false);
            clearTimeout(safetyTimer);
            setIsAnimating(false);
          }, 1500);
        }, 300);
      });
    }
  };

  // Calculate accuracy
  const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

  return (
    <div className={`flex flex-col justify-start items-center w-full bg-gradient-to-b from-blue-50 to-indigo-100 ${
      numChoices > 4 ? 'pt-6 sm:pt-8 p-1 sm:p-2' : 'pt-6 sm:pt-8 p-2 sm:p-4'
    }`}
    style={{
      minHeight: '100vh',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
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
        
        /* Better word card styling */
        .word-card {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80px;
          padding: 0.5rem;
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
        
        /* Layout adjustments for 6-image mode */
        .six-image-mode {
          display: grid;
          grid-auto-rows: 1fr;
        }
        
        .six-image-mode .picture-card {
          transform-origin: center;
          position: absolute;
          inset: 0;
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
        
        /* 3 columns when there's enough width AND height ratio is appropriate */
        @media (min-width: 768px) and (min-height: 600px) {
          .pictures-grid.nine-cards,
          .pictures-grid.six-cards {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }
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
          top: 24px;
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
          background: #f3f4f6;
        }
        
        .menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }
      `}</style>
      
      {/* Menu Button and Dropdown */}
      <div 
        className="menu-button"
        onClick={() => setShowMenu(!showMenu)}
        style={{ top: '24px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="12" x2="20" y2="12"></line>
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
      </div>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="menu-dropdown">
            <div className="menu-item">
              <span>Number of Cards</span>
              <select 
                value={numChoices} 
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (settings?.onSettingsChange) {
                    settings.onSettingsChange({ 
                      ...settings,
                      numChoices: newValue 
                    });
                  }
                }}
                className="ml-2 p-1 rounded border"
              >
                <option value={4}>4 Cards</option>
                <option value={6}>6 Cards</option>
                <option value={9}>9 Cards</option>
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
              <span>Accuracy</span>
              <span className="font-bold">{accuracy}%</span>
            </div>
            
            <div className="menu-divider" />
            
            <div className="menu-item">
              <span>Player Name</span>
              <span className="font-bold truncate max-w-[100px]" title={settings?.playerName || "Player"}>
                {settings?.playerName || "Player"}
              </span>
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
      
      {/* Word Card */}
      <div className={`w-full max-w-4xl flex-shrink-0 ${
        numChoices === 6 ? 'mb-2 sm:mb-3' : 'mb-3 sm:mb-4'
      }`}>
        {currentWord && (
          <WordCard 
            item={currentWord} 
            onSpeak={() => speakWord(currentWord.word)} 
            size={numChoices === 6 ? 'compact' : 'normal'}
          />
        )}
      </div>
      
      {/* Pictures Grid */}
      <div 
        className={`pictures-grid w-full max-w-4xl ${
          numChoices === 9 
            ? 'nine-cards'
            : numChoices === 6 
            ? 'six-cards'
            : 'grid-cols-2 gap-3 sm:gap-4'
        }`}
        style={{
          alignItems: 'start',
          gridAutoRows: 'auto'
        }}
      >
        {displayPairs && displayPairs.length > 0 ? (
          displayPairs.map((item, index) => (
            <div 
              className="relative w-full" 
              key={item.id} 
              style={{ 
                paddingTop: '56.25%', // 16:9 aspect ratio
                animation: `fadeIn 0.2s ease-out ${index * (numChoices === 6 ? 0.05 : 0.1)}s both`
              }}
            >
              <div className="absolute inset-0">
                <PictureCard 
                  item={item} 
                  onSelect={handleSelection} 
                  currentWordId={currentWord?.id}
                  isAnimating={isAnimating}
                  className="picture-card h-full w-full"
                />
              </div>
            </div>
          ))
        ) : (
          // Placeholder cards
          [...Array(numChoices)].map((_, i) => (
            <div 
              key={i} 
              className="relative w-full rounded-lg bg-gray-200 shadow-md" 
              style={{ 
                paddingTop: '56.25%', // 16:9 aspect ratio
                animation: `fadeIn 0.3s ease-out ${i * (numChoices === 6 ? 0.05 : 0.1)}s both`
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default WordMatchingGame;