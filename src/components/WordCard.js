import React from 'react';

// Word Card Component
const WordCard = ({ item, onSpeak, size = 'normal' }) => {
  if (!item) return null;

  const isCompact = size === 'compact';

  return (
    <div 
      className={`rounded-lg shadow-md text-center font-bold select-none bg-white ${
        isCompact ? 'p-3 sm:p-4' : 'p-6'
      }`}
      onClick={() => onSpeak && onSpeak()}
      style={{ 
        width: '100%',
        minHeight: isCompact ? '80px' : '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <h2 style={{ 
        fontSize: isCompact ? 'clamp(2rem, 8vw, 3.5rem)' : 'clamp(2.5rem, 10vw, 4rem)',
        lineHeight: '1.2',
        color: '#000000'
      }}>
        {item.word}
      </h2>
    </div>
  );
};

export default WordCard;