import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import WordMatchingGame from './games/WordMatchingGame';
import EmojiBubbleGame from './games/EmojiBubbleGame';
import FunKeyboard from './games/FunKeyboard';
import FlashCardGame from './games/FlashCardGame';
import SpaceDefender from './games/SpaceDefender';
import EmojiBubbleGameOld from './games/EmojiBubbleGameOld';
import CardMatchingGame from './games/CardMatchingGame';

// GameWrapper component that includes the back button
const GameWrapper = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div style={styles.gameWrapper}>
      <button 
        style={styles.backButton} 
        onClick={() => navigate('/')}
        aria-label="Back to game selection"
      >
        ←
      </button>
      {children}
    </div>
  );
};

// GameCircle component for the selection screen
const GameCircle = ({ emoji, label, to, background }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <button 
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
    </Link>
  );
};

// Game selection screen component
const GameSelection = () => {
  return (
    <div style={styles.selectionContainer}>
      <h1 style={styles.title}>Welcome to the Games Collection</h1>
      <div style={styles.grid}>
        <GameCircle
          emoji="📝"
          label="Word Matching"
          to="/games/word"
          background="#4CAF50"
        />
        <GameCircle
          emoji="💬"
          label="Emoji Bubble"
          to="/games/emoji"
          background="#FF9800"
        />
        <GameCircle
          emoji="⌨️"
          label="Fun Keyboard"
          to="/games/keyboard"
          background="#E91E63"
        />
        <GameCircle
          emoji="💡"
          label="Flash Cards"
          to="/games/flash"
          background="#3F51B5"
        />
        <GameCircle
          emoji="🚀"
          label="Space Defender"
          to="/games/space"
          background="#9C27B0"
        />
        <GameCircle
          emoji="🔮"
          label="Emoji Bubble Old"
          to="/games/emoji-old"
          background="#2196F3"
        />
        <GameCircle
          emoji="🔤"
          label="Vocabulary Match"
          to="/games/memory"
          background="#009688"
        />
      </div>
    </div>
  );
};

// Main App component with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelection />} />
        <Route path="/games/word" element={
          <GameWrapper>
            <WordMatchingGame />
          </GameWrapper>
        } />
        <Route path="/games/emoji" element={
          <GameWrapper>
            <EmojiBubbleGame />
          </GameWrapper>
        } />
        <Route path="/games/keyboard" element={
          <GameWrapper>
            <FunKeyboard />
          </GameWrapper>
        } />
        <Route path="/games/flash" element={
          <GameWrapper>
            <FlashCardGame />
          </GameWrapper>
        } />
        <Route path="/games/space" element={
          <GameWrapper>
            <SpaceDefender />
          </GameWrapper>
        } />
        <Route path="/games/emoji-old" element={
          <GameWrapper>
            <EmojiBubbleGameOld />
          </GameWrapper>
        } />
        <Route path="/games/memory" element={
          <GameWrapper>
            <CardMatchingGame />
          </GameWrapper>
        } />
      </Routes>
    </BrowserRouter>
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
    zIndex: 10000,
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
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  }
};

export default App;