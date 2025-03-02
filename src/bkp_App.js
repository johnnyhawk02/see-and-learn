import React, { useState, useEffect, useCallback } from 'react';

// Data for the game - using image paths directly from the new location
const allPairs = [
  { id: 1, word: "bed", image: "/card-images/bed.png" },
  { id: 2, word: "hat", image: "/card-images/hat.png" },
  { id: 3, word: "pig", image: "/card-images/pig.png" },
  { id: 4, word: "cup", image: "/card-images/cup.png" },
  { id: 5, word: "car", image: "/card-images/car.png" },
  { id: 6, word: "bag", image: "/card-images/bag.png" },
  { id: 7, word: "doll", image: "/card-images/doll.png" },
  { id: 8, word: "fish", image: "/card-images/fish.png" },
  { id: 9, word: "cat", image: "/card-images/cat.png" },
  { id: 10, word: "ball", image: "/card-images/ball.png" },
  { id: 11, word: "dog", image: "/card-images/dog.png" },
  { id: 12, word: "keys", image: "/card-images/keys.png" },
  { id: 13, word: "table", image: "/card-images/table.png" },
  { id: 14, word: "book", image: "/card-images/book.png" },
  { id: 15, word: "daddy", image: "/card-images/daddy.png" },
  { id: 16, word: "mummy", image: "/card-images/mummy.png" },
  { id: 17, word: "apple", image: "/card-images/apple.png" },
  { id: 18, word: "baby", image: "/card-images/baby.png" },
  { id: 19, word: "cow", image: "/card-images/cow.png" },
  { id: 20, word: "spoon", image: "/card-images/spoon.png" },
  { id: 21, word: "banana", image: "/card-images/banana.png" },
  { id: 22, word: "duck", image: "/card-images/duck.png" },
  { id: 23, word: "socks", image: "/card-images/socks.png" },
  { id: 24, word: "bath", image: "/card-images/bath.png" },
  { id: 25, word: "chair", image: "/card-images/chair.png" },
  { id: 26, word: "brush", image: "/card-images/brush.png" },
  { id: 27, word: "shoes", image: "/card-images/shoes.png" },
  { id: 28, word: "flower", image: "/card-images/flower.png" },
  { id: 29, word: "bear", image: "/card-images/bear.png" },
  { id: 30, word: "drink", image: "/card-images/drink.png" },
  { id: 31, word: "sheep", image: "/card-images/sheep.png" },
  { id: 32, word: "nose", image: "/card-images/nose.png" },
  { id: 33, word: "wash", image: "/card-images/wash.png" },
  { id: 34, word: "coat", image: "/card-images/coat.png" },
  { id: 35, word: "eating", image: "/card-images/eating.png" },
  { id: 36, word: "biscuit", image: "/card-images/biscuit.png" },
  { id: 37, word: "eyes", image: "/card-images/eyes.png" },
  { id: 38, word: "sitting", image: "/card-images/sitting.png" },
  { id: 39, word: "blocks", image: "/card-images/blocks.png" },
  { id: 40, word: "mouth", image: "/card-images/mouth.png" },
  { id: 41, word: "sleeping", image: "/card-images/sleeping.png" },
  { id: 42, word: "bird", image: "/card-images/bird.png" },
  { id: 43, word: "hair", image: "/card-images/hair.png" },
  { id: 44, word: "crying", image: "/card-images/crying.png" },
  { id: 45, word: "phone", image: "/card-images/phone.png" },
  { id: 46, word: "walk", image: "/card-images/walk.png" },
  { id: 47, word: "drinking", image: "/card-images/drinking.png" },
  { id: 48, word: "brushing", image: "/card-images/brushing.png" }
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

// Word Card Component
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
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        color: 'black',
        position: 'relative',
        overflow: 'hidden',
        fontSize: '5rem',
        margin: '0 auto',
        cursor: 'pointer'
      }}
    >
      {/* Word text - made clickable */}
      <div 
        style={{ position: 'relative', zIndex: 1, cursor: 'pointer' }}
        onClick={() => onSpeak(item.word)}
      >
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
        position: 'relative',
        overflow: 'hidden',
        // Maintain 16:9 aspect ratio
        paddingTop: '56.25%', // 9 / 16 * 100 = 56.25%
        margin: '0 auto',
        border: '3px solid ' + (isPressed ? '#3b82f6' : '#e5e7eb'),
        transition: 'all 0.1s ease-out',
        boxShadow: isPressed 
          ? 'inset 0 2px 8px rgba(0,0,0,0.2)' 
          : '0 6px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
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
      
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <img 
          src={item.image} 
          alt={item.word} 
          style={{ 
            position: 'absolute', // Positioning the image absolutely
            top: 0, 
            left: 0, 
            width: '100%', // Fill the width of the container
            height: '100%', // Fill the height of the container
            objectFit: 'cover' // Ensures the image covers the area without distortion
          }} 
        />
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
      console.log(`- ${pair.image} (ID: ${pair.id}, Word: "${pair.word}")`);
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

    const playSound = (soundPath, callback) => {
      const audio = new Audio(soundPath);
      audio.play().catch(error => {
        console.error("Error playing sound:", error);
      });
      audio.onended = callback; // Call the callback when the sound finishes
    };

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);

      // Play the clapping sound and wait for it to finish
      playSound('/sounds/clapping.mp3', () => {
        setShowConfetti(false);
        setIsAnimating(false);
        setupNewRound();
      });
    } else {
      // Play the wrong sound and wait for it to finish
      playSound('/sounds/wrong.wav', () => {
        if (currentWord) {
          speakWord(currentWord.word);
          console.log(`Repeating word after incorrect selection: "${currentWord.word}"`);
        }
        setShowIncorrect(false);
        setIsAnimating(false);
      });
      setShowIncorrect(true);
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

      {/* Accuracy Display - Bottom right corner */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '0.8rem', color: 'black' }}>
        Accuracy: {accuracy}%
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