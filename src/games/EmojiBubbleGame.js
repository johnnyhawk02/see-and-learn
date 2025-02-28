import React, { useState, useEffect, useCallback, useMemo } from 'react';

const EmojiGame = () => {
  const [bubbles, setBubbles] = useState([]);
  const [fallingEmojis, setFallingEmojis] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [shrapnel, setShrapnel] = useState([]);
  const [hasSpawnedGrenade, setHasSpawnedGrenade] = useState(false);
  
  // Emoji collection
  const emojis = useMemo(() => [
    // Animals only
    "🐶", "🐱", "🐼", "🦊", "🦁", "🐯", "🦖", "🐙", "🦋", "🐳",
    "🦄", "🐸", "🐰", "🐨", "🐮", "🐷", "🐵", "🦒", "🦘", "🦩",
    "🦦", "🦥", "🦡", "🦨", "🦔", "🐿️", "🦫", "🦃", "🦚", "🦜",
    "🐧", "🦢", "🦅", "🦉", "🐢", "🦎", "🐠", "🐡", "🦈", "🐋"
  ], []);
  
  // Generate random parameters for bubbles - now with size categories

  
    // Function body...
  
  const generateRandomBubble = useCallback((size = null, position = null, velocity = null, forceGrenade = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Size can be passed in for split bubbles, otherwise randomly determined
    // Added large bubble generation (about 20% chance for large bubbles)
    const bubbleSize = size || (Math.random() > 0.8 ? 
    (Math.floor(Math.random() * 45) + 155) :  
    (Math.floor(Math.random() * 45) + 60));  
    
    // Position can be passed in for split bubbles
    const x = position ? position.x : Math.floor(Math.random() * (window.innerWidth - bubbleSize));
    const y = position ? position.y : window.innerHeight;
    
    // Velocity can be passed in for split bubbles
    const speedX = velocity ? velocity.x : (Math.random() - 0.5) * 2;
    const speedY = velocity ? velocity.y : -(Math.random() * 3 + 2);
    
    // Flag for whether this bubble can split when popped (only large bubbles)
    const canSplit = bubbleSize >= 100;
    
    // Angular momentum and rotation properties
    const rotation = Math.floor(Math.random() * 360);
    const angularVelocity = (Math.random() - 0.5) * 1.2; // Initial angular velocity (radians per second)
    const angularDrag = 0.99; // How quickly rotation naturally slows down
    const momentOfInertia = bubbleSize * bubbleSize / 400; // Larger bubbles have more inertia
    const angularMomentum = angularVelocity * momentOfInertia;
    
    const bounceX = 0.96 + Math.random() * 0.4; // Bounce factor for X direction
    const bounceY = 0.96 + Math.random() * 0.4; // Bounce factor for Y direction
    const bounceDecay = 0.97; // How much energy is lost on each bounce
    
    // Make it a grenade if forced or higher chance (if we haven't spawned one yet)
    const isGrenade = forceGrenade || Math.random() < 0.3; // 30% chance for grenades
    
    if (isGrenade) {
      setHasSpawnedGrenade(true);
    }
    
    const bubbleColor = isGrenade ? 'rgba(0, 0, 0, 0.8)' : `hsla(${Math.floor(Math.random() * 360)}, 80%, 70%, 0.8)`;
    const bubbleEmoji = isGrenade ? '💣' : emoji;
    
    return { 
      id,
      emoji: bubbleEmoji,
      size: bubbleSize,
      x, y, speedX, speedY,
      rotation, angularVelocity, 
      angularMomentum, momentOfInertia,
      angularDrag,
      color: bubbleColor,
      bounceX, bounceY, bounceDecay,
      lastBounce: 0,
      scaleX: 1,
      scaleY: 1,
      isColliding: false,
      lastUpdateTime: Date.now(),
      createdAt: Date.now(),
      canSplit,
      lastCollision: Date.now(),
      dragFactor: 1.0,
      isFading: false,
      opacity: 1,
      isGrenade
    };
}, [emojis, hasSpawnedGrenade]);
  
  // Function to check for collisions between bubbles
  const checkCollisions = (bubbles) => {
    const collidedBubbles = new Set();
    
    // Check each pair of bubbles for collision
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const b1 = bubbles[i];
        const b2 = bubbles[j];
        
        // Calculate the center points
        const b1CenterX = b1.x + b1.size / 2;
        const b1CenterY = b1.y + b1.size / 2;
        const b2CenterX = b2.x + b2.size / 2;
        const b2CenterY = b2.y + b2.size / 2;
        
        // Calculate distance between centers
        const dx = b2CenterX - b1CenterX;
        const dy = b2CenterY - b1CenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if bubbles are colliding (accounting for actual visual size)
        const minDistance = (b1.size + b2.size) / 2;
        
        if (distance < minDistance) {
          // Mark both bubbles as colliding
          collidedBubbles.add(b1.id);
          collidedBubbles.add(b2.id);
          
          // Update last collision time for both bubbles
          const now = Date.now();
          b1.lastCollision = now;
          b2.lastCollision = now;
          
          // Reset drag factor when colliding
          b1.dragFactor = 1.0;
          b2.dragFactor = 1.0;
          
          // Calculate collision response
          const angle = Math.atan2(dy, dx);
          const overlap = minDistance - distance;
          
          // Calculate direction of collision for deformation
          const collisionAngle1 = Math.atan2(b2CenterY - b1CenterY, b2CenterX - b1CenterX);
          const collisionAngle2 = Math.atan2(b1CenterY - b2CenterY, b1CenterX - b2CenterX);
          
          // Store collision info for later deformation
          b1.collisionDirection = collisionAngle1;
          b2.collisionDirection = collisionAngle2;
          b1.collisionMagnitude = Math.min(0.3, overlap / minDistance * 0.5);
          b2.collisionMagnitude = Math.min(0.3, overlap / minDistance * 0.5);
          
          // Move bubbles apart to prevent sticking
          const moveX = Math.cos(angle) * overlap * 0.5;
          const moveY = Math.sin(angle) * overlap * 0.5;
          
          b1.x -= moveX;
          b1.y -= moveY;
          b2.x += moveX;
          b2.y += moveY;
          
          // Exchange momentum with extra 20% bounce
          const temp = { x: b1.speedX, y: b1.speedY };
          b1.speedX = b2.speedX * (b1.bounceX * 1.2);
          b1.speedY = b2.speedY * (b1.bounceY * 1.2);
          b2.speedX = temp.x * (b2.bounceX * 1.2);
          b2.speedY = temp.y * (b2.bounceY * 1.2);
          
          // Add a small random component to prevent bubbles from sticking
          b1.speedX += (Math.random() - 0.5) * 0.3;
          b1.speedY += (Math.random() - 0.5) * 0.3;
          b2.speedX += (Math.random() - 0.5) * 0.3;
          b2.speedY += (Math.random() - 0.5) * 0.3;
          
          // Physics-based rotation: Angular impulse based on collision
          // Calculate tangential component of collision for rotation
          const tangentialImpulse1 = dx * b1.speedY - dy * b1.speedX;
          const tangentialImpulse2 = dx * b2.speedY - dy * b2.speedX;
          
          // Apply impulse to angular momentum (proportional to tangential velocity difference)
          b1.angularMomentum += tangentialImpulse2 * 0.05;
          b2.angularMomentum += tangentialImpulse1 * 0.05;
          
          // Update angular velocity based on new angular momentum and moment of inertia
          b1.angularVelocity = b1.angularMomentum / b1.momentOfInertia;
          b2.angularVelocity = b2.angularMomentum / b2.momentOfInertia;
          
          // Mark the time of collision
          b1.lastBounce = Date.now();
          b2.lastBounce = Date.now();
        }
      }
    }
    
    // Update bubble collision states
    return bubbles.map(bubble => ({
      ...bubble,
      isColliding: collidedBubbles.has(bubble.id)
    }));
  };
  
  // Start the game
  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(120);
    setBubbles([]);
    setFallingEmojis([]);
    setConfetti([]);
    setHasSpawnedGrenade(false); // Reset grenade spawn state
  };
  
  const createConfetti = useCallback((x, y, color) => {
    const confettiCount = 40 + Math.floor(Math.random() * 20); // Increased count
    const newConfetti = [];
    
    for (let i = 0; i < confettiCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8; // Increased speed
      const size = 4 + Math.random() * 7; // Increased size
      const type = Math.random() > 0.5 ? 'circle' : 'rect';
      const opacity = 0.8 + Math.random() * 0.2; // Increased opacity
      // Use colors from the bubble with some variation
      const hue = parseInt(color.split(',')[0].replace('hsla(', ''));
      const confettiColor = `hsla(${hue + Math.floor(Math.random() * 60 - 30)}, 100%, 70%, ${opacity})`;
      
      newConfetti.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 6, // Increased upward boost
        size,
        type,
        color: confettiColor,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        gravity: 0.04 + Math.random() * 0.04, // Reduced gravity even more
        createdAt: Date.now(),
        lastUpdateTime: Date.now(), // Add this for physics-based timing
        sparkle: Math.random() > 0.5 // More particles will sparkle
      });
    }
    
    setConfetti(current => [...current, ...newConfetti]);
  }, [setConfetti]);
  
  // Add createShrapnel function near other effect creators
  const createShrapnel = useCallback((x, y, size = 60) => {
    // Scale shrapnel count based on size: 12 pieces for smallest grenades (60px), up to 36 for largest (200px)
    const baseShrapnelCount = 12;
    const shrapnelCount = Math.floor(baseShrapnelCount * (size / 60));
    const newShrapnel = [];
    
    // Scale speed based on size too
    const baseSpeed = 8;
    const speedMultiplier = size / 60;
    
    for (let i = 0; i < shrapnelCount; i++) {
      const angle = (i / shrapnelCount) * Math.PI * 2;
      const speed = (baseSpeed + Math.random() * 4) * speedMultiplier;
      
      newShrapnel.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        size: 8 + (size / 60), // Slightly larger shrapnel for bigger grenades
        createdAt: Date.now(),
        lastUpdateTime: Date.now(),
      });
    }
    
    return newShrapnel;
  }, []);
  
  // Create confetti particles and split bubbles when needed
  const popBubble = useCallback((id) => {
    const bubble = bubbles.find(b => b.id === id);
    if (!bubble) return;

    if (bubble.isGrenade) {
      // Create shrapnel - pass the bubble size
      const shrapnel = createShrapnel(
        bubble.x + bubble.size/2,
        bubble.y + bubble.size/2,
        bubble.size
      );
      
      // Add shrapnel to state
      setShrapnel(current => [...current, ...shrapnel]);
      
      // Add explosion effect
      createConfetti(bubble.x + bubble.size/2, bubble.y + bubble.size/2, 'rgba(255, 87, 34, 0.8)');
      
      // Award extra points for popping a grenade
      setScore(currentScore => currentScore + 25);
    } else {
      // Create a falling emoji effect
      const fallingEmoji = {
        id: `falling-${bubble.id}`,
        emoji: bubble.emoji,
        x: bubble.x + bubble.size/2,
        y: bubble.y + bubble.size/2,
        size: bubble.size * 0.8,
        speedY: 3 + Math.random() * 5,
        rotation: bubble.rotation,
        angularVelocity: bubble.angularVelocity * 2 + (Math.random() - 0.5) * 3, // Inherit and amplify bubble's rotation
        momentOfInertia: bubble.size * 0.8 * bubble.size * 0.8 / 400,
        lastUpdateTime: Date.now(),
        createdAt: Date.now()
      };
      
      setFallingEmojis(current => [...current, fallingEmoji]);
      
      // Create confetti at the bubble's position
      createConfetti(bubble.x + bubble.size/2, bubble.y + bubble.size/2, bubble.color);
      
      // If the bubble is large and can split, create smaller bubbles
      if (bubble.canSplit) {
        // Create 2-3 smaller bubbles
        const smallerBubbles = [];
        const numSplits = 2 + Math.floor(Math.random() * 2); // 2-3 bubbles
        
        for (let i = 0; i < numSplits; i++) {
          // Calculate new position slightly offset from the original bubble center
          const offsetX = (Math.random() - 0.5) * bubble.size * 0.3;
          const offsetY = (Math.random() - 0.5) * bubble.size * 0.3;
          const newPosition = {
            x: bubble.x + bubble.size/2 - (bubble.size * 0.6)/2 + offsetX,
            y: bubble.y + bubble.size/2 - (bubble.size * 0.6)/2 + offsetY
          };
          
          // Calculate new velocity with some randomization
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          const newVelocity = {
            x: Math.cos(angle) * speed + (bubble.speedX * 0.2), // Some inheritance from parent
            y: Math.sin(angle) * speed + (bubble.speedY * 0.2)  // Some inheritance from parent
          };
          
          // Create smaller bubble (about 60% of original size)
          const smallerBubble = generateRandomBubble(
            bubble.size * 0.6, 
            newPosition,
            newVelocity,
            Math.random() < 0.4 // 40% chance for smaller bubbles to be grenades
          );
          
          // Inherit color from parent for visual continuity if not a grenade
          if (!smallerBubble.isGrenade) {
            smallerBubble.color = bubble.color;
          }
          
          // Add to new bubbles array
          smallerBubbles.push(smallerBubble);
        }
        
        // Add the new smaller bubbles to the game
        setBubbles(currentBubbles => [...currentBubbles, ...smallerBubbles]);
        
        // Award extra points for splitting a bubble
        setScore(currentScore => currentScore + 15); // 10 for the pop + 5 bonus
      } else {
        // Regular score for normal bubbles
        setScore(currentScore => currentScore + 10);
      }
    }
    
    // Remove the popped bubble
    setBubbles(currentBubbles => currentBubbles.filter(b => b.id !== id));
  }, [bubbles, createShrapnel, createConfetti, generateRandomBubble, setShrapnel, setFallingEmojis, setBubbles, setScore]);
  
  // Game timer and bubble generator
  useEffect(() => {
    if (!gameActive) return;
    
    // Game timer
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setGameActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Bubble generator
    const generateBubble = () => {
      setBubbles(currentBubbles => {
        if (currentBubbles.length >= 2) return currentBubbles;
        
        // Force spawn a grenade if we haven't had one and game is 2/3 done
        const forceGrenade = !hasSpawnedGrenade && timeLeft <= 10;
        
        return [...currentBubbles, generateRandomBubble(null, null, null, forceGrenade)];
      });
      
      const delay = 800 + Math.random() * 700;
      bubbleTimerRef.current = setTimeout(generateBubble, delay);
    };
    
    const bubbleTimerRef = { current: setTimeout(generateBubble, 800) };
    
    return () => {
      clearInterval(timer);
      clearTimeout(bubbleTimerRef.current);
    };
  }, [gameActive, generateRandomBubble, hasSpawnedGrenade, timeLeft]);
  
  // Update bubble positions with physics-based rotation - using requestAnimationFrame for smoother motion
  useEffect(() => {
    if (!gameActive || bubbles.length === 0) return;
    
    const updateBubbles = (timestamp) => {
      setBubbles(currentBubbles => {
        let updatedBubbles = currentBubbles.map(bubble => {
          const now = Date.now();
          const elapsed = now - bubble.lastUpdateTime;
          const deltaTime = elapsed / 1000;
          
          // Check if bubble should start fading
          const age = now - bubble.createdAt;
          const maxAge = 10000; // 10 seconds
          
          if (age > maxAge && !bubble.isFading) {
            bubble.isFading = true;
            bubble.fadeStartTime = now;
          }
          
          // Handle fading
          if (bubble.isFading) {
            const fadeElapsed = now - bubble.fadeStartTime;
            const fadeDuration = 1000; // 1 second fade
            bubble.opacity = Math.max(0, 1 - (fadeElapsed / fadeDuration));
            
            // Make bubble slowly float upward while fading
            bubble.speedY = -2;
            bubble.speedX *= 0.95; // Slow horizontal movement
          }
          
          let { 
            x, y, speedX, speedY, size, bounceX, bounceY, bounceDecay, 
            lastBounce, scaleX, scaleY, rotation, angularVelocity, 
            angularMomentum, momentOfInertia, angularDrag, lastCollision, dragFactor
          } = bubble;
          
          // Calculate time since last collision (wall or bubble)
          const timeSinceCollision = now - lastCollision;
          
          // Gradually increase drag the longer a bubble goes without colliding
          // Start applying drag after 3 seconds, reaching max drag at 7 seconds
          if (timeSinceCollision > 3000) {
            // Calculate drag factor based on time (from 1.0 down to 0.85 over 4 seconds)
            const dragProgress = Math.min(1, (timeSinceCollision - 3000) / 4000);
            dragFactor = 1.0 - (0.15 * dragProgress);
          }
          
          // Apply current drag factor to velocities
          speedX *= Math.pow(dragFactor, deltaTime * 60);
          speedY *= Math.pow(dragFactor, deltaTime * 60);
          
          // Calculate new position with time-based movement for smoother motion
          x += speedX * deltaTime * 60; // Scale for 60fps equivalent
          y += speedY * deltaTime * 60;
          
          // Apply physical rotation based on angular velocity
          rotation = (rotation + angularVelocity * deltaTime * 60) % 360;
          
          // Apply angular drag to naturally slow rotation
          angularVelocity *= Math.pow(angularDrag, deltaTime * 60);
          angularMomentum = angularVelocity * momentOfInertia;
          
          // Smoother gravity effect - reduced by 50%
          speedY += 0.05 * deltaTime * 60;
          
          // Reset deformation gradually if not in collision
          let isWallCollision = false;
          let wallCollisionDirection = 0;
          let wallCollisionMagnitude = 0;
          
          // Bounce off the left/right edges with deformation
          if (x <= 0 || x + size >= window.innerWidth) {
            isWallCollision = true;
            wallCollisionDirection = x <= 0 ? 0 : Math.PI; // 0 for left wall, PI for right wall
            wallCollisionMagnitude = 0.25; // Deformation amount
            
            // Reset drag factor on wall collision
            dragFactor = 1.0;
            lastCollision = now;
            
            // Apply angular impulse based on impact velocity for more realistic rotation
            const tangentialVelocity = Math.abs(speedX);
            const angularImpulse = tangentialVelocity * 0.02 * (Math.random() > 0.5 ? 1 : -1);
            angularMomentum += angularImpulse * momentOfInertia;
            
            speedX = -speedX * bounceX;
            x = x <= 0 ? 0 : window.innerWidth - size;
            // Add a small vertical boost when hitting sides
            speedY -= 0.5;
            lastBounce = now;
          }
          
          // Bounce off the top/bottom edges with deformation
          if (y <= 0 || y + size >= window.innerHeight) {
            isWallCollision = true;
            wallCollisionDirection = y <= 0 ? Math.PI * 1.5 : Math.PI * 0.5; // PI*1.5 for top, PI*0.5 for bottom
            wallCollisionMagnitude = 0.25; // Deformation amount
            
            // Reset drag factor on wall collision
            dragFactor = 1.0;
            lastCollision = now;
            
            // Apply angular impulse based on impact velocity for more realistic rotation
            const tangentialVelocity = Math.abs(speedY);
            const angularImpulse = tangentialVelocity * 0.02 * (Math.random() > 0.5 ? 1 : -1);
            angularMomentum += angularImpulse * momentOfInertia;
            
            speedY = -speedY * bounceY;
            y = y <= 0 ? 0 : window.innerHeight - size;
            // Only apply bounce decay to vertical bounces
            bounceY *= bounceDecay;
            bounceX *= bounceDecay;
            lastBounce = now;
          }
          
          // Update angular velocity based on new angular momentum
          angularVelocity = angularMomentum / momentOfInertia;
          
          // Keep bubbles from getting stuck or moving too slow
          // Apply gentle, continuous motion rather than sudden resets
          if (Math.abs(speedX) < 0.3) {
            // Add a small force in the direction it's already moving
            speedX += (speedX >= 0 ? 0.03 : -0.03) * deltaTime * 60;
          }
          
          if (Math.abs(speedY) < 0.3) {
            speedY -= 0.05 * deltaTime * 60; // Slightly stronger upward force
          }
          
          // Keep bubbles from moving too fast
          const maxSpeed = 5;
          if (Math.abs(speedX) > maxSpeed) {
            speedX = Math.sign(speedX) * maxSpeed;
          }
          if (Math.abs(speedY) > maxSpeed) {
            speedY = Math.sign(speedY) * maxSpeed;
          }
          
          // Calculate deformation based on collision
          let newScaleX = 1;
          let newScaleY = 1;
          
          // Handle wall collision deformation
          if (isWallCollision) {
            // Calculate deformation vectors for walls
            const deformX = Math.cos(wallCollisionDirection) * wallCollisionMagnitude;
            const deformY = Math.sin(wallCollisionDirection) * wallCollisionMagnitude;
            
            // Apply squish effect (compress in direction of collision, expand perpendicular)
            newScaleX = 1 - Math.abs(deformX) + Math.abs(deformY) * 0.5;
            newScaleY = 1 - Math.abs(deformY) + Math.abs(deformX) * 0.5;
          } 
          // Handle bubble-bubble collision deformation
          else if (bubble.isColliding && bubble.collisionDirection !== undefined) {
            const magnitude = bubble.collisionMagnitude || 0.2;
            const deformX = Math.cos(bubble.collisionDirection) * magnitude;
            const deformY = Math.sin(bubble.collisionDirection) * magnitude;
            
            // Apply squish effect in collision direction
            newScaleX = 1 - Math.abs(deformX) + Math.abs(deformY) * 0.3;
            newScaleY = 1 - Math.abs(deformY) + Math.abs(deformX) * 0.3;
          } 
          // Gradually revert to normal shape
          else {
            // Smoothly transition back to normal scale
            const revertSpeed = 0.1 * deltaTime * 60;
            newScaleX = scaleX + (1 - scaleX) * revertSpeed;
            newScaleY = scaleY + (1 - scaleY) * revertSpeed;
            
            // Prevent small floating point differences
            if (Math.abs(newScaleX - 1) < 0.01) newScaleX = 1;
            if (Math.abs(newScaleY - 1) < 0.01) newScaleY = 1;
          }
          
          // Ensure scales stay within reasonable bounds
          newScaleX = Math.max(0.7, Math.min(1.3, newScaleX));
          newScaleY = Math.max(0.7, Math.min(1.3, newScaleY));
          
          // Apply a gentle bounce animation right after bouncing
          const timeSinceBounce = now - lastBounce;
          const bounceFactor = timeSinceBounce < 200 ? 
            Math.sin(timeSinceBounce / 20) * 0.06 * (200 - timeSinceBounce) / 200 : 0; // Increased bounce effect
          
          return {
            ...bubble,
            x,
            y, 
            speedX,
            speedY,
            bounceX,
            bounceY,
            lastBounce,
            rotation,
            angularVelocity,
            angularMomentum,
            scaleX: newScaleX,
            scaleY: newScaleY,
            // Add a small size oscillation on bounce
            temporarySize: size * (1 + bounceFactor),
            lastUpdateTime: now,
            lastCollision,
            dragFactor,
            opacity: bubble.opacity,
            isFading: bubble.isFading,
            fadeStartTime: bubble.fadeStartTime,
          };
        }).filter(bubble => {
          // Remove bubbles that:
          // 1. Have very low bounce
          // 2. Are offscreen
          // 3. Have completed fading
          const minBounce = 0.3;
          return (bubble.bounceX > minBounce || bubble.bounceY > minBounce) && 
                 bubble.y < window.innerHeight + bubble.size &&
                 bubble.opacity > 0;
        });
        
        // Then check for and handle bubble-bubble collisions
        updatedBubbles = checkCollisions(updatedBubbles);
        
        return updatedBubbles;
      });
      
      animationRef.current = requestAnimationFrame(updateBubbles);
    };
    
    const animationRef = { current: requestAnimationFrame(updateBubbles) };
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bubbles.length, gameActive]);
  
  // Update falling emojis with physics-based rotation
  useEffect(() => {
    if (!gameActive || fallingEmojis.length === 0) return;
    
    const updateEmojis = () => {
      setFallingEmojis(currentEmojis => 
        currentEmojis.map(emoji => {
          const now = Date.now();
          const elapsed = now - emoji.lastUpdateTime; // Time since last update in ms
          const deltaTime = elapsed / 1000; // Convert to seconds
          
          // Update position and rotation based on physics
          const y = emoji.y + emoji.speedY * deltaTime * 60;
          const rotation = (emoji.rotation + emoji.angularVelocity * deltaTime * 60) % 360;
          
          // Apply a slight decay to angular velocity
          const angularVelocity = emoji.angularVelocity * 0.995;
          
          return {
            ...emoji,
            y,
            rotation,
            angularVelocity,
            lastUpdateTime: now
          };
        })
        // Remove emojis that have fallen below the screen or are older than 2 seconds
        .filter(emoji => emoji.y < window.innerHeight + 100 && Date.now() - emoji.createdAt < 2000)
      );
      
      animationRef.current = requestAnimationFrame(updateEmojis);
    };
    
    const animationRef = { current: requestAnimationFrame(updateEmojis) };
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fallingEmojis.length, gameActive]);
  
  // Update confetti particles with time-based animation
  useEffect(() => {
    if (!gameActive) return;
    
    let lastTimestamp = null;
    
    const updateConfetti = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = timestamp;
      
      setConfetti(current => {
        if (current.length === 0) return current;
        
        return current.map(particle => {
          // Calculate age for opacity
          const age = Date.now() - particle.createdAt;
          
          // Update position with consistent time step
          const x = particle.x + particle.speedX * deltaTime * 60;
          const y = particle.y + particle.speedY * deltaTime * 60;
          
          // Apply gravity 
          const speedY = particle.speedY + particle.gravity * deltaTime * 60;
          
          // Update rotation
          const rotation = (particle.rotation + particle.rotationSpeed * deltaTime * 60) % 360;
          
          // Calculate opacity - extend lifespan
          const lifespan = 2000; // 2 seconds
          const baseOpacity = Math.max(0, 1 - (age / lifespan));
          
          // Enhanced sparkle effect
          let opacity = baseOpacity;
          if (particle.sparkle) {
            const sparkleSpeed = 0.01;
            const sparkleAmount = 0.4;
            opacity = baseOpacity * (1 + Math.sin(age * sparkleSpeed) * sparkleAmount);
          }
          
          return {
            ...particle,
            x,
            y,
            speedY,
            rotation,
            opacity
          };
        })
        // Keep particles on screen longer
        .filter(particle => {
          const age = Date.now() - particle.createdAt;
          return age < 2000 && particle.opacity > 0.1;
        });
      });
      
      animationRef.current = requestAnimationFrame(updateConfetti);
    };
    
    const animationRef = { current: requestAnimationFrame(updateConfetti) };
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive]);
  
  // Reset falling emojis and confetti when game starts/stops
  useEffect(() => {
    if (!gameActive) {
      setFallingEmojis([]);
      setConfetti([]);
    }
  }, [gameActive]);
  
  // Prevent default touch/drag behaviors
  const preventDrag = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (gameActive) {
      document.addEventListener('touchmove', preventDrag, { passive: false });
      document.addEventListener('dragstart', preventDrag);
      
      return () => {
        document.removeEventListener('touchmove', preventDrag);
        document.removeEventListener('dragstart', preventDrag);
      };
    }
  }, [gameActive]);
  
  const backgroundGradient = 'bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400';
  
  // Add shrapnel update effect
  useEffect(() => {
    if (!gameActive || shrapnel.length === 0) return;
    
    const updateShrapnel = (timestamp) => {
      setShrapnel(current => {
        return current.map(piece => {
          const now = Date.now();
          const elapsed = now - piece.lastUpdateTime;
          const deltaTime = elapsed / 1000;
          
          // Update position
          const x = piece.x + piece.speedX * deltaTime * 60;
          const y = piece.y + piece.speedY * deltaTime * 60;
          
          // Check for collisions with bubbles
          setBubbles(currentBubbles => {
            return currentBubbles.filter(bubble => {
              const bubbleCenter = {
                x: bubble.x + bubble.size/2,
                y: bubble.y + bubble.size/2
              };
              
              const distance = Math.sqrt(
                Math.pow(x - bubbleCenter.x, 2) + 
                Math.pow(y - bubbleCenter.y, 2)
              );
              
              // If shrapnel hits a bubble, pop it
              if (distance < bubble.size/2 + piece.size/2) {
                popBubble(bubble.id);
                return false;
              }
              return true;
            });
          });
          
          return {
            ...piece,
            x,
            y,
            lastUpdateTime: now
          };
        }).filter(piece => {
          // Remove shrapnel that's off screen or too old
          return piece.x >= 0 && 
                 piece.x <= window.innerWidth && 
                 piece.y >= 0 && 
                 piece.y <= window.innerHeight &&
                 Date.now() - piece.createdAt < 2000;
        });
      });
      
      animationRef.current = requestAnimationFrame(updateShrapnel);
    };
    
    const animationRef = { current: requestAnimationFrame(updateShrapnel) };
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shrapnel.length, gameActive, popBubble]);
  
  return (
    <div className={`w-full h-screen ${backgroundGradient} overflow-hidden relative`}>
      {/* Game UI */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-10">
        <div className="bg-white bg-opacity-80 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
          Score: {score}
        </div>
        <div className="bg-white bg-opacity-80 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
          Time: {timeLeft}s
        </div>
      </div>
      
      {/* Bubbles */}
      {bubbles.map(bubble => {
        // Store color in the bubble object instead of generating a new one on each render
        const bubbleColor = bubble.color || `hsla(${Math.floor(Math.random() * 360)}, 80%, 70%, 0.8)`;
        if (!bubble.color) bubble.color = bubbleColor;
        
        return (
          <div 
            key={bubble.id}
            className="absolute rounded-full flex items-center justify-center cursor-pointer select-none shadow-lg"
            style={{
              width: `${bubble.temporarySize || bubble.size}px`, 
              height: `${bubble.temporarySize || bubble.size}px`,
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              transform: `rotate(${bubble.rotation}deg) scale(${bubble.scaleX}, ${bubble.scaleY})`,
              backgroundColor: bubbleColor,
              fontSize: `${bubble.size / 2}px`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              opacity: bubble.opacity,
              transition: bubble.isFading ? 'opacity 0.1s' : 'none',
            }}
            onClick={() => popBubble(bubble.id)}
            onTouchStart={(e) => {
              e.preventDefault();
              popBubble(bubble.id);
            }}
          >
            {bubble.emoji}
          </div>
        );
      })}
      
      {/* Confetti */}
      {confetti.map(particle => (
        <div 
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.type === 'circle' ? particle.color : undefined,
            borderRadius: particle.type === 'circle' ? '50%' : '0',
            boxShadow: particle.sparkle ? `0 0 ${particle.size * 2}px ${particle.color}` : undefined,
            zIndex: 5, // Ensure confetti is visible above other elements
            willChange: 'transform, opacity' // Performance optimization
          }}
        >
          {particle.type === 'rect' && (
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: particle.color,
                transform: `rotate(${Math.random() * 90}deg)`,
                boxShadow: particle.sparkle ? `0 0 ${particle.size}px ${particle.color}` : undefined
              }}
            />
          )}
        </div>
      ))}
      
      {/* Falling Emojis */}
      {fallingEmojis.map(emoji => (
        <div 
          key={emoji.id}
          className="absolute text-center pointer-events-none"
          style={{
            fontSize: `${emoji.size / 2}px`,
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            transform: `rotate(${emoji.rotation}deg)`,
            opacity: 1 - ((Date.now() - emoji.createdAt) / 2000)
          }}
        >
          {emoji.emoji}
        </div>
      ))}
      
      {/* Shrapnel */}
      {shrapnel.map(piece => (
        <div 
          key={piece.id}
          className="absolute rounded-full bg-gray-800"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
          }}
        />
      ))}
      
      {/* Start/End screen */}
      {!gameActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-20">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4">
              {timeLeft === 0 ? "Game Over!" : "Emoji Bubble Pop!"}
            </h1>
            
            {timeLeft === 0 && (
              <p className="text-xl mb-6">Your score: {score}</p>
            )}
            
            <p className="mb-6">
              {timeLeft === 0 
                ? "Great job! Want to play again?" 
                : "Pop as many emoji bubbles as you can in 120 seconds!"}
            </p>
            
            <button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
              onClick={startGame}
            >
              {timeLeft === 0 ? "Play Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiGame;