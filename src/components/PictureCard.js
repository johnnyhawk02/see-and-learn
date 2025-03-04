import React, { useState, useRef, useEffect } from 'react';

// Consistent Picture Card Component with centered black text on white background
// Optimized for mobile performance and loading
const PictureCard = ({ item, onClick, onLongPress, disabled, isIncorrect }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const longPressTimer = useRef(null);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  
  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Use effect to handle image preloading
  useEffect(() => {
    if (!item) return;
    
    // Check if the image is already cached
    const isCached = () => {
      const img = new Image();
      img.src = item.image;
      return img.complete;
    };
    
    // Set loaded state to true if image is already cached
    if (isCached()) {
      setIsLoaded(true);
      return;
    }
    
    // When component mounts or item changes, add loading timeout
    // This ensures we don't wait forever if the image fails silently
    const timeoutId = setTimeout(() => {
      if (!isLoaded && imageRef.current) {
        console.log('Image load timeout - forcing loaded state');
        setIsLoaded(true);
      }
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [item, isLoaded]);

  if (!item) {
    console.warn('PictureCard received null or undefined item');
    return null;
  }

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('Failed to load image:', item.image);
    setLoadError(true);
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
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
        clearTimeout(longPressTimer.current);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        setIsPressed(false);
        clearTimeout(longPressTimer.current);
      }}
      onClick={handleClick}
      style={{
        overflow: 'hidden',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f0f0f0',
        transition: 'transform 0.1s ease-in-out',
        transform: isPressed ? 'scale(0.98)' : isHovered ? 'scale(1.01)' : 'scale(1)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      <div 
        style={{ 
          width: '100%',
          height: '0',
          paddingBottom: '75%', // 4:3 aspect ratio
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Loading spinner */}
        {!isLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            zIndex: 1
          }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {/* Fallback for load errors */}
        {loadError && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f8f8',
            color: '#999',
            fontSize: '14px',
            zIndex: 2
          }}>
            <span>Image not available</span>
          </div>
        )}

        <img
          ref={imageRef}
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
            transition: 'opacity 0.2s ease',
            willChange: 'transform, opacity', // Improves performance on mobile
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Use browser's lazy loading
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
            mixBlendMode: 'multiply',
            zIndex: 1
          }}>
            <span className="sr-only">Incorrect</span>
          </div>
        )}
      </div>
      
      {/* Text section - black on white, centered */}
      <div
        className="word-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          height: '24px',
          backgroundColor: 'white',
          color: isIncorrect ? 'rgb(220, 38, 38)' : 'black',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          borderTop: '1px solid #f0f0f0',
          transition: 'color 0.2s ease'
        }}
      >
        {item.word}
      </div>
    </div>
  );
};

export default PictureCard;