import React, { useState, useEffect } from 'react';
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

  // Direct audio references to avoid queue complications
  const [currentAudio, setCurrentAudio] = useState(null);

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
  const setupNewRound = () => {
    // Prevent interactions during setup
    setIsAnimating(true);
    setShowIncorrect(false);
    setShowZoomedImage(false);
    
    try {
      // Get all available pairs
      const availablePairs = [...allPairs];
      
      // Shuffle and pick target word
      const shuffled = shuffleArray(availablePairs);
      const targetWord = shuffled[0];
      
      // Get 3 more random words
      const otherWords = shuffled.slice(1, 4);
      
      // Combine and shuffle display order
      const roundPairs = shuffleArray([targetWord, ...otherWords]);
      
      // Update state
      setDisplayPairs(roundPairs);
      setCurrentWord(targetWord);
      
      console.log(`New round: Target word = ${targetWord.word}`);
      
      // Allow interactions
      setIsAnimating(false);
      
      // Return the target word
      return targetWord;
    } catch (error) {
      console.error("Error setting up round:", error);
      setIsAnimating(false);
      return null;
    }
  };

  // Initialize on first load
  useEffect(() => {
    const targetWord = setupNewRound();
    
    // Speak the word after delay
    const timer = setTimeout(() => {
      if (targetWord && targetWord.word) {
        speakWord(targetWord.word);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
    }, 5000);
    
    if (isCorrect) {
      // Update correct answers
      setCorrectAnswers(prev => prev + 1);
      
      // Show zoomed image
      setZoomedImage(item);
      setShowZoomedImage(true);
      
      // Play clapping sound at 20% volume
      playSound('/sounds/clapping.mp3', 0.2);
      
      // Play a praise audio track
      const praiseAudio = new Audio('/sounds/praise/praise01.wav');
      praiseAudio.play();
      
      // Prepare for next round
      setTimeout(() => {
        // Hide zoomed image
        setShowZoomedImage(false);
        
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
        /* Prevent text selection and dragging */
        body, html {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
          overscroll-behavior: none;
        }
        img {
          pointer-events: none;
        }
      `}</style>
      
      <IncorrectFlash 
        active={showIncorrect} 
        currentWord={currentWord?.word}
        onSpeak={speakWord}
      />
      
      {/* Zoomed image overlay */}
      {showZoomedImage && zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ 
            animation: 'fadeIn 0.4s ease-out',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
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
                filter: 'brightness(0.4)'
              }} 
            />
            <div 
              className="absolute inset-0 flex items-center justify-center text-center text-white font-bold"
              style={{ 
                fontSize: 'clamp(6.4rem, 28vw, 24rem)',
                textShadow: '4px 4px 12px rgba(0,0,0,0.9)',
                animation: 'fadeIn 0.5s ease-out',
                lineHeight: '0.9'
              }}
            >
              {zoomedImage.word}
            </div>
          </div>
        </div>
      )}
      
      {/* Word Card */}
      <div className="w-full max-w-3xl mb-6">
        {currentWord && (
          <WordCard 
            item={currentWord} 
            onSpeak={() => speakWord(currentWord.word)} 
          />
        )}
      </div>
      
      {/* Pictures Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
        {displayPairs && displayPairs.length > 0 ? (
          displayPairs.map(item => (
            <PictureCard 
              key={item.id} 
              item={item} 
              onSelect={handleSelection} 
              currentWordId={currentWord?.id}
              isAnimating={isAnimating}
            />
          ))
        ) : (
          // Placeholder cards
          [...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="rounded-lg bg-gray-200" 
              style={{ paddingTop: '56.25%' }}
            />
          ))
        )}
      </div>

      {/* Accuracy Display */}
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '16px', 
          right: '16px', 
          fontSize: '0.9rem', 
          color: 'black', 
          fontWeight: 'bold' 
        }}
      >
        Accuracy: {accuracy}%
      </div>
    </div>
  );
};

export default WordMatchingGame;