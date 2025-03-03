import React from 'react';

// Picture Card Component
const PictureCard = ({ item, onSelect, currentWordId, isAnimating }) => {
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
    <button
      onClick={handleClick}
      disabled={isAnimating}
      className={`
        relative rounded-lg overflow-hidden
        transform transition-all duration-150
        hover:scale-[0.98] active:scale-[0.97]
        focus:outline-none focus:ring-0
        ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ 
        paddingTop: '56.25%',
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <img
        src={item.image}
        alt={item.word}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </button>
  );
};

export default PictureCard;