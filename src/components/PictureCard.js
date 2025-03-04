import React, { useState, useRef, useEffect } from 'react';

// Picture Card Component
const PictureCard = ({ item, onClick, onLongPress, disabled }) => {
  console.log('PictureCard rendering with item:', item);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef(null);
  const cardRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!item) {
    console.log('No item provided to PictureCard');
    return null;
  }

  const handleLoad = () => {
    console.log('Image loaded:', item.word);
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('Failed to load image:', item.image);
  };

  // Handle long press detection
  const handleTouchStart = () => {
    if (disabled) return;
    
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 500);
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;
    
    setIsPressed(false);
    clearTimeout(longPressTimer.current);
    
    // Only trigger click if it wasn't a long press
    if (longPressTimer.current !== null) {
      e.preventDefault();
      if (onClick && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        onClick(rect);
      }
    }
  };

  const handleClick = (e) => {
    if (disabled) return;
    
    if (onClick && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onClick(rect);
    }
  };

  return (
    <div
      ref={cardRef}
      className="picture-card relative rounded-lg overflow-hidden shadow-md cursor-pointer"
      style={{
        aspectRatio: '16/9',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease-out',
        backgroundColor: '#f0f0f0',
        width: '100%',
        height: 'auto',
        minHeight: '80px'
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => {
        setIsPressed(false);
        clearTimeout(longPressTimer.current);
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={item.image}
        alt={item.word}
        className="w-full h-full object-cover"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={handleLoad}
        onError={handleError}
        draggable={false}
      />
    </div>
  );
};

export default PictureCard;