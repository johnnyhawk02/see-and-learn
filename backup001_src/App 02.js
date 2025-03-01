import React, { useState, useEffect } from 'react';

const WordMatchingGame = () => {
  // Game data with words and corresponding images
  const gameData = [
    // Animals
    { word: 'dog', options: ['🐶', '🍎', '🚗'], correct: '🐶' },
    { word: 'cat', options: ['🐱', '🍌', '🚌'], correct: '🐱' },
    { word: 'mouse', options: ['🐭', '🍊', '🚲'], correct: '🐭' },
    { word: 'rabbit', options: ['🐰', '🍓', '🚂'], correct: '🐰' },
    { word: 'bear', options: ['🐻', '🍇', '✈️'], correct: '🐻' },
    { word: 'koala', options: ['🐨', '🍉', '🚁'], correct: '🐨' },
    { word: 'penguin', options: ['🐧', '🎁', '🌮'], correct: '🐧' },
    { word: 'frog', options: ['🐸', '🧁', '🏀'], correct: '🐸' },
    
    // Fruits
    { word: 'apple', options: ['🍎', '🐶', '☀️'], correct: '🍎' },
    { word: 'banana', options: ['🍌', '🐱', '☁️'], correct: '🍌' },
    { word: 'orange', options: ['🍊', '🐭', '🌧️'], correct: '🍊' },
    { word: 'strawberry', options: ['🍓', '🐰', '❄️'], correct: '🍓' },
    { word: 'grapes', options: ['🍇', '🐻', '⚡'], correct: '🍇' },
    { word: 'watermelon', options: ['🍉', '🐨', '🌈'], correct: '🍉' },
    { word: 'peach', options: ['🍑', '🎈', '🔑'], correct: '🍑' },
    { word: 'pear', options: ['🍐', '🧸', '📱'], correct: '🍐' },
    
    // Vehicles
    { word: 'car', options: ['🚗', '😊', '🍎'], correct: '🚗' },
    { word: 'bus', options: ['🚌', '😢', '🍌'], correct: '🚌' },
    { word: 'bicycle', options: ['🚲', '😠', '🍊'], correct: '🚲' },
    { word: 'train', options: ['🚂', '👆', '🍓'], correct: '🚂' },
    { word: 'airplane', options: ['✈️', '✌️', '🍇'], correct: '✈️' },
    { word: 'helicopter', options: ['🚁', '👌', '🍉'], correct: '🚁' },
    { word: 'boat', options: ['🚢', '🔥', '🦄'], correct: '🚢' },
    { word: 'rocket', options: ['🚀', '⚽', '🥦'], correct: '🚀' },
    
    // Weather
    { word: 'sunny', options: ['☀️', '🚗', '🐶'], correct: '☀️' },
    { word: 'cloudy', options: ['☁️', '🚌', '🐱'], correct: '☁️' },
    { word: 'rainy', options: ['🌧️', '🚲', '🐭'], correct: '🌧️' },
    { word: 'snowy', options: ['❄️', '🚂', '🐰'], correct: '❄️' },
    { word: 'lightning', options: ['⚡', '✈️', '🐻'], correct: '⚡' },
    { word: 'rainbow', options: ['🌈', '🚁', '🐨'], correct: '🌈' },
    
    // Colors (shown with colored objects)
    { word: 'red', options: ['🍎', '✌️', '🌧️'], correct: '🍎' },
    { word: 'orange', options: ['🍊', '👌', '☀️'], correct: '🍊' },
    
    // Numbers (with corresponding finger counts)
    { word: 'one', options: ['👆', '🍕', '☁️'], correct: '👆' },
    { word: 'two', options: ['✌️', '🍔', '❄️'], correct: '✌️' },
    { word: 'three', options: ['👌', '🍦', '🌈'], correct: '👌' },
    { word: 'four', options: ['4️⃣', '🌹', '🐝'], correct: '4️⃣' },
    { word: 'five', options: ['5️⃣', '🏈', '📚'], correct: '5️⃣' },
    
    // Emotions
    { word: 'happy', options: ['😊', '🚗', '🍕'], correct: '😊' },
    { word: 'sad', options: ['😢', '🚌', '🍔'], correct: '😢' },
    { word: 'angry', options: ['😠', '🚲', '🍦'], correct: '😠' },
    { word: 'surprised', options: ['😲', '⚾', '🌻'], correct: '😲' },
    { word: 'sleepy', options: ['😴', '🥪', '🎮'], correct: '😴' },
    
    // Food
    { word: 'pizza', options: ['🍕', '😊', '👆'], correct: '🍕' },
    { word: 'burger', options: ['🍔', '😢', '✌️'], correct: '🍔' },
    { word: 'ice cream', options: ['🍦', '😠', '👌'], correct: '🍦' },
    { word: 'taco', options: ['🌮', '🦊', '🌟'], correct: '🌮' },
    { word: 'cupcake', options: ['🧁', '🐢', '🌞'], correct: '🧁' },
    
    // Objects
    { word: 'book', options: ['📚', '🦁', '🚢'], correct: '📚' },
    { word: 'ball', options: ['⚽', '🐯', '🍋'], correct: '⚽' },
    { word: 'gift', options: ['🎁', '🦒', '🚀'], correct: '🎁' },
    { word: 'balloon', options: ['🎈', '🦁', '🍰'], correct: '🎈' },
    { word: 'teddy bear', options: ['🧸', '🌵', '🍩'], correct: '🧸' },
    { word: 'phone', options: ['📱', '🐘', '🌎'], correct: '📱' }
  ];
  
  // Shuffle the array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Shuffle options for each question
  const shuffleOptions = (data) => {
    return data.map(item => {
      // Create a copy of options array
      const shuffledOptions = shuffleArray([...item.options]);
      
      // Return new item with shuffled options
      return {
        ...item,
        options: shuffledOptions
      };
    });
  };
  
  const [shuffledData] = useState(() => shuffleOptions(shuffleArray(gameData)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragging, setDragging] = useState(null);
  const [dropped, setDropped] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItems, setDraggedItems] = useState([]);
  
  // Add global style to prevent scrollbars during drag
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body.dragging {
        overflow: hidden;
        margin: 0;
        height: 100vh;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Function to speak the word
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9; // Slightly slower rate for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for child-friendly voice
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Speak the word when the current question changes
  useEffect(() => {
    if (shuffledData.length > 0 && !showSuccess && !showError) {
      // Small delay to ensure the new word is visible first
      const timer = setTimeout(() => {
        speakWord(shuffledData[currentIndex].word);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, shuffledData, showSuccess, showError]);
  
  // Reset error state after a short delay
  useEffect(() => {
    let timer;
    if (showError) {
      timer = setTimeout(() => {
        setShowError(false);
        setDropped(null);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showError]);
  
  // Move to next question after delay when success
  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % shuffledData.length;
        setCurrentIndex(nextIndex);
        setDropped(null);
        setShowSuccess(false);
        // Reset dragged items when moving to next question
        setDraggedItems([]);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [showSuccess, currentIndex, shuffledData.length]);
  
  // Prevent default to allow drop
  const allowDrop = (e) => {
    e.preventDefault();
  };
  
  // Handle drop in the target area
  const handleDrop = () => {
    if (dragging) {
      const currentQuestion = shuffledData[currentIndex];
      const isCorrect = dragging === currentQuestion.correct;
      
      setDropped(dragging);
      setDragging(null);
      setIsDragging(false);
      
      if (isCorrect) {
        // Only add correct answers to draggedItems
        setDraggedItems(prev => [...prev, dragging]);
        setShowSuccess(true);
      } else {
        setShowError(true);
      }
      
      document.body.classList.remove('dragging');
    }
  };
  
  // Create a custom drag ghost that follows the cursor
  const createDragGhost = (emoji) => {
    // Create ghost element
    const ghostElem = document.createElement('div');
    ghostElem.innerHTML = emoji;
    ghostElem.style.position = 'fixed';
    ghostElem.style.width = '120px';
    ghostElem.style.height = '120px';
    ghostElem.style.borderRadius = '50%';
    ghostElem.style.backgroundColor = 'white';
    ghostElem.style.border = '4px solid #93C5FD';
    ghostElem.style.display = 'flex';
    ghostElem.style.alignItems = 'center';
    ghostElem.style.justifyContent = 'center';
    ghostElem.style.fontSize = '4.5rem';
    ghostElem.style.zIndex = '1000';
    ghostElem.style.pointerEvents = 'none';
    ghostElem.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
    ghostElem.style.transform = 'translateY(-5px)';
    document.body.appendChild(ghostElem);
    
    // Track the cursor and update the ghost position
    const moveGhost = (moveEvent) => {
      ghostElem.style.left = `${moveEvent.clientX - 60}px`;
      ghostElem.style.top = `${moveEvent.clientY - 60}px`;
    };
    
    document.addEventListener('dragover', moveGhost);
    
    // Return a cleanup function
    return () => {
      document.removeEventListener('dragover', moveGhost);
      if (document.body.contains(ghostElem)) {
        document.body.removeChild(ghostElem);
      }
    };
  };
  
  // Handle drag start
  const handleDragStart = (e, emoji) => {
    // Prevent dragging if already in success/error state
    if (showSuccess || showError || isDragging) {
      e.preventDefault();
      return;
    }
    
    setDragging(emoji);
    setIsDragging(true);
    document.body.classList.add('dragging');
    
    // Create a transparent drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
    
    // Create our custom drag ghost
    const cleanupGhost = createDragGhost(emoji);
    
    // Clean up when drag ends
    const handleDragEnd = () => {
      cleanupGhost();
      document.removeEventListener('dragend', handleDragEnd);
      
      // Reset the dragging state even if not dropped in the target
      setDragging(null);
      setIsDragging(false);
      document.body.classList.remove('dragging');
    };
    
    document.addEventListener('dragend', handleDragEnd);
  };
  
  const currentQuestion = shuffledData[currentIndex];
  
  // Microphone icon using HTML/SVG instead of the Lucide component
  const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
  );
  
  return (
    <div className="flex flex-col items-center justify-between h-screen bg-blue-50 p-4 overflow-hidden">
      {/* Top section with target and word */}
      <div className="mt-8 text-center">
        {/* Target circle */}
        <div 
          className="target-circle w-32 h-32 rounded-full border-4 mx-auto flex items-center justify-center"
          className={`target-circle w-32 h-32 rounded-full border-4 mx-auto flex items-center justify-center
            ${showSuccess ? 'border-green-500 bg-green-100' : 
              showError ? 'border-red-500 bg-red-100' : 'border-blue-400'}`}
          onDrop={handleDrop}
          onDragOver={allowDrop}
          style={{
            boxShadow: dropped ? 'none' : 'inset 0 4px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {dropped ? (
            <span className="text-6xl">{dropped}</span>
          ) : (
            <div 
              className="text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" 
              onClick={() => speakWord(currentQuestion.word)}
            >
              <MicrophoneIcon />
            </div>
          )}
        </div>

        <h1 className="text-4xl font-bold mt-6 text-blue-700">
          {currentQuestion.word.toLowerCase()}
        </h1>
      </div>

      {/* Feedback indicator */}
      <div className="h-16 flex items-center justify-center">
        {showSuccess && (
          <div className="text-5xl animate-bounce">⭐</div>
        )}
      </div>

      {/* Image options */}
      <div className="flex justify-around w-full mb-16">
        {currentQuestion.options.map((emoji, index) => (
          <div 
            key={index}
            className={`w-24 h-24 rounded-full border-4 border-blue-300 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-md ${(dragging === emoji || draggedItems.includes(emoji)) ? 'bg-transparent' : 'bg-white'}`}
            style={{
              boxShadow: (dragging === emoji || draggedItems.includes(emoji)) ? 'inset 0 4px 8px rgba(0, 0, 0, 0.2)' : ''
            }}
            draggable={!showSuccess && !showError && !isDragging && !draggedItems.includes(emoji)}
            onDragStart={(e) => handleDragStart(e, emoji)}
          >
            {!(dragging === emoji || draggedItems.includes(emoji)) && (
              <span className="text-6xl">{emoji}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WordMatchingGame;