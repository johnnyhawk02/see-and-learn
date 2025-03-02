import React, { useState, useEffect, useCallback } from 'react';

// Data for the game - using the provided vocabulary words
const allPairs = [
  { id: 1, word: "bed", emoji: "🛏️" },
  { id: 2, word: "hat", emoji: "🧢" },
  { id: 3, word: "pig", emoji: "🐷" },
  { id: 4, word: "cup", emoji: "🥤" },
  { id: 5, word: "car", emoji: "🚗" },
  { id: 6, word: "bag", emoji: "👜" },
  { id: 7, word: "doll", emoji: "🧸" },
  { id: 8, word: "fish", emoji: "🐟" },
  { id: 9, word: "cat", emoji: "🐱" },
  { id: 10, word: "ball", emoji: "⚽" },
  { id: 11, word: "dog", emoji: "🐶" },
  { id: 12, word: "keys", emoji: "🔑" },
  { id: 13, word: "table", emoji: "🪑" }, // Fixed table emoji
  { id: 14, word: "book", emoji: "📚" },
  { id: 15, word: "daddy", emoji: "👨" },
  { id: 16, word: "mummy", emoji: "👩" },
  { id: 17, word: "apple", emoji: "🍎" },
  { id: 18, word: "baby", emoji: "👶" },
  { id: 19, word: "cow", emoji: "🐄" },
  { id: 20, word: "spoon", emoji: "🥄" },
  { id: 21, word: "banana", emoji: "🍌" },
  { id: 22, word: "duck", emoji: "🦆" },
  { id: 23, word: "socks", emoji: "🧦" },
  { id: 24, word: "bath", emoji: "🛁" },
  { id: 25, word: "chair", emoji: "🪑" },
  { id: 26, word: "brush", emoji: "🪥" },
  { id: 27, word: "shoes", emoji: "👟" },
  { id: 28, word: "flower", emoji: "🌸" },
  { id: 29, word: "bear", emoji: "🐻" },
  { id: 30, word: "drink", emoji: "🥛" },
  { id: 31, word: "sheep", emoji: "🐑" },
  { id: 32, word: "nose", emoji: "👃" },
  { id: 33, word: "wash", emoji: "🧼" },
  { id: 34, word: "coat", emoji: "🧥" },
  { id: 35, word: "eating", emoji: "🍽️" },
  { id: 36, word: "biscuit", emoji: "🍪" },
  { id: 37, word: "eyes", emoji: "👁️" },
  { id: 38, word: "sitting", emoji: "💺" },
  { id: 39, word: "blocks", emoji: "🧱" },
  { id: 40, word: "mouth", emoji: "👄" },
  { id: 41, word: "sleeping", emoji: "💤" },
  { id: 42, word: "bird", emoji: "🐦" },
  { id: 43, word: "hair", emoji: "💇" },
  { id: 44, word: "crying", emoji: "😢" },
  { id: 45, word: "phone", emoji: "📱" },
  { id: 46, word: "walk", emoji: "🚶" },
  { id: 47, word: "drinking", emoji: "🥤" },
  { id: 48, word: "brushing", emoji: "🪥" }
];

// Confetti Component - only shown for correct answers
const Confetti = ({ active }) => {
  const [pieces, setPieces] = useState([]);
  
  useEffect(() => {
    // Only generate and animate confetti when active is true (correct match)
    if (active) {
      console.log("Showing confetti for correct match");
      const newPieces = [];
      for (let i = 0; i < 100; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          y: -20 - Math.random() * 100,
          size: 5 + Math.random() * 10,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`,
          rotation: Math.random() * 360,
          xVel: -2 + Math.random() * 4,
          yVel: 3 + Math.random() * 2,
          rotVel: -2 + Math.random() * 4
        });
      }
      setPieces(newPieces);
      
      const animateConfetti = () => {
        setPieces(prevPieces => 
          prevPieces.map(piece => ({
            ...piece,
            x: piece.x + piece.xVel,
            y: piece.y + piece.yVel,
            rotation: piece.rotation + piece.rotVel
          }))
        );
      };
      
      const interval = setInterval(animateConfetti, 50);
      return () => clearInterval(interval);
    } else {
      // Clear confetti when not active
      setPieces([]);
    }
  }, [active]);
  
  if (!active) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {pieces.map(piece => (
        <div 
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// Incorrect Flash Component
const IncorrectFlash = ({ active }) => {
  const [opacity, setOpacity] = useState(0.7);
  
  useEffect(() => {
    if (active) {
      setOpacity(0.7);
      const timer = setTimeout(() => setOpacity(0), 500);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
    }
  }, [active]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 0, 0, ' + opacity + ')',
      pointerEvents: 'none',
      zIndex: 999,
      transition: 'background-color 0.5s',
    }} />
  );
};

// Word Card Component - Now bigger and at the top
const WordCard = ({ item, onSpeak }) => {
  return (
    <div
      className="p-8 rounded-lg shadow-lg text-center font-bold select-none"
      style={{ 
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        width: '100%',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '3px solid #3b82f6',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        color: '#1e40af',
        position: 'relative',
        overflow: 'hidden',
        fontSize: '5rem', // Bigger font size
        margin: '0 auto',
        cursor: 'pointer'
      }}
      onClick={() => onSpeak(item.word)}
    >
      {/* Decorative elements */}
      <div 
        style={{
          position: 'absolute',
          top: '-20px',
          left: '-20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-15px',
          right: '-15px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.15)',
          zIndex: 0
        }}
      />
      
      {/* Word text */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {item.word}
      </div>
    </div>
  );
};

// Picture Card Component
const PictureCard = ({ item, onSelect, currentWordId, isAnimating }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleClick = () => {
    if (isAnimating) return;
    
    // Check if this picture's ID matches the current word ID
    const isCorrectMatch = item.id === currentWordId;
    
    // Call the match handler with the result
    onSelect(isCorrectMatch);
  };
  
  return (
    <div
      className="rounded-lg flex justify-center items-center cursor-pointer"
      style={{ 
        backgroundColor: isPressed ? '#f0f9ff' : 'white',
        width: '100%',
        height: '220px',
        fontSize: '6rem',
        margin: '0 auto',
        border: '3px solid ' + (isPressed ? '#3b82f6' : '#e5e7eb'),
        transition: 'all 0.1s ease-out',
        boxShadow: isPressed 
          ? 'inset 0 2px 8px rgba(0,0,0,0.2)' 
          : '0 6px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
        transform: isPressed ? 'scale(0.92) translateY(4px)' : 'scale(1) translateY(0)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onTouchStart={() => {
        if (!isAnimating) {
          setIsPressed(true);
        }
      }}
      onTouchEnd={() => {
        setIsPressed(false);
      }}
      onTouchCancel={() => {
        setIsPressed(false);
      }}
      onMouseDown={() => {
        if (!isAnimating) {
          setIsPressed(true);
        }
      }}
      onMouseUp={() => {
        setIsPressed(false);
      }}
      onMouseLeave={() => {
        setIsPressed(false);
      }}
    >
      {/* Add ripple effect when pressed */}
      {isPressed && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            zIndex: 0,
          }}
        />
      )}
      
      <div style={{ zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.emoji}
      </div>
    </div>
  );
};

// Main Game Component
const WordMatchingGame = () => {
  const [displayPairs, setDisplayPairs] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Function to speak the word using the Web Speech API
  const speakWord = (word) => {
    const audioFilePath = `/sounds/vocabulary/${word}.wav`;
    const audio = new Audio(audioFilePath);
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
      
      // Fallback to Web Speech API if audio file fails
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.8; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  // Initialize a new round with 4 pictures - using useCallback to fix the dependency issue
  const setupNewRound = useCallback(() => {
    setShowConfetti(false);
    setShowIncorrect(false);
    setIsAnimating(false);

    // Shuffle and pick 4 random pairs
    const shuffled = [...allPairs].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffled.slice(0, 4); // Always take 4 pairs
    setDisplayPairs(selectedPairs);

    // Pick one of these as the current word to match
    const randomIndex = Math.floor(Math.random() * 4);
    const selectedWord = selectedPairs[randomIndex];
    setCurrentWord(selectedWord);

    // Speak the word
    speakWord(selectedWord.word);

    // Log detailed debugging info about the round setup
    console.log("==== NEW ROUND SETUP ====");
    console.log(`Selected word: "${selectedWord.word}" (ID: ${selectedWord.id})`);
    console.log("All available pictures:");
    selectedPairs.forEach(pair => {
      console.log(`- ${pair.emoji} (ID: ${pair.id}, Word: "${pair.word}")`);
    });
  }, []);

  // Initialize the first round
  useEffect(() => {
    setupNewRound();
  }, [setupNewRound]); // Fixed dependency array

  const handleSelection = (isCorrect) => {
    if (isAnimating) {
      console.log("Animation already in progress, ignoring selection");
      return;
    }

    setIsAnimating(true);
    setTotalAttempts(prev => prev + 1);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);

      // After a short delay, hide confetti and show next set of pictures
      setTimeout(() => {
        setShowConfetti(false);
        setIsAnimating(false);
        setupNewRound();
      }, 2000);
    } else {
      setShowIncorrect(true);
      setTimeout(() => {
        if (currentWord) {
          speakWord(currentWord.word);
          console.log(`Repeating word after incorrect selection: "${currentWord.word}"`);
        }
        setShowIncorrect(false);
        setIsAnimating(false);
      }, 500);
    }
  };

  // Calculate accuracy percentage
  const accuracy = totalAttempts > 0 
    ? Math.round((correctAnswers / totalAttempts) * 100) 
    : 0;

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4">
      <Confetti active={showConfetti} />
      <IncorrectFlash active={showIncorrect} />
      
      {/* Game title */}
      <h1 className="text-3xl font-bold text-blue-700 mb-4">Vocabulary Matching Game</h1>
      
      {/* Score display */}
      <div className="flex justify-between w-full max-w-4xl mb-2">
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
          Score: {correctAnswers}
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
          Accuracy: {accuracy}%
        </div>
      </div>
      
      {/* Word Card - Now at the top */}
      <div className="w-full max-w-4xl mb-8">
        {currentWord && <WordCard item={currentWord} onSpeak={speakWord} />}
      </div>
      
      {/* Pictures Grid - Always 4 pictures */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
        {displayPairs.map(item => (
          <PictureCard 
            key={item.id} 
            item={item} 
            onSelect={handleSelection} 
            currentWordId={currentWord?.id}
            isAnimating={isAnimating}
          />
        ))}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <WordMatchingGame />
    </div>
  );
};

export default App;