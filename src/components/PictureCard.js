import React, { useState, useRef, useEffect } from 'react';

// Consistent Picture Card Component with centered black text on white background
const PictureCard = ({ item, onClick, onLongPress, disabled, isIncorrect }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimer = useRef(null);
  const cardRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!item) {
    console.warn('PictureCard received null or undefined item');
    return null;
  }

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('Failed to load image:', item.image);
    setIsLoaded(true); // Still mark as loaded to remove spinner
  };

  const handleTouchStart = () => {
    if (disabled) return;
    
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      if (onLongPress && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        onLongPress(rect);
      }
    }, 500);
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;
    
    setIsPressed(false);
    clearTimeout(longPressTimer.current);
    
    if (e.type !== 'mouseup' || e.button === 0) {
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
      className="picture-card"
      style={{
        width: '100%',
        margin: '2px',
        border: `1px solid ${isPressed ? '#3f51b5' : '#e0e0e0'}`,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '4px',
        overflow: 'visible',
        backgroundColor: '#ffffff',
        height: 'auto',
        minHeight: '100px',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'transform 0.15s ease',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)'
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
        clearTimeout(longPressTimer.current);
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
    >
      {/* Image section with 4:3 aspect ratio */}
      <div 
        style={{ 
          width: '100%',
          height: '0',
          paddingBottom: '75%', // 4:3 aspect ratio
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5'
        }}
      >
        <img
          src={item.image}
          alt={item.word}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            filter: isIncorrect ? 'sepia(1) hue-rotate(-50deg) saturate(5) brightness(0.9)' : 'none',
            transition: 'opacity 0.2s ease'
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {/* Overlay for incorrect selections */}
        {isIncorrect && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 80, 80, 0.3)',
            mixBlendMode: 'multiply'
          }}>
            <span className="sr-only">Incorrect</span>
          </div>
        )}
      </div>
      
      {/* Text section - black on white, centered */}
      <div 
        className="word-container"
        style={{
          backgroundColor: '#ffffff',
          color: isIncorrect ? '#ff4040' : '#000000', // Black text (red if incorrect)
          padding: '4px',
          textAlign: 'center',
          height: '24px',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          fontSize: '14px',
          fontWeight: '500',
          borderTop: '1px solid #f0f0f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '1'
        }}
      >
        {item.word}
      </div>
    </div>
  );
};

export default PictureCard;