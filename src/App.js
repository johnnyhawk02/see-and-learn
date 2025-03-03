import React, { useState, useEffect } from 'react';
import WordMatchingGame from './components/WordMatchingGame';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Prevent default behavior for touchmove to stop scrolling/dragging
  useEffect(() => {
    const preventDrag = (e) => {
      e.preventDefault();
    };
    
    // Add event listeners when the game is playing
    if (isPlaying) {
      document.addEventListener('touchmove', preventDrag, { passive: false });
      document.addEventListener('contextmenu', preventDrag);
    }
    
    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('touchmove', preventDrag);
      document.removeEventListener('contextmenu', preventDrag);
    };
  }, [isPlaying]);

  const startGame = () => {
    setIsPlaying(true);
  };

  const exitGame = () => {
    setIsPlaying(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden flex flex-col items-center justify-center">
      {!isPlaying ? (
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-xl w-full">
          <h1 className="text-4xl font-bold mb-6 text-blue-600">Word Matching Game</h1>
          <p className="text-xl mb-8 text-gray-700">Match the word with the correct picture!</p>
          <button 
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-md transform transition-transform duration-200 hover:scale-105"
          >
            Play Game
          </button>
        </div>
      ) : (
        <>
          <button 
            onClick={exitGame}
            className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md z-10 text-base"
          >
            Exit Game
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <WordMatchingGame />
          </div>
        </>
      )}
    </div>
  );
};

export default App;