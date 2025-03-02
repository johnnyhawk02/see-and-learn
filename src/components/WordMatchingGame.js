import React, { useState, useEffect, useCallback } from 'react';
import WordCard from './WordCard';
import PictureCard from './PictureCard';
import IncorrectFlash from './IncorrectFlash';
import { allPairs } from '../data/gameData';

const WordMatchingGame = () => {
  const [displayPairs, setDisplayPairs] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showZoomedImage, setShowZoomedImage] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Function to speak the word using the Web Speech API
  const speakWord = (word) => {
    if (!word) return;
    
    // Cancel any ongoing audio before playing a new one
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    const audioFilePath = `/sounds/vocabulary/${word}.wav`;
    const audio = new Audio(audioFilePath);
    
    // Store reference to current audio globally so we can cancel it if needed
    window.currentAudio = audio;
    
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    
    audio.onended = () => {
      window.currentAudio = null;
    };
  };

  // Function to play sound effects with proper management
  const playSound = (soundPath, callback) => {
    // Cancel any ongoing audio before playing a new one
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    const audio = new Audio(soundPath);
    
    // Store reference to current audio globally
    window.currentAudio = audio;
    
    audio.play().catch(error => {
      console.error("Error playing sound:", error);
      if (callback) callback(); // Still call callback if there's an error
    });
    
    audio.onended = () => {
      window.currentAudio = null;
      if (callback) callback(); // Call the callback when the sound finishes
    };
  };

  // Fisher-Yates shuffle algorithm for better randomization
  const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];
    
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Initialize a new round with 4 pictures
  const setupNewRound = useCallback(() => {
    setShowIncorrect(false);
    
    // Safety check for allPairs
    if (!allPairs || !Array.isArray(allPairs) || allPairs.length < 4) {
      console.error("Invalid allPairs data:", allPairs);
      setDisplayPairs([]);
      setCurrentWord(null);
      return Promise.reject("Invalid data");
    }
    
    return new Promise((resolve, reject) => {
      try {
        // First shuffle all pairs and select 4 random pairs
        const shuffledAllPairs = shuffleArray([...allPairs]);
        const selectedPairs = shuffledAllPairs.slice(0, 4); // Take first 4 pairs
        
        // Then shuffle the display order of these 4 pairs
        const shuffledDisplayPairs = shuffleArray([...selectedPairs]);
        
        // Pick one of these as the current word to match
        const randomIndex = Math.floor(Math.random() * 4);
        const selectedWord = shuffledDisplayPairs[randomIndex];
        
        // Log detailed debugging info about the round setup
        console.log("==== NEW ROUND SETUP ====");
        console.log(`Selected word: "${selectedWord?.word}" (ID: ${selectedWord?.id})`);
        console.log("All available pictures:");
        shuffledDisplayPairs.forEach(pair => {
          console.log(`- ${pair?.image} (ID: ${pair?.id}, Word: "${pair?.word}")`);
        });
        
        // Preload images
        const imagesToPreload = shuffledDisplayPairs.map(pair => pair.image);
        Promise.all(imagesToPreload.map(src => {
          return new Promise((resolveImg) => {
            const img = new Image();
            img.src = src;
            img.onload = resolveImg;
            img.onerror = resolveImg; // Continue even if an image fails to load
          });
        }))
        .then(() => {
          console.log("All images preloaded");
          
          // Only update the state after preloading
          setDisplayPairs(shuffledDisplayPairs);
          setCurrentWord(selectedWord);
          
          // Resolve with the selected word
          resolve(selectedWord);
        })
        .catch(err => {
          console.error("Error preloading images:", err);
          
          // Still update the state even if preloading fails
          setDisplayPairs(shuffledDisplayPairs);
          setCurrentWord(selectedWord);
          
          resolve(selectedWord); // Resolve anyway to continue the game
        });
      } catch (error) {
        console.error("Error setting up new round:", error);
        // Set some default values in case of error
        setDisplayPairs([]);
        setCurrentWord(null);
        reject(error);
      }
    });
  }, []);

  // Initialize the first round
  useEffect(() => {
    const initGame = async () => {
      try {
        const firstWord = await setupNewRound();
        // Speak the first word after a slight delay
        setTimeout(() => {
          if (firstWord && firstWord.word) {
            speakWord(firstWord.word);
          }
        }, 500);
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };
    
    initGame();
  }, [setupNewRound]);

  const handleSelection = (isCorrect, elementRect, item) => {
    if (isAnimating) {
      console.log("Animation already in progress, ignoring selection");
      return;
    }

    setIsAnimating(true);
    setTotalAttempts(prev => prev + 1);

    // If correct match
    if (isCorrect && item) {
      // Set the zoomed image data
      setZoomedImage(item);
      
      // Show zoomed image
      setShowZoomedImage(true);
    }

    const playCorrectSound = () => {
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);

        // Play the clapping sound and wait for it to finish
        playSound('/sounds/clapping.mp3', () => {
          // After clapping, prepare the next round but keep the zoomed image visible
          const prepareNextRound = async () => {
            // First prepare the new round data (without showing it)
            setIsAnimating(true);
            
            // Save reference to the current word to prevent closure issues
            const oldWord = currentWord;
            
            // Set up next round
            const newWord = await setupNewRound();
            
            // Then hide the zoomed image
            setShowZoomedImage(false);
            
            // After a short transition delay, finish the animation
            setTimeout(() => {
              setIsAnimating(false);
              
              // Speak the new word after revealing the new cards - with additional delay
              // to ensure there's no overlap with previous audio
              if (newWord && newWord.word) {
                setTimeout(() => {
                  // Cancel any ongoing audio before speaking
                  if (window.currentAudio) {
                    window.currentAudio.pause();
                    window.currentAudio = null;
                  }
                  console.log(`Speaking new word: ${newWord.word} (old word was: ${oldWord?.word})`);
                  speakWord(newWord.word);
                }, 600);
              }
            }, 300);
          };
          
          prepareNextRound();
        });
      } else {
        // Show the incorrect flash - speaking will be handled by the IncorrectFlash component
        setShowIncorrect(true);
        
        // Wait for a longer time to let the flash animation complete
        setTimeout(() => {
          setShowIncorrect(false);
          setIsAnimating(false);
        }, 2500);
      }
    };

    // Slightly delay playing sound to let the zoom animation start
    setTimeout(playCorrectSound, 100);
  };

  // Calculate accuracy percentage
  const accuracy = totalAttempts > 0 
    ? Math.round((correctAnswers / totalAttempts) * 100) 
    : 0;

  return (
    <div className="flex flex-col justify-center items-center h-full w-full bg-gray-50 p-4">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <IncorrectFlash 
        active={showIncorrect} 
        currentWord={currentWord?.word}
        onSpeak={speakWord}
      />
      
      {/* Zoomed image overlay - shown when correct match */}
      {showZoomedImage && zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          style={{ 
            animation: 'scaleIn 0.4s ease-out',
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={zoomedImage.image} 
              alt={zoomedImage.word} 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }} 
            />
            <div 
              className="absolute inset-x-0 bottom-0 text-center p-8 text-white font-bold"
              style={{ 
                fontSize: 'clamp(3rem, 8vw, 8rem)',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.1) 50%)',
                animation: 'slideUp 0.5s ease-out',
                paddingBottom: 'max(5vh, 2rem)'
              }}
            >
              {zoomedImage.word}
            </div>
          </div>
        </div>
      )}
      
      {/* Word Card - Now at the top */}
      <div className="w-full max-w-3xl mb-6">
        {currentWord && <WordCard item={currentWord} onSpeak={speakWord} />}
      </div>
      
      {/* Pictures Grid - Always 4 pictures */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
        {displayPairs && displayPairs.length > 0 ? displayPairs.map(item => (
          <PictureCard 
            key={item.id} 
            item={item} 
            onSelect={handleSelection} 
            currentWordId={currentWord?.id}
            isAnimating={isAnimating}
          />
        )) : (
          // Placeholder cards while loading
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg bg-gray-200" style={{ paddingTop: '56.25%' }}></div>
          ))
        )}
      </div>

      {/* Debug info removed */}

      {/* Accuracy Display - Bottom right corner */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '0.9rem', color: 'black', fontWeight: 'bold' }}>
        Accuracy: {accuracy}%
      </div>
    </div>
  );
};

export default WordMatchingGame;