import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

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

// Choose the right backend based on device
const getBackend = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isMobile ? TouchBackend : HTML5Backend;
};

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

// Word Card Component
const WordCard = ({ item, isAnimating }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'WORD',
    item: { id: item.id, word: item.word, type: 'WORD' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isAnimating, // Disable dragging during animations
  });

  return (
    <div
      ref={drag}
      className="p-8 rounded-lg shadow-md text-center text-4xl font-bold select-none"
      style={{ 
        opacity: isDragging ? 0.7 : 1, // Slightly less transparent when dragging
        backgroundColor: 'white',
        cursor: isAnimating ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        width: '320px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isDragging ? '2px dashed #3b82f6' : (isAnimating ? '1px solid #d1d5db' : '1px solid #e5e7eb')
      }}
    >
      {item.word}
    </div>
  );
};

// Removed CustomDragLayer component since it's not being used

// Picture Card Component
const PictureCard = ({ item, onMatch, currentWordId, isAnimating }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'WORD',
    canDrop: () => !isAnimating, // Correct way to prevent drops during animations
    drop: (draggedItem) => {
      // Check if this picture's ID matches the current word ID
      const isCorrectMatch = item.id === currentWordId;
      
      // Detailed logging for debugging
      console.log(`Dropped "${draggedItem.word}" onto emoji "${item.emoji}"`);
      console.log(`Picture ID: ${item.id}, Current Word ID: ${currentWordId}`);
      console.log(`Match result: ${isCorrectMatch ? "CORRECT" : "INCORRECT"}`);
      
      // Call the match handler with the result
      onMatch(isCorrectMatch);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className="rounded-lg shadow-md flex justify-center items-center"
      style={{ 
        backgroundColor: isOver ? '#e0f2fe' : 'white',
        width: '100%',
        height: '220px',
        fontSize: '6rem',
        margin: '0 auto',
        border: isOver ? '2px dashed #3b82f6' : '1px solid #e5e7eb'
      }}
    >
      {item.emoji}
    </div>
  );
};

  // Main Game Component
const WordMatchingGame = () => {
  // Removed unused debug state
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

  const handleMatch = (isCorrect) => {
    if (isAnimating) return; // Prevent handling matches during animations
    
    setIsAnimating(true); // Start animation state
    
    if (isCorrect) {
      // Show confetti for correct matches
      setShowConfetti(true);
      
      // After animation, hide confetti and show next set of pictures
      setTimeout(() => {
        setShowConfetti(false);
        setIsAnimating(false); // End animation state
        setupNewRound();
      }, 2000);
    } else {
      // Flash red for incorrect matches, but don't advance to next round
      setShowIncorrect(true);
      
      // Say the word again when match is incorrect
      setTimeout(() => {
        // Speak the word again for incorrect matches
        if (currentWord) {
          speakWord(currentWord.word);
          console.log(`Repeating word after incorrect match: "${currentWord.word}"`);
        }
        
        setShowIncorrect(false);
        setIsAnimating(false); // End animation state
      }, 500);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4">
      <Confetti active={showConfetti} />
      <IncorrectFlash active={showIncorrect} />
      
      {/* Pictures Grid - Responsive and fills more of the screen */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl mb-10">
        {displayPairs.map(item => (
          <PictureCard 
            key={item.id} 
            item={item} 
            onMatch={handleMatch} 
            currentWordId={currentWord?.id}
            isAnimating={isAnimating}
          />
        ))}
      </div>
      
      {/* Word Card - Below pictures */}
      <div className="flex justify-center w-full max-w-4xl">
        {currentWord && <WordCard item={currentWord} isAnimating={isAnimating} />}
      </div>
    </div>
  );
};

// Wrap with DndProvider to enable drag and drop
const App = () => {
  const Backend = getBackend();
  
  return (
    <DndProvider backend={Backend} options={{ enableMouseEvents: true }}>
      <div className="h-screen w-screen bg-gray-50 overflow-hidden">
        <WordMatchingGame />
      </div>
    </DndProvider>
  );
};

export default App;