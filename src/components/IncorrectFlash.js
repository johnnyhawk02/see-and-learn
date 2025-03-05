import React from 'react';

// Incorrect Flash Component
const IncorrectFlash = ({ active, currentWord, onSpeak }) => {
  if (!active) return null;

  return (
    <div 
      className="fixed inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center z-50"
      style={{ 
        animation: 'fadeIn 0.3s ease-out',
        pointerEvents: 'none'
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="text-center">
        {currentWord && (
          <div 
            className="text-white font-bold"
            style={{ 
              textShadow: '4px 4px 12px rgba(0,0,0,0.9)',
              animation: 'fadeIn 0.5s ease-out',
              lineHeight: '1.2',
              fontSize: 'clamp(4rem, 20vw, 24rem)',
              wordBreak: 'break-word',
              hyphens: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              padding: '20px',
            }}
          >
            {currentWord}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncorrectFlash;