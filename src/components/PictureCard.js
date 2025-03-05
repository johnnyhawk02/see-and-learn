import React, { useState, useRef, useEffect } from 'react';

// Consistent Picture Card Component with centered black text on white background
// Optimized for mobile performance and loading
const PictureCard = ({ item, onClick, onLongPress, disabled, isIncorrect, showWords = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const longPressTimer = useRef(null);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  
  console.log(`PictureCard for "${item?.word}" with showWords=${showWords}, isIncorrect=${isIncorrect}`);
  
  // Log when showWords prop changes
  useEffect(() => {
    console.log(`showWords changed to ${showWords} for card: ${item?.word}`);
  }, [showWords, item?.word]);

  // Add a flash effect whenever showWords changes
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'background-color 0.3s';
      cardRef.current.style.backgroundColor = showWords ? '#e6ffed' : '#fff3e0';
      
      // Reset after flash
      const timer = setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.backgroundColor = '';
          cardRef.current.style.transition = '';
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showWords]);

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

  // Add a clear visual indicator when showWords changes
  useEffect(() => {
    console.log(`showWords CHANGED to: ${showWords} for word: ${item?.word}`);
  }, [showWords, item?.word]);

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
      className={`picture-card ${isPressed ? 'pressed' : ''} ${isHovered ? 'hovered' : ''} ${disabled ? 'disabled' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        setIsPressed(false);
      }}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? 'default' : 'pointer',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        willChange: 'transform',
        margin: '0 auto',
        width: '100%',
        maxWidth: '100%',
        ...(process.env.NODE_ENV !== 'production' && disabled ? {
          outline: '2px dashed red',
          position: 'relative'
        } : {})
      }}
    >
      {/* Loading spinner styles */}
      <style jsx>{`
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #3498db;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Image Section */}
      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%', // Standard 16:9 aspect ratio
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {/* Loading Spinner */}
        {!isLoaded && !loadError && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {/* Image */}
        <img
          ref={imageRef}
          src={item.image}
          alt={item.word || 'Picture card'}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease, filter 0.3s ease',
            willChange: 'opacity',
            filter: isIncorrect ? 'grayscale(100%) brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none',
          }}
        />
        
        {/* Error Fallback */}
        {loadError && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f8f8f8',
              color: '#666',
              fontSize: '14px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            Image not available
          </div>
        )}
      </div>
      
      {/* Text Section - displays a space when words are hidden */}
      <div
        className="word-container"
        style={{
          padding: '8px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderTop: '1px solid #eee',
          color: isIncorrect ? 'red' : 'black',
          fontSize: '28px',
          fontWeight: '500',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: '1.3',
          overflow: 'hidden',
          borderRadius: '0 0 8px 8px',
        }}
      >
        {showWords ? (item.word || 'Unknown') : ' '}
      </div>
    </div>
  );
};

export default PictureCard;