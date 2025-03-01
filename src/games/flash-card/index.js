import React, { useState } from 'react';



const FlashcardApp = () => {
  // Card data with simple words and matching emojis
  const cards = [
    { word: "Apple", emoji: "🍎" },
    { word: "Ball", emoji: "🏀" },
    { word: "Cat", emoji: "🐱" },
    { word: "Dog", emoji: "🐶" },
    { word: "Egg", emoji: "🥚" },
    { word: "Fish", emoji: "🐠" },
    { word: "Girl", emoji: "👧" },
    { word: "Hat", emoji: "🧢" },
    { word: "Ice", emoji: "🧊" },
    { word: "Jump", emoji: "🏃" },
    { word: "Kite", emoji: "🪁" },
    { word: "Lion", emoji: "🦁" },
  ];

  // State to track dealt cards and current card
  const [dealtCards, setDealtCards] = useState([]);
  const [remainingCards, setRemainingCards] = useState([...cards]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isDealing, setIsDealing] = useState(false);

  // Deal a new card with flipping animation
  const dealCard = () => {
    if (isFlipping || isDealing) return;
    
    if (remainingCards.length === 0) {
      // Reset the game if all cards are dealt
      setDealtCards([]);
      setRemainingCards([...cards]);
      setCurrentCard(null);
      return;
    }
    
    // Take the first card from remaining cards
    const newCard = remainingCards[0];
    const updatedRemainingCards = remainingCards.slice(1);
    
    // Start the deal animation (card comes out of deck)
    setIsDealing(true);
    setCurrentCard(newCard);
    
    // First animate the card coming out of the deck
    setTimeout(() => {
      // Then start the flip animation
      setIsDealing(false);
      setIsFlipping(true);
      setFlipProgress(0);
      
      // Animate the flip
      const startTime = Date.now();
      const duration = 800; // shorter duration for a snappier flip
      
      const animateFlip = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setFlipProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateFlip);
        } else {
          // Animation completed
          setTimeout(() => {
            setDealtCards([...dealtCards, newCard]);
            setRemainingCards(updatedRemainingCards);
            setIsFlipping(false);
          }, 100);
        }
      };
      
      requestAnimationFrame(animateFlip);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-blue-100 p-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Fun Learning Cards</h1>
      
      <div className="flex flex-col items-center w-full max-w-4xl">
        {/* Game area */}
        <div className="flex items-center justify-center w-full mb-8 h-64 relative">
          {/* Card deck */}
          <div 
            className={`
              absolute
              left-1/4
              transform
              -translate-x-1/2
              w-32 
              h-44 
              rounded-xl 
              shadow-lg 
              bg-blue-500 
              border-4 
              border-white 
              cursor-pointer
              flex
              items-center
              justify-center
              ${remainingCards.length === 0 ? 'opacity-50' : ''}
              ${isFlipping || isDealing ? 'pointer-events-none' : ''}
            `}
            onClick={dealCard}
          >
            {remainingCards.length > 0 ? (
              <>
                <div className="absolute inset-0 m-2 rounded-lg bg-white opacity-20"></div>
                <div className="text-white font-bold text-xl">
                  {remainingCards.length}
                </div>
              </>
            ) : (
              <div className="text-white font-bold text-xl">Reset</div>
            )}
          </div>
          
          {/* Current card with realistic 3D flip animation */}
          <div className="absolute left-1/2 transform -translate-x-1/2 perspective-1000">
            {(isFlipping || isDealing) && (
              <div 
                className={`
                  relative
                  w-32 
                  h-44
                  transition-transform
                  duration-300
                  ${isDealing ? 'card-dealing' : ''}
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipping 
                    ? `rotateY(${flipProgress * 180}deg)` 
                    : 'translateX(0) translateY(0) rotateY(0deg)'
                }}
              >
                {/* Card back (blue) */}
                <div 
                  className="
                    absolute 
                    inset-0
                    rounded-xl
                    border-4
                    border-white
                    bg-blue-500
                    flex
                    items-center
                    justify-center
                    shadow-md
                  "
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)'
                  }}
                >
                  <div className="absolute inset-0 m-2 rounded-lg bg-white opacity-20"></div>
                </div>
                
                {/* Card front (word and emoji) */}
                <div 
                  className="
                    absolute 
                    inset-0
                    rounded-xl
                    border-4
                    border-blue-500
                    bg-white
                    flex
                    flex-col
                    items-center
                    justify-center
                    shadow-md
                  "
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  {currentCard && (
                    <>
                      <span className="text-5xl mb-2">{currentCard.emoji}</span>
                      <h2 className="text-2xl font-bold text-center text-blue-700">{currentCard.word}</h2>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Dealt card (static display after animation) */}
          <div className="absolute right-1/4 transform translate-x-1/2">
            {!isFlipping && !isDealing && dealtCards.length > 0 && (
              <div className="w-32 h-44 rounded-xl shadow-lg bg-white border-4 border-blue-500 flex flex-col items-center justify-center p-2">
                <span className="text-5xl mb-2">
                  {dealtCards[dealtCards.length - 1].emoji}
                </span>
                <h2 className="text-2xl font-bold text-center text-blue-700">
                  {dealtCards[dealtCards.length - 1].word}
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-blue-700 mb-2">How to use:</h2>
        <ul className="list-disc pl-5">
          <li>Tap the blue deck to deal a new card</li>
          <li>Watch the card flip from the top of the deck</li>
          <li>Say the word out loud and practice the emoji</li>
          <li>When all cards are dealt, tap to start over</li>
        </ul>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        @keyframes dealFromDeck {
          0% {
            transform: translateX(-80px) translateY(-20px) scale(0.95);
            opacity: 0.5;
          }
          100% {
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        .card-dealing {
          animation: dealFromDeck 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FlashcardApp;