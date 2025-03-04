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
        fontSize: isCompact ? 'clamp(3.6rem, 14.4vw, 6.3rem)' : 'clamp(4.5rem, 18vw, 7.2rem)',
        lineHeight: '1.1',
        color: '#000000',
        fontWeight: '700'
      }}>
        {item.word}
      </h2>
    </div>
  );
};

export default WordCard;