import React, { useState } from 'react';

// Picture Card Component
const PictureCard = ({ item, onSelect, currentWordId, isAnimating }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleClick = () => {
    if (isAnimating) return;
    
    // Check if this picture's ID matches the current word ID
    // Use optional chaining to avoid errors with undefined values
    const isCorrectMatch = item?.id === currentWordId;
    
    // Call the match handler with the result and item data
    onSelect(isCorrectMatch, null, item);
  };
  
  // Add error handling to ensure item is properly defined
  if (!item) {
    return <div className="rounded-lg bg-gray-200 h-32 w-full"></div>;
  }
  
  return (
    <div
      id={`picture-card-${item.id}`}
      className="rounded-lg flex justify-center items-center cursor-pointer"
      style={{ 
        backgroundColor: isPressed ? '#f0f9ff' : 'white',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        // Using 16:9 aspect ratio
        paddingTop: '56.25%', 
        margin: '0 auto',
        border: '3px solid ' + (isPressed ? '#3b82f6' : '#e5e7eb'),
        borderRadius: '12px',
        transition: 'all 0.1s ease-out',
        boxShadow: isPressed 
          ? 'inset 0 2px 6px rgba(0,0,0,0.2)' 
          : '0 6px 10px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.08)',
      }}
      onClick={handleClick}
      onTouchStart={() => {
        if (!isAnimating) {
          setIsPressed(true);
        }
      }}
      onTouchEnd={() => {
        setIsPressed(false);
      }}
      onTouchCancel={() => {
        setIsPressed(false);
      }}
      onMouseDown={() => {
        if (!isAnimating) {
          setIsPressed(true);
        }
      }}
      onMouseUp={() => {
        setIsPressed(false);
      }}
      onMouseLeave={() => {
        setIsPressed(false);
      }}
    >
      {/* Add ripple effect when pressed */}
      {isPressed && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            zIndex: 0,
          }}
        />
      )}
      
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <img 
          src={item.image} 
          alt={item.word} 
          style={{ 
            position: 'absolute',
            top: 0, 
            left: 0, 
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }} 
        />
      </div>
    </div>
  );
};

export default PictureCard;