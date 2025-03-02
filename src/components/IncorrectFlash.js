import React, { useState, useEffect } from 'react';

// Incorrect Flash Component
const IncorrectFlash = ({ active, currentWord, onSpeak }) => {
  const [opacity, setOpacity] = useState(0);
  const [showWord, setShowWord] = useState(false);
  
  useEffect(() => {
    if (active) {
      // First show the red background - now fully opaque
      setOpacity(1);
      
      // Then show the word after a short delay
      const wordTimer = setTimeout(() => {
        setShowWord(true);
        // Speak the word when it appears
        if (onSpeak && currentWord) {
          onSpeak(currentWord);
        }
      }, 300);
      
      // Clear everything after the animation is done
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
        setShowWord(false);
      }, 2000);
      
      return () => {
        clearTimeout(wordTimer);
        clearTimeout(fadeTimer);
      };
    } else {
      setOpacity(0);
      setShowWord(false);
    }
  }, [active, currentWord, onSpeak]);
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(255, 0, 0, ${opacity})`,
        pointerEvents: 'none',
        zIndex: 999,
        transition: 'background-color 0.5s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {showWord && currentWord && (
        <div 
          style={{
            color: 'white',
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            fontWeight: 'bold',
            textShadow: '3px 3px 10px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.5s ease-out',
            textAlign: 'center'
          }}
        >
          {currentWord}
        </div>
      )}
    </div>
  );
};

export default IncorrectFlash;