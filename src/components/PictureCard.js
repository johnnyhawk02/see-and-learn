import React, { useState, useRef } from 'react';

// Picture Card Component
const PictureCard = ({ item, onSelect, currentWordId, isAnimating, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef(null);

  if (!item) return null;

  const handleSelect = () => {
    if (isAnimating) return;
    
    const isCorrect = item.id === currentWordId;
    
    // Get card position for animations
    const rect = cardRef.current ? cardRef.current.getBoundingClientRect() : null;
    
    // Call parent handler
    onSelect(isCorrect, rect, item);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={cardRef}
      className={`${className || ''} rounded-xl overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-[1.03] active:scale-95 cursor-pointer ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleSelect}
      style={{
        animation: 'scaleIn 0.3s ease-out forwards',
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      <div className="absolute inset-0 bg-gray-100">
        <img 
          src={item.image} 
          alt={item.word} 
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={() => console.error(`Failed to load image: ${item.image}`)}
        />
        {/* Optional hover overlay effect */}
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-200"></div>
      </div>
    </div>
  );
};

export default PictureCard;