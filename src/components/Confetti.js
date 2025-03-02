import React, { useState, useEffect } from 'react';

// Confetti Component - only shown for correct answers
const Confetti = ({ active, matchPosition }) => {
  const [pieces, setPieces] = useState([]);
  const [emojis, setEmojis] = useState([]);
  
  // List of fun emojis to use
  const celebrationEmojis = ["🎉", "🎊", "⭐", "✨", "🌟", "👏", "🥳", "🙌", "😄", "🤩"];
  
  useEffect(() => {
    // Only generate and animate confetti when active is true (correct match)
    if (active && matchPosition) {
      console.log("Showing confetti for correct match", matchPosition);
      
      // Get origin coordinates based on the match position
      const originX = matchPosition.x || window.innerWidth / 2;
      const originY = matchPosition.y || window.innerHeight / 2;
      
      // Generate confetti pieces
      const newPieces = [];
      for (let i = 0; i < 100; i++) {
        // Calculate random angle and distance
        const angle = Math.random() * Math.PI * 2; // Random angle in radians
        const distance = 5 + Math.random() * 10; // Initial distance from origin
        
        // Create particle with velocity moving outward from match position
        newPieces.push({
          id: i,
          x: originX,
          y: originY,
          size: 5 + Math.random() * 10,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`,
          rotation: Math.random() * 360,
          xVel: Math.cos(angle) * distance,
          yVel: Math.sin(angle) * distance - 2, // Add some upward bias
          rotVel: -2 + Math.random() * 4
        });
      }
      setPieces(newPieces);
      
      // Generate emoji pieces
      const newEmojis = [];
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 8;
        
        newEmojis.push({
          id: i,
          emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
          x: originX,
          y: originY,
          size: 20 + Math.random() * 30,
          rotation: Math.random() * 360,
          xVel: Math.cos(angle) * distance * 0.8,
          yVel: Math.sin(angle) * distance * 0.8 - 3, // More upward bias for emojis
          rotVel: -3 + Math.random() * 6,
          opacity: 1
        });
      }
      setEmojis(newEmojis);
      
      // Animation function for confetti movement
      const animateConfetti = () => {
        setPieces(prevPieces => 
          prevPieces.map(piece => ({
            ...piece,
            x: piece.x + piece.xVel,
            y: piece.y + piece.yVel,
            rotation: piece.rotation + piece.rotVel,
            yVel: piece.yVel + 0.1 // Add gravity
          }))
        );
        
        setEmojis(prevEmojis => 
          prevEmojis.map(emoji => ({
            ...emoji,
            x: emoji.x + emoji.xVel,
            y: emoji.y + emoji.yVel,
            rotation: emoji.rotation + emoji.rotVel,
            yVel: emoji.yVel + 0.08, // Lighter gravity for emojis
            opacity: emoji.opacity > 0 ? emoji.opacity - 0.005 : 0 // Fade out gradually
          }))
        );
      };
      
      const interval = setInterval(animateConfetti, 50);
      return () => clearInterval(interval);
    } else {
      // Clear confetti when not active
      setPieces([]);
      setEmojis([]);
    }
  }, [active, matchPosition, celebrationEmojis]);
  
  if (!active) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Regular confetti pieces */}
      {pieces.map(piece => (
        <div 
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      
      {/* Emoji confetti */}
      {emojis.map(emoji => (
        <div 
          key={`emoji-${emoji.id}`}
          style={{
            position: 'absolute',
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            fontSize: `${emoji.size}px`,
            transform: `rotate(${emoji.rotation}deg)`,
            opacity: emoji.opacity,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};

export default Confetti;