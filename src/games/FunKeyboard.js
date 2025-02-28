import React, { useState, useEffect, useCallback } from 'react';

const FunKeyboard = () => {
  const [text, setText] = useState('');
  const [activeKey, setActiveKey] = useState(null);
  
  // Keyboard layout
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    [' '] // Space bar
  ];
  
  // Colors for keys - bright, fun colors
  const keyColors = [
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5', 
    '#F15BB5', '#00BBF9', '#00F5D4', '#FEE440', '#FF99C8'
  ];
  
  // Function to speak the letter
  const speakLetter = (letter) => {
    if (!window.speechSynthesis) return;
    
    // Handle special cases for better pronunciation
    let utteranceText = letter;
    
    // Special handling for letter O
    if (letter === 'O') {
      utteranceText = 'Ohhh';  // Emphasis to get better sound
    } 
    // Use word for space
    else if (letter === ' ') {
      utteranceText = 'Space';
    }
    
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = 0.8; // Slower for better clarity
    utterance.pitch = 1.1; // Slightly higher pitch
    
    window.speechSynthesis.speak(utterance);
  };
  
  // Handle key press - memoize with useCallback to avoid dependency issues
  const handleKeyPress = useCallback((key) => {
    setActiveKey(key);
    
    // Add animation effect
    setTimeout(() => {
      setActiveKey(null);
    }, 300);
    
    setText(text + key);
    speakLetter(key === ' ' ? "Space" : key);
  }, [text]);
  
  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z0-9 ]$/.test(key)) {
        handleKeyPress(key);
      } else if (e.key === 'Escape') {
        // Clear text on Escape key
        setText('');
        speakLetter("Clear");
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, handleKeyPress]);
  
  // Assign fixed colors to keys
  const getKeyColor = (key) => {
    const index = (key.charCodeAt(0) % keyColors.length);
    return keyColors[index];
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-100 to-blue-100 p-4">
      {/* App Title */}
      <h1 className="text-3xl font-bold mb-6 text-purple-600">Robyn's Fun Keyboard</h1>
      
      {/* Display Area with Clear and Speak buttons */}
      <div className="w-full p-6 bg-white rounded-xl shadow-lg mb-6 min-h-16 flex items-center">
        {/* Clear Button (Left) */}
        <button
          onClick={() => {
            setText('');
            speakLetter("Clear");
          }}
          className="bg-yellow-500 text-white text-xl font-bold rounded-lg shadow-md p-2 mr-4 h-16 w-24 transition-all transform hover:scale-105 focus:outline-none"
        >
          CLEAR
        </button>
        
        {/* Text Display (Center) */}
        <div className="text-5xl font-bold tracking-wider text-center flex-grow break-all">
          {text || "..."}
        </div>
        
        {/* Speak Button (Right) */}
        <button
          onClick={() => {
            if (text) {
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.rate = 0.9;
              window.speechSynthesis.speak(utterance);
            }
          }}
          className="bg-green-500 text-white text-xl font-bold rounded-lg shadow-md p-2 ml-4 h-16 w-24 transition-all transform hover:scale-105 focus:outline-none flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      </div>
      
      {/* Keyboard Container */}
      <div className="w-full max-w-4xl bg-gray-100 rounded-xl p-4 shadow-lg">
        {/* Keyboard Rows */}
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`
                  ${key === ' ' ? 'w-64' : 'w-16'} 
                  h-16 
                  m-1 
                  text-3xl 
                  font-bold 
                  rounded-lg 
                  shadow-md 
                  transition-all 
                  transform 
                  ${activeKey === key ? 'scale-90 brightness-110' : 'hover:scale-105'} 
                  focus:outline-none
                `}
                style={{ 
                  backgroundColor: getKeyColor(key),
                  transform: activeKey === key ? 'scale(0.9) rotate(-5deg)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {key === ' ' ? 'SPACE' : key}
              </button>
            ))}
          </div>
        ))}
        

      </div>
    </div>
  );
};

export default FunKeyboard;