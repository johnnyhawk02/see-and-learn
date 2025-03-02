import React, { useState, useEffect } from 'react';

// Data for the game
const allPairs = [
  { id: 1, word: "cat", emoji: "🐱" },
  { id: 2, word: "dog", emoji: "🐶" },
  { id: 3, word: "sun", emoji: "☀️" },
  { id: 4, word: "apple", emoji: "🍎" },
  { id: 5, word: "house", emoji: "🏠" },
  { id: 6, word: "train", emoji: "🚂" },
  { id: 7, word: "plane", emoji: "✈️" },
  { id: 8, word: "snake", emoji: "🐍" },
  { id: 9, word: "rainbow", emoji: "🌈" },
  { id: 10, word: "football", emoji: "🏈" },
  { id: 11, word: "snowman", emoji: "☃️" },
  { id: 12, word: "pancake", emoji: "🥞" }
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
const WordCard = ({ item }) => {
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
        margin: '0 auto'
      }}
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
  
  // Function to speak the word using the Web Speech API with improved voice selection
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Get all available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a good English voice - prioritize these voices in order:
      // 1. Google UK English
      // 2. Any UK English voice
      // 3. Any English voice
      // 4. Default to first available voice if none of the above are found
      
      // Look for Google UK English voice first (known for clarity)
      let selectedVoice = voices.find(voice => 
        voice.name.includes('Google UK English') || 
        voice.name.includes('British English')
      );
      
      // If not found, try any UK English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-GB') || 
          voice.lang.includes('en_GB')
        );
      }
      
      // If still not found, try any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('en')
        );
      }
      
      // Apply the selected voice if found
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name}`);
      }
      
      // Configure the voice for better clarity
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for emphasis
      utterance.volume = 1.0; // Full volume
      
      // Speak the word
      window.speechSynthesis.speak(utterance);
      console.log(`Speaking word: "${word}"`);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  // Initialize a new round
  const setupNewRound = () => {
    // Ensure any visual effects are cleared
    setShowConfetti(false);
    setShowIncorrect(false);
    setIsAnimating(false);
    
    // Shuffle and pick 4 random pairs
    const shuffled = [...allPairs].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffled.slice(0, 4);
    setDisplayPairs(selectedPairs);
    
    // Pick one of these 4 as the current word to match
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
  };

  // Initialize voices and first round
  useEffect(() => {
    // Load voices on component mount
    // This is needed because voices might not be immediately available in some browsers
    if ('speechSynthesis' in window) {
      // Some browsers (like Chrome) load voices asynchronously
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log("Voices loaded:", window.speechSynthesis.getVoices().length);
        };
      } else {
        console.log("Voices immediately available:", window.speechSynthesis.getVoices().length);
      }
    }
    
    setupNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelection = (isCorrect) => {
    if (isAnimating) {
      console.log("Animation already in progress, ignoring selection");
      return;
    }
    
    setIsAnimating(true);
    
    if (isCorrect) {
      // For correct matches, show confetti and move to next round
      setShowConfetti(true);
      
      // After a short delay, hide confetti and show next set of pictures
      setTimeout(() => {
        setShowConfetti(false);
        setIsAnimating(false);
        setupNewRound();
      }, 2000);
    } else {
      // Flash red for incorrect selections
      setShowIncorrect(true);
      
      // Say the word again when selection is incorrect
      setTimeout(() => {
        // Speak the word again for incorrect selections
        if (currentWord) {
          speakWord(currentWord.word);
          console.log(`Repeating word after incorrect selection: "${currentWord.word}"`);
        }
        
        setShowIncorrect(false);
        setIsAnimating(false);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4">
      <Confetti active={showConfetti} />
      <IncorrectFlash active={showIncorrect} />
      
      {/* Word Card - Now at the top */}
      <div className="w-full max-w-4xl mb-10">
        {currentWord && <WordCard item={currentWord} />}
      </div>
      
      {/* Pictures Grid - Responsive and fills more of the screen */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
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