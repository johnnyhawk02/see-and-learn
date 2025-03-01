import React, { useState } from 'react';
import WordMatchingGame from './games/WordMatchingGame';
import EmojiBubbleGame from './games/EmojiBubbleGame';
import FunKeyboard from './games/FunKeyboard';
import FlashCardGame from './games/FlashCardGame';
import SpaceDefender from './games/SpaceDefender';

const App = () => {
  const [currentGame, setCurrentGame] = useState(null);

  // If a game is selected, render it inside a wrapper with a back button.
  if (currentGame) {
    return (
      <div style={styles.gameWrapper}>
        <button style={styles.backButton} onClick={() => setCurrentGame(null)}>
          ←
        </button>
        {currentGame === 'word' && <WordMatchingGame />}
        {currentGame === 'emoji' && <EmojiBubbleGame />}
        {currentGame === 'keyboard' && <FunKeyboard />}
        {currentGame === 'flash' && <FlashCardGame />}
        {currentGame === 'space' && <SpaceDefender />}
      </div>
    );
  }

  // Otherwise, show the game selection screen.
  return (
    <div style={styles.selectionContainer}>
      <h1 style={styles.title}>Welcome to the Games Collection</h1>
      <div style={styles.grid}>
        <GameCircle
          emoji="📝"
          label="Word Matching"
          onClick={() => setCurrentGame('word')}
          background="#4CAF50"
        />
        <GameCircle
          emoji="💬"
          label="Emoji Bubble"
          onClick={() => setCurrentGame('emoji')}
          background="#FF9800"
        />
        <GameCircle
          emoji="⌨️"
          label="Fun Keyboard"
          onClick={() => setCurrentGame('keyboard')}
          background="#E91E63"
        />
        <GameCircle
          emoji="💡"
          label="Flash Cards"
          onClick={() => setCurrentGame('flash')}
          background="#3F51B5"
        />
        <GameCircle
          emoji="🚀"
          label="Space Defender"
          onClick={() => setCurrentGame('space')}
          background="#9C27B0"
        />
      </div>
    </div>
  );
};

const GameCircle = ({ emoji, label, onClick, background }) => {
  return (
    <button 
      onClick={onClick} 
      style={{
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: background,
        color: 'white',
        fontSize: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e)=> e.currentTarget.style.transform="scale(1.05)"}
      onMouseLeave={(e)=> e.currentTarget.style.transform="scale(1)"}
    >
      <div>{emoji}</div>
      <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{label}</div>
    </button>
  );
};

const styles = {
  selectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '2rem',
    backgroundColor: '#F0F0F0',
    padding: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    textAlign: 'center',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '600px',
  },
  gameWrapper: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    padding: '12px',
    fontSize: '24px',
    fontWeight: 'bold',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default App;