import React, { useState, useEffect, useRef } from 'react';

// Data for the game - using image paths directly from the location
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

// Word Card Component (Drop Target)
const WordCard = ({ item, checkMatch, onSpeak, isActive }) => {
  return (
    <div
      className="word-drop-target p-8 rounded-lg shadow-lg text-center font-bold select-none"
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
        cursor: 'pointer',
        border: isActive ? '3px dashed #3b82f6' : '3px solid transparent',
        transition: 'all 0.2s ease-out',
      }}
      onClick={() => onSpeak(item.word)}
      data-word-id={item.id}
    >
      {/* Word text */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {item.word}
      </div>
    </div>
  );
};

// Picture Card Component (Draggable)
const PictureCard = ({ item, isDragging, onDragStart, onDragEnd, onItemSelected }) => {
  // For standard desktop drag events
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', item.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item.id);
  };
  
  const handleDragEnd = () => {
    onDragEnd();
  };
  
  // For iPad touch events - optimized for direct selection
  const handleTouchStart = (e) => {
    // Store the item ID
    e.currentTarget.dataset.itemId = item.id;
    
    // Visual feedback
    onDragStart(item.id);
  };
  
  const handleTouchEnd = () => {
    // Simple selection model for iPad - just select the item
    onItemSelected(item.id);
    onDragEnd();
  };
  
  return (
    <div
      className={`rounded-lg flex justify-center items-center ${isDragging ? 'opacity-50' : ''} ${isDragging ? 'selected-item' : ''}`}
      style={{ 
        backgroundColor: 'white',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '56.25%', // Maintain 16:9 aspect ratio
        margin: '0 auto',
        border: isDragging ? '3px solid #3b82f6' : '3px solid #e5e7eb',
        transition: 'all 0.2s ease-out',
        boxShadow: '0 6px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
        touchAction: 'none', // Important for touch events
        userSelect: 'none',
        cursor: 'pointer',
      }}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-item-id={item.id}
    >
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
            position: 'absolute',
            top: 0, 
            left: 0, 
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }} 
          draggable="false" // Prevent the image itself from being draggable
        />
      </div>
    </div>
  );
};

// Main Game Component
const WordImageDragGame = () => {
  const [displayPairs, setDisplayPairs] = useState([]);
  const [displayWord, setDisplayWord] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isIPad, setIsIPad] = useState(false);
  
  // Function to speak the word using audio files
  const speakWord = (word) => {
    const audioFilePath = `/sounds/vocabulary/${word}.wav`;
    const audio = new Audio(audioFilePath);
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
  };

  // Initialize a new round with 4 pictures but only 1 word
  const setupNewRound = () => {
    setShowConfetti(false);
    setShowIncorrect(false);
    setIsAnimating(false);
    setSelectedItemId(null);

    // Shuffle and pick 4 random pairs
    const shuffled = [...allPairs].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffled.slice(0, 4);
    
    // Pick one of these as the target word
    const randomIndex = Math.floor(Math.random() * 4);
    const selectedWord = selectedPairs[randomIndex];
    
    // Set the display pairs (images) and the single word to match
    setDisplayPairs(selectedPairs);
    setDisplayWord(selectedWord);
    
    // Speak the instructions and the selected word
    setTimeout(() => {
      const audio = new Audio('/sounds/match-drag.mp3'); // Create an instruction audio
      audio.play().catch(error => {
        console.error("Error playing instructions:", error);
      });
      
      // Speak the target word after a short delay
      setTimeout(() => {
        if (selectedWord) {
          speakWord(selectedWord.word);
        }
      }, 1000);
    }, 500);
  };

  // Check if we're on iPad or touch device
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIPad(isTouch || isIOS);
    
    // Add CSS for iPad optimization
    const style = document.createElement('style');
    style.textContent = `
      .selected-item {
        border: 3px solid #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
        transform: scale(0.95);
      }
      .word-drop-target.highlight {
        background-color: #f0f9ff !important;
        border: 3px dashed #3b82f6 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Initialize the first round
  useEffect(() => {
    setupNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle the completion of item selection (for both drag and iPad tap)
  const handleItemSelected = (itemId) => {
    if (isAnimating || !displayWord) return;
    
    setIsAnimating(true);
    setTotalAttempts(prev => prev + 1);
    
    // Find the corresponding image
    const selectedImage = displayPairs.find(item => item.id === itemId);
    
    // Check if it's a correct match
    const isCorrect = selectedImage && selectedImage.word === displayWord.word;
    
    const playSound = (soundPath, callback) => {
      const audio = new Audio(soundPath);
      audio.play().catch(error => {
        console.error("Error playing sound:", error);
      });
      audio.onended = callback;
    };
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);
      
      // Play the clapping sound and wait for it to finish
      playSound('/sounds/clapping.mp3', () => {
        setTimeout(() => {
          setShowConfetti(false);
          setIsAnimating(false);
          setupNewRound();
        }, 1000);
      });
    } else {
      // Play the wrong sound
      playSound('/sounds/wrong.wav', () => {
        setShowIncorrect(false);
        setIsAnimating(false);
        
        // Always repeat the target word after wrong answer
        if (displayWord) {
          speakWord(displayWord.word);
        }
      });
      setShowIncorrect(true);
    }
  };

  // For desktop: handle standard drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (isAnimating || !displayWord) return;
    
    const draggedItemId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    handleItemSelected(draggedItemId);
  };

  // Handle drag start (for both drag and iPad tap)
  const handleDragStart = (itemId) => {
    setSelectedItemId(itemId);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    // For iPad direct selection mode, don't clear selection immediately
    if (!isIPad) {
      setSelectedItemId(null);
    }
  };
  
  // Handle dragover for standard desktop
  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
    e.currentTarget.classList.add('highlight');
  };
  
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('highlight');
  };

  // Calculate accuracy percentage
  const accuracy = totalAttempts > 0 
    ? Math.round((correctAnswers / totalAttempts) * 100) 
    : 0;

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4">
      <Confetti active={showConfetti} />
      <IncorrectFlash active={showIncorrect} />
      
      {/* Single Word - Drop target */}
      <div className="w-full max-w-4xl mb-8">
        {displayWord && (
          <div 
            className="word-drop-target" 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => isIPad && selectedItemId && handleItemSelected(selectedItemId)}
          >
            <WordCard 
              item={displayWord} 
              onSpeak={speakWord}
              isActive={selectedItemId !== null}
            />
          </div>
        )}
      </div>
      
      {/* Pictures Grid - Selectable and Draggable items */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
        {displayPairs.map(item => (
          <PictureCard 
            key={`pic-${item.id}`} 
            item={item} 
            isDragging={selectedItemId === item.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onItemSelected={handleItemSelected}
          />
        ))}
      </div>

      {/* Accuracy Display */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '0.8rem', color: 'black' }}>
        Accuracy: {accuracy}%
      </div>
      
      {/* iPad Selection Method Instructions */}
      {isIPad && (
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '0.8rem', color: 'black' }}>
          Tap an image, then tap the word
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <WordImageDragGame />
    </div>
  );
};

export default App;