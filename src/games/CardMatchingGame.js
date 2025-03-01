import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardMatchingGame.css';

// Card component - represents a single card in the game
const Card = ({ id, emoji, label, isTarget, isDraggable = true, onDragStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle drag start
  const handleDragStart = (e) => {
    if (!isDraggable) return;
    
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    if (onDragStart) onDragStart(id);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <div 
      className="card"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className="card-inner"
        style={{
          boxShadow: isDragging 
            ? '0 0 20px rgba(52, 152, 219, 0.7)' 
            : isTarget 
              ? '0 0 15px rgba(46, 204, 113, 0.5)' 
              : '0 4px 8px rgba(0, 0, 0, 0.1)',
          border: isDragging 
            ? '2px solid #3498db' 
            : isTarget 
              ? '2px solid #2ecc71' 
              : 'none',
          opacity: isDragging ? 0.8 : 1,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          cursor: isDraggable ? 'grab' : 'default',
        }}
      >
        <div className="card-front">
          <div 
            className="card-emoji"
            style={{
              filter: isDragging ? 'drop-shadow(0 0 5px #3498db)' : 'none',
            }}
          >
            {emoji}
          </div>
          <div className="card-label">{label}</div>
          
          {isTarget && (
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#2ecc71',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            }}>
              Match this
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Target area component
const TargetArea = ({ targetCard, onDrop, isCorrectDrop, showFeedback }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (onDrop) onDrop(cardId);
  };
  
  return (
    <div 
      className="target-area"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: showFeedback 
          ? (isCorrectDrop ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)') 
          : (isDragOver ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)'),
        border: showFeedback 
          ? (isCorrectDrop ? '2px solid #2ecc71' : '2px solid #e74c3c')
          : (isDragOver ? '2px solid #3498db' : '2px dashed #3498db'),
        boxShadow: isDragOver ? '0 0 15px rgba(52, 152, 219, 0.5)' : 'none',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div className="target-instruction" style={{
        transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
      }}>
        {isDragOver ? 'Drop to Match!' : 'Drag the matching card here'}
      </div>
      
      <div className="target-card-container" style={{
        transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
      }}>
        {targetCard && (
          <Card
            id={targetCard.id}
            emoji={targetCard.emoji}
            label={targetCard.label}
            isTarget={true}
            isDraggable={false}
          />
        )}
      </div>
      
      {showFeedback && (
        <div className="feedback-message" style={{
          color: isCorrectDrop ? '#2ecc71' : '#e74c3c',
        }}>
          {isCorrectDrop ? '✓ Correct!' : '✗ Try again!'}
        </div>
      )}
    </div>
  );
};

// Game header component
const GameHeader = ({ score, level, onSoundToggle, soundEnabled, onRestart, theme, onThemeChange }) => {
  return (
    <div className="game-header">
      <h1 className="game-title">Vocabulary Matching</h1>
      <div className="game-score">Score: {score} | Level: {level}</div>
      <div className="game-controls">
        <select 
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          className="control-button"
          style={{ marginRight: '10px' }}
        >
          <option value="animals">Animals</option>
          <option value="fruits">Fruits</option>
          <option value="vehicles">Vehicles</option>
        </select>
        <button 
          className="control-button"
          onClick={onSoundToggle}
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
        <button 
          className="control-button"
          onClick={onRestart}
        >
          🔄 Restart
        </button>
      </div>
    </div>
  );
};

// Game complete component
const GameComplete = ({ score, onRestart, onBackToMenu }) => {
  return (
    <div className="game-complete-overlay">
      <div className="completion-modal">
        <h2 className="completion-title">Congratulations! 🎉</h2>
        <p className="completion-message">
          You completed the game with {score} points!
        </p>
        <div className="button-container">
          <button
            className="primary-button"
            onClick={onRestart}
          >
            Play Again
          </button>
          <button
            className="secondary-button"
            onClick={onBackToMenu}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

// Main game component
const CardMatchingGame = () => {
  const navigate = useNavigate();
  
  // Theme data - emojis and labels for different themes
  const themeData = useMemo(() => ({
    animals: [
      { emoji: '🐶', label: 'Dog' },
      { emoji: '🐱', label: 'Cat' },
      { emoji: '🐭', label: 'Mouse' },
      { emoji: '🐰', label: 'Rabbit' },
      { emoji: '🦊', label: 'Fox' },
      { emoji: '🐻', label: 'Bear' },
      { emoji: '🐼', label: 'Panda' },
      { emoji: '🦁', label: 'Lion' },
      { emoji: '🐯', label: 'Tiger' },
      { emoji: '🐮', label: 'Cow' },
      { emoji: '🐷', label: 'Pig' },
      { emoji: '🐸', label: 'Frog' }
    ],
    fruits: [
      { emoji: '🍎', label: 'Apple' },
      { emoji: '🍌', label: 'Banana' },
      { emoji: '🍇', label: 'Grapes' },
      { emoji: '🍊', label: 'Orange' },
      { emoji: '🍓', label: 'Strawberry' },
      { emoji: '🍉', label: 'Watermelon' },
      { emoji: '🍑', label: 'Peach' },
      { emoji: '🍍', label: 'Pineapple' },
      { emoji: '🥭', label: 'Mango' },
      { emoji: '🍒', label: 'Cherries' },
      { emoji: '🥝', label: 'Kiwi' },
      { emoji: '🥥', label: 'Coconut' }
    ],
    vehicles: [
      { emoji: '🚗', label: 'Car' },
      { emoji: '🚌', label: 'Bus' },
      { emoji: '🚂', label: 'Train' },
      { emoji: '✈️', label: 'Airplane' },
      { emoji: '🚁', label: 'Helicopter' },
      { emoji: '🚢', label: 'Ship' },
      { emoji: '🚲', label: 'Bicycle' },
      { emoji: '🏍️', label: 'Motorcycle' },
      { emoji: '🚜', label: 'Tractor' },
      { emoji: '🚓', label: 'Police Car' },
      { emoji: '🚑', label: 'Ambulance' },
      { emoji: '🚒', label: 'Fire Truck' }
    ]
  }), []);
  
  // Game state
  const [theme, setTheme] = useState('animals');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cards, setCards] = useState([]);
  const [targetCard, setTargetCard] = useState(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'levelComplete', 'completed'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectDrop, setIsCorrectDrop] = useState(false);
  
  // Sound effects
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);
  const gameCompleteSound = useRef(null);
  
  // Initialize sound effects
  useEffect(() => {
    correctSound.current = new Audio('/sounds/correct.mp3');
    incorrectSound.current = new Audio('/sounds/incorrect.mp3');
    gameCompleteSound.current = new Audio('/sounds/game_complete.mp3');
    
    return () => {
      correctSound.current = null;
      incorrectSound.current = null;
      gameCompleteSound.current = null;
    };
  }, []);
  
  // Play sound effect
  const playSound = useCallback((sound) => {
    if (soundEnabled && sound.current) {
      sound.current.currentTime = 0;
      sound.current.play().catch(e => console.error('Error playing sound:', e));
    }
  }, [soundEnabled]);
  
  // Initialize level
  const initializeLevel = useCallback((levelNum) => {
    const numCards = Math.min(3 + levelNum, 8); // Increase cards with level, max 8
    const selectedTheme = themeData[theme];
    
    // Shuffle and select cards for this level
    const shuffledTheme = [...selectedTheme].sort(() => Math.random() - 0.5);
    const levelCards = shuffledTheme.slice(0, numCards).map((card, index) => ({
      ...card,
      id: `card-${index}`
    }));
    
    // Select target card
    const targetIndex = Math.floor(Math.random() * numCards);
    const target = levelCards[targetIndex];
    
    setCards(levelCards);
    setTargetCard(target);
    setShowFeedback(false);
  }, [theme, themeData]);
  
  // Start a new game
  const startNewGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setGameState('playing');
    initializeLevel(1);
  }, [initializeLevel]);
  
  // Initialize game
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);
  
  // Handle card drop on target area
  const handleCardDrop = useCallback((cardId) => {
    const isCorrect = cardId === targetCard.id;
    
    setIsCorrectDrop(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      playSound(correctSound);
      
      // Update score
      const newScore = score + 10;
      setScore(newScore);
      
      // Check if level is complete
      setTimeout(() => {
        if (level >= 10) {
          // Game complete
          setGameState('completed');
          playSound(gameCompleteSound);
        } else {
          // Next level
          const newLevel = level + 1;
          setLevel(newLevel);
          initializeLevel(newLevel);
        }
      }, 1500);
    } else {
      playSound(incorrectSound);
      
      // Reduce score (minimum 0)
      const newScore = Math.max(0, score - 5);
      setScore(newScore);
      
      // Reset feedback after delay
      setTimeout(() => {
        setShowFeedback(false);
      }, 1500);
    }
  }, [targetCard, score, level, playSound, initializeLevel]);
  
  // Handle card drag start
  const handleCardDragStart = useCallback((cardId) => {
    // No need to track the dragged card ID if we're not using it
    // Just keep the function for the Card component
  }, []);
  
  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);
  
  // Handle theme change
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
    // Reset the game with the new theme
    setLevel(1);
    setScore(0);
    setGameState('playing');
    // Use setTimeout to ensure state updates before initializing level
    setTimeout(() => initializeLevel(1), 0);
  }, [initializeLevel]);
  
  return (
    <div className="game-container">
      <div className="vocabulary-game">
        <GameHeader 
          score={score}
          level={level}
          onSoundToggle={toggleSound}
          soundEnabled={soundEnabled}
          onRestart={startNewGame}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
        
        <div className="cards-container">
          {cards.map(card => (
            <Card
              key={card.id}
              id={card.id}
              emoji={card.emoji}
              label={card.label}
              isDraggable={gameState === 'playing' && !showFeedback}
              onDragStart={handleCardDragStart}
              isTarget={false}
            />
          ))}
        </div>
        
        <TargetArea
          targetCard={targetCard}
          onDrop={handleCardDrop}
          isCorrectDrop={isCorrectDrop}
          showFeedback={showFeedback}
        />
      </div>
      
      {gameState === 'completed' && (
        <GameComplete 
          score={score}
          onRestart={startNewGame}
          onBackToMenu={() => navigate('/')}
        />
      )}
    </div>
  );
};

export default CardMatchingGame; 