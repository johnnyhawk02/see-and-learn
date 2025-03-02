import React from 'react';

// Word Card Component
const WordCard = ({ item, onSpeak }) => {
  return (
    <div
      className="p-8 rounded-lg shadow-lg text-center font-bold select-none"
      style={{ 
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        width: '100%',
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 10px -3px rgba(0, 0, 0, 0.1), 0 3px 4px -2px rgba(0, 0, 0, 0.05)',
        color: 'black',
        position: 'relative',
        overflow: 'hidden',
        fontSize: '4rem',
        margin: '0 auto',
        cursor: 'pointer',
        borderRadius: '12px',
        border: '3px solid #e5e7eb'
      }}
    >
      {/* Word text - made clickable */}
      <div 
        style={{ position: 'relative', zIndex: 1, cursor: 'pointer' }}
        onClick={() => onSpeak(item.word)}
      >
        {item.word}
      </div>
    </div>
  );
};

export default WordCard;