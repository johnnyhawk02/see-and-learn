import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const WordMatchingGame = () => {
  // Game data - pairs of emojis and their words
  const emojiWordPairs = [
    { emoji: '🐶', word: 'dog' },
    { emoji: '🐱', word: 'cat' },
    { emoji: '🐭', word: 'mouse' },
    { emoji: '🐰', word: 'rabbit' },
    { emoji: '🐻', word: 'bear' },
    { emoji: '🐨', word: 'koala' },
    { emoji: '🐧', word: 'penguin' },
    { emoji: '🐸', word: 'frog' },
    { emoji: '🦁', word: 'lion' },
    { emoji: '🐯', word: 'tiger' },
    { emoji: '🦊', word: 'fox' },
    { emoji: '🦒', word: 'giraffe' },
    { emoji: '🦝', word: 'raccoon' },
    { emoji: '🍎', word: 'apple' },
    { emoji: '🍌', word: 'banana' },
    { emoji: '🍊', word: 'orange' },
    { emoji: '🍓', word: 'strawberry' },
    { emoji: '🍇', word: 'grapes' },
    { emoji: '🍉', word: 'watermelon' },
    { emoji: '🍑', word: 'peach' },
    { emoji: '🍐', word: 'pear' },
    { emoji: '🥝', word: 'kiwi' },
    { emoji: '🚗', word: 'car' },
    { emoji: '🚌', word: 'bus' },
    { emoji: '🚲', word: 'bicycle' },
    { emoji: '🚂', word: 'train' },
    { emoji: '✈️', word: 'airplane' },
    { emoji: '🚁', word: 'helicopter' },
    { emoji: '🚢', word: 'boat' },
    { emoji: '🚀', word: 'rocket' },
    { emoji: '☀️', word: 'sunny' },
    { emoji: '☁️', word: 'cloudy' },
    { emoji: '🌧️', word: 'rainy' },
    { emoji: '❄️', word: 'snowy' },
    { emoji: '⚡', word: 'lightning' },
    { emoji: '🌈', word: 'rainbow' },
    { emoji: '😊', word: 'happy' },
    { emoji: '😢', word: 'sad' },
    { emoji: '😠', word: 'angry' },
    { emoji: '😲', word: 'surprised' },
    { emoji: '😴', word: 'sleepy' },
    { emoji: '🍕', word: 'pizza' },
    { emoji: '🍔', word: 'burger' },
    { emoji: '🍦', word: 'ice cream' },
    { emoji: '🌮', word: 'taco' },
    { emoji: '🧁', word: 'cupcake' },
    { emoji: '🍩', word: 'donut' },
    { emoji: '📚', word: 'book' },
    { emoji: '⚽', word: 'ball' },
    { emoji: '🎁', word: 'gift' },
    { emoji: '🎈', word: 'balloon' },
    { emoji: '🧸', word: 'teddy bear' },
    { emoji: '📱', word: 'phone' }
  ];
  
  // Helper: Shuffle an array using Fisher-Yates
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Create a question by picking 3 random emojis and choosing one as correct
  const generateQuestion = (emojiData) => {
    const shuffled = shuffleArray([...emojiData]);
    const selectedOptions = shuffled.slice(0, 3);
    const correctIndex = Math.floor(Math.random() * 3);
    const correctItem = selectedOptions[correctIndex];
    return {
      options: selectedOptions.map(item => item.emoji),
      word: correctItem.word,
      correct: correctItem.emoji
    };
  };
  
  // Generate multiple questions
  const generateQuestions = (emojiData, count = 15) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(generateQuestion(emojiData));
    }
    return questions;
  };
  
  // State variables
  const [questions] = useState(() => generateQuestions(emojiWordPairs, 20));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dropped, setDropped] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [usedItems, setUsedItems] = useState([]);
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  
  // Refs for DOM elements
  const emojiRefs = useRef({});
  const targetCircleRef = useRef(null);
  
  // Function to speak the word
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Speak the word when the question changes
  useEffect(() => {
    if (questions.length > 0 && !showSuccess && !showError && !transitioning) {
      const timer = setTimeout(() => {
        speakWord(questions[currentIndex].word);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, questions, showSuccess, showError, transitioning]);
  
  // Reset error state after a delay
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
  
  // Move to next question after success
  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setTimeout(() => {
        setDropped(null);
        setUsedItems(questions[currentIndex].options);
        setShowSuccess(false);
        setTransitioning(true);
      }, 1600);
    }
    return () => clearTimeout(timer);
  }, [showSuccess, currentIndex, questions]);
  
  // Handle transition to the next question
  useEffect(() => {
    let timer;
    if (transitioning) {
      timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % questions.length;
        setCurrentIndex(nextIndex);
        setTransitioning(false);
        setUsedItems([]);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [transitioning, currentIndex, questions.length]);
  
  // --- FlyingEmoji Component ---
  // We use useMemo to create a stable initial style based on the startPosition.
  const FlyingEmoji = ({ emoji, startPosition, endPosition, onComplete }) => {
    const initialStyle = useMemo(() => ({
      position: 'fixed',
      left: `${startPosition.x}px`,
      top: `${startPosition.y}px`,
      fontSize: '80px',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      transition: 'none',
      opacity: 1
    }), [startPosition.x, startPosition.y]);
  
    const [style, setStyle] = useState(initialStyle);
  
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        setStyle(() => ({
          ...initialStyle,
          left: `${endPosition.x}px`,
          top: `${endPosition.y}px`,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }));
      }, 10);
  
      const animationId = setTimeout(() => {
        onComplete();
      }, 450);
  
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(animationId);
      };
    }, [endPosition.x, endPosition.y, initialStyle, onComplete]);
  
    return <div style={style}>{emoji}</div>;
  };
  
  // --- End FlyingEmoji Component ---
  
  // Handle tap/click selection
  const handleSelect = (emoji, index) => {
    if (showSuccess || showError || usedItems.includes(emoji) || flyingEmoji) return;
    const emojiElem = emojiRefs.current[`emoji-${index}`];
    const targetElem = targetCircleRef.current;
    if (emojiElem && targetElem) {
      const emojiRect = emojiElem.getBoundingClientRect();
      const targetRect = targetElem.getBoundingClientRect();
      const startPosition = {
        x: emojiRect.left + (emojiRect.width / 2),
        y: emojiRect.top + (emojiRect.height / 2)
      };
      const endPosition = {
        x: targetRect.left + (targetRect.width / 2),
        y: targetRect.top + (targetRect.height / 2)
      };
      setFlyingEmoji({
        emoji,
        startPosition,
        endPosition
      });
      setSelected(emoji);
    }
  };
  
  // Wrap the animation completion handler to update states after the flying animation finishes.
  const handleAnimationComplete = useCallback(() => {
    if (!flyingEmoji) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = flyingEmoji.emoji === currentQuestion.correct;
    setDropped(flyingEmoji.emoji);
    if (isCorrect) {
      setUsedItems(prev => [...prev, flyingEmoji.emoji]);
      setShowSuccess(true);
    } else {
      setShowError(true);
    }
    setFlyingEmoji(null);
    setSelected(null);
  }, [flyingEmoji, questions, currentIndex]);
  
  // Microphone icon component
  const MicrophoneIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" 
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
         strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
  );
  
  // Inline styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100vh',
      backgroundColor: '#EFF6FF',
      padding: '1rem',
      overflow: 'hidden'
    },
    topSection: {
      marginTop: '2rem',
      textAlign: 'center'
    },
    targetCircle: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      border: `6px solid ${showSuccess ? '#10B981' : showError ? '#EF4444' : '#93C5FD'}`,
      backgroundColor: showSuccess ? '#D1FAE5' : showError ? '#FEE2E2' : 'transparent',
      boxShadow: dropped || transitioning ? 'none' : 'inset 0 4px 8px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      margin: '0 auto',
      transition: 'background-color 0.3s, border-color 0.3s'
    },
    word: {
      fontSize: '42px',
      fontWeight: 'bold',
      color: '#1D4ED8',
      marginTop: '1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spacer: {
      height: '4rem'
    },
    optionsContainer: {
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: '2rem',
      minHeight: '160px'
    },
    optionCircle: (emoji) => ({
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      border: '6px solid #93C5FD',
      backgroundColor: usedItems.includes(emoji) ? 'transparent' : selected === emoji ? '#E0F2FE' : 'white',
      boxShadow: usedItems.includes(emoji) ? 'inset 0 4px 8px rgba(0, 0, 0, 0.2)' : selected === emoji ? '0 0 15px rgba(59, 130, 246, 0.5)' : '',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
      transform: selected === emoji ? 'scale(1.05)' : ''
    }),
    emoji: {
      fontSize: '80px',
      lineHeight: '1'
    },
    starAnimation: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'zoomInOut 1.2s ease-in-out forwards',
      pointerEvents: 'none',
      zIndex: 10,
      fontSize: '80px'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Top section with target and word */}
      <div style={styles.topSection}>
        <div 
          ref={targetCircleRef}
          style={styles.targetCircle}
        >
          {dropped ? (
            <div style={styles.emoji}>{dropped}</div>
          ) : (
            <div style={{ color: '#D1D5DB', cursor: 'pointer' }} onClick={() => speakWord(questions[currentIndex].word)}>
              <MicrophoneIcon />
            </div>
          )}
          {showSuccess && (
            <div style={styles.starAnimation}>⭐</div>
          )}
        </div>
  
        <div style={styles.word}>
          {transitioning ? "..." : questions[currentIndex].word.toLowerCase()}
        </div>
      </div>
  
      <div style={styles.spacer}></div>
  
      <div style={styles.optionsContainer}>
        {questions[currentIndex].options.map((emoji, index) => (
          <div 
            key={index}
            ref={el => emojiRefs.current[`emoji-${index}`] = el}
            style={styles.optionCircle(emoji)}
            onClick={() => handleSelect(emoji, index)}
          >
            {!usedItems.includes(emoji) && selected !== emoji && (
              <div style={styles.emoji}>{emoji}</div>
            )}
          </div>
        ))}
      </div>
      
      {flyingEmoji && (
        <FlyingEmoji
          emoji={flyingEmoji.emoji}
          startPosition={flyingEmoji.startPosition}
          endPosition={flyingEmoji.endPosition}
          onComplete={handleAnimationComplete}
        />
      )}
  
      <style>
        {`
          @keyframes zoomInOut {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(3); opacity: 1; }
            100% { transform: scale(0); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default WordMatchingGame;