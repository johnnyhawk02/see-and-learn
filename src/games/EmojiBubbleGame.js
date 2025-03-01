import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Bubble component with simplified physics
const Bubble = React.memo(({ position, size, emoji, color, isGrenade, onPop, id, bubbles, initialVelocity }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const randomVelocity = new THREE.Vector3(
    (Math.random() - 0.5) * 4.5,  // Increased random x velocity
    (Math.random() - 0.5) * 4.5,  // Increased random y velocity
    0
  );
  const randomAngularVelocity = (Math.random() - 0.5) * 2;  // Random spin
  const velocity = useRef(randomVelocity);
  const angularVelocity = useRef(randomAngularVelocity);
  const rotationQuaternion = useRef(new THREE.Quaternion());
  const startTime = useRef(Date.now());  // Add start time reference
  const currentScale = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate scale with smoother easing (0.5 seconds)
    const age = Math.min(1, (Date.now() - startTime.current) / 600); // Slightly longer animation
    // Smoother cubic easing function
    const easedScale = age < 0.5 ? 4 * age * age * age : 1 - Math.pow(-2 * age + 2, 3) / 2;
    currentScale.current = easedScale;
    meshRef.current.scale.setScalar(easedScale);

    // Update position with smooth movement
    meshRef.current.position.x += velocity.current.x * delta;
    meshRef.current.position.y += velocity.current.y * delta;
    meshRef.current.position.z = 0;

    // Calculate camera-facing orientation
    const cameraDirection = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDirection);
    const upVector = new THREE.Vector3(0, 1, 0);
    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(cameraDirection, new THREE.Vector3(0, 0, 0), upVector)
    );

    // Apply spin rotation with smoother interpolation
    const spinAxis = new THREE.Vector3(0, 0, 1);
    const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(
      spinAxis,
      angularVelocity.current * delta * 0.5 // Reduced rotation speed
    );

    // Combine rotations with smoother interpolation
    rotationQuaternion.current
      .multiply(spinQuaternion)
      .slerp(targetQuaternion, 0.02); // Even smoother transition to camera-facing

    // Apply final rotation
    meshRef.current.quaternion.copy(rotationQuaternion.current);
    
    // Gradually reduce angular velocity (friction)
    angularVelocity.current *= 0.98; // Gentler friction for smoother deceleration

    // Limit angular velocity to prevent excessive spinning
    angularVelocity.current = Math.max(-2, Math.min(2, angularVelocity.current)); // Reduced max angular velocity

    // Calculate screen bounds based on camera properties
    const camera = state.camera;
    const aspect = camera.aspect || window.innerWidth / window.innerHeight;
    const vFov = camera.fov * (Math.PI / 180); // vertical fov in radians
    const height = 2 * Math.tan(vFov / 2) * camera.position.z; // visible height
    const width = height * aspect; // visible width
    
    const bounds = {
      x: width / 2 - 0.5, // Subtract a small buffer to keep objects fully visible
      y: height / 2 - 0.5,
    };

    // Enhanced bounces off walls with more visible effects
    if (Math.abs(meshRef.current.position.x) > bounds.x) {
      // Reverse direction with more energy preservation
      velocity.current.x = -velocity.current.x * 0.85;
      
      // Ensure object is placed at the boundary to prevent sticking
      meshRef.current.position.x = Math.sign(meshRef.current.position.x) * bounds.x;
      
      // Add some vertical velocity for more interesting bounces
      velocity.current.y += (Math.random() - 0.5) * 0.5;
      
      // Add some spin on wall collision for visual interest
      angularVelocity.current += Math.sign(velocity.current.x) * 1.2;
    }

    if (meshRef.current.position.y < -bounds.y) {
      // Floor bounce with slight energy loss
      velocity.current.y = Math.abs(velocity.current.y) * 0.85;
      
      // Ensure object is placed at the boundary
      meshRef.current.position.y = -bounds.y;
      
      // Add some horizontal velocity variation for more natural movement
      velocity.current.x += (Math.random() - 0.5) * 0.5;
      
      // Add some spin on floor collision
      angularVelocity.current += velocity.current.x * 0.8;
    }

    if (meshRef.current.position.y > bounds.y) {
      // Ceiling bounce with slight energy loss
      velocity.current.y = -Math.abs(velocity.current.y) * 0.85;
      
      // Ensure object is placed at the boundary
      meshRef.current.position.y = bounds.y;
      
      // Add some horizontal velocity variation
      velocity.current.x += (Math.random() - 0.5) * 0.5;
      
      // Add some spin on ceiling collision
      angularVelocity.current += velocity.current.x * 0.8;
    }

    // Check collisions with other bubbles
    bubbles.forEach(otherBubble => {
      if (otherBubble.id === id || !otherBubble.ref?.current) return;

      const otherPos = new THREE.Vector3();
      otherBubble.ref.current.getWorldPosition(otherPos);
      const myPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(myPos);

      const distance = myPos.distanceTo(otherPos);
      const combinedSize = (size + otherBubble.size) * 1.2;  // Using the scaled size

      if (distance < combinedSize) {
          // Calculate collision response
        const normal = myPos.clone().sub(otherPos).normalize();
        const relativeVelocity = velocity.current.clone().sub(otherBubble.ref.current.userData.velocity || new THREE.Vector3());
        const velocityAlongNormal = relativeVelocity.dot(normal);

        // Only resolve if bubbles are moving towards each other
        if (velocityAlongNormal < 0) {
          const restitution = 0.4; // Further reduced restitution for even less bouncy collisions
          const impulseStrength = -(1 + restitution) * velocityAlongNormal;
          const impulse = normal.multiplyScalar(impulseStrength);

          // Update velocities with damping
          velocity.current.add(impulse.clone().multiplyScalar(0.8)); // Damped impulse
          if (otherBubble.ref.current.userData.velocity) {
            otherBubble.ref.current.userData.velocity.sub(impulse.clone().multiplyScalar(0.8)); // Damped impulse
          }

          // Add spin based on the collision, but less aggressive
          const impactSpeed = Math.abs(velocityAlongNormal);
          const tangent = new THREE.Vector3(-normal.y, normal.x, 0);
          const spinFactor = tangent.dot(relativeVelocity) * 1.5; // Reduced spin factor
          angularVelocity.current += spinFactor * impactSpeed * 0.8; // Damped spin response
          
          // Also affect the other bubble's spin (if it has angular velocity)
          if (otherBubble.ref.current.userData.angularVelocity !== undefined) {
            otherBubble.ref.current.userData.angularVelocity -= spinFactor * impactSpeed * 0.8; // Damped spin response
          }

          // Separate the bubbles to prevent sticking
          const overlap = combinedSize - distance;
          const separationVector = normal.multiplyScalar(overlap * 0.6); // Gentler separation
          meshRef.current.position.add(separationVector);
        }
      }
    });

    // Store current velocity and angular velocity for collision calculations
    meshRef.current.userData.velocity = velocity.current.clone();
    meshRef.current.userData.angularVelocity = angularVelocity.current;
  });

  // Store ref for position tracking (removed collision detection)
  useEffect(() => {
    const bubble = bubbles.find(b => b.id === id);
    if (bubble) {
      bubble.ref = meshRef;
      bubble.groupRef = groupRef;
    }
  }, [id, bubbles]);

  return (
    <group ref={groupRef} position={position}>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onPop(id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPop(id);
        }}
      >
        <Html
          center
          style={{
            fontSize: `${size * 100}px`,
            cursor: 'pointer',
            userSelect: 'none',
            filter: isGrenade ? 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))' : 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.2))',
            transform: `scale(${currentScale.current})`,
            transition: 'filter 0.2s ease-out',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            WebkitFontSmoothing: 'antialiased',
            WebkitPerspective: '1000',
            WebkitBackfaceVisibility: 'hidden',
          }}
          transform
          occlude={false}
          zIndexRange={[16777271, 16777272]}
          distanceFactor={10}
          prepend={true}
          portal={{current: null}}
        >
          <div 
            className="emoji-bubble"
            onPointerDown={(e) => {
              e.stopPropagation();
              onPop(id);
            }}
            style={{
              transform: 'scale(1)',
              animation: 'float 3s ease-in-out infinite alternate',
              pointerEvents: 'auto',
              WebkitTransform: 'translateZ(0)',
              WebkitPerspective: '1000',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {emoji}
          </div>
        </Html>
      </mesh>
    </group>
  );
});

// Particle system for effects (confetti, shrapnel)
const ParticleSystem = ({ position, count, color, size, spread, lifetime, bubbles, onBubblePop, isGrenade }) => {
  const particles = useRef();
  const startTime = useRef(Date.now());
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    // Initialize particles with more explosive spread
    for (let i = 0; i < count; i++) {
      // Set initial positions at the bubble's location
      pos[i * 3 + 0] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];

      // Create more varied explosion angles
      const angle = (i / count) * Math.PI * 2;
      const randomSpread = Math.random() * Math.PI * 2;
      const upwardBias = Math.random() * 0.5;
      
      // Calculate velocities with more variation and higher initial speed
      const speed = (Math.random() * 0.5 + 0.5) * spread * 2;
      velocities[i * 3 + 0] = Math.cos(angle + randomSpread) * speed;
      velocities[i * 3 + 1] = Math.sin(angle + randomSpread) * speed + upwardBias * speed;
      velocities[i * 3 + 2] = 0;
    }
    return { positions: pos, velocities };
  }, [count, spread, position]);

  useFrame((state, delta) => {
    const { positions: pos, velocities } = positions;
    const age = (Date.now() - startTime.current) / lifetime;
    
    if (age >= 1) return;
    
    // Only check particle collisions for grenade explosions
    if (isGrenade) {
      bubbles.forEach(bubble => {
        if (!bubble.ref?.current) return;
        
        const bubblePos = new THREE.Vector3();
        bubble.ref.current.getWorldPosition(bubblePos);
        const bubbleRadius = bubble.size;

        // Check each particle for collision with this bubble
        for (let i = 0; i < count; i++) {
          const particlePos = new THREE.Vector3(
            pos[i * 3 + 0],
            pos[i * 3 + 1],
            pos[i * 3 + 2]
          );

          const distance = particlePos.distanceTo(bubblePos);
          if (distance < bubbleRadius) {
            // Particle hit a bubble - trigger pop
            onBubblePop(bubble.id);
            // Skip remaining collision checks for this bubble
            break;
          }
        }
      });
    }

    for (let i = 0; i < count; i++) {
      // Update positions with higher speed
      pos[i * 3 + 0] += velocities[i * 3 + 0] * delta * 2;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * delta * 2;
      pos[i * 3 + 2] = position[2];
      
      // Calculate screen bounds based on camera properties
      const camera = state.camera;
      const aspect = camera.aspect || window.innerWidth / window.innerHeight;
      const vFov = camera.fov * (Math.PI / 180); // vertical fov in radians
      const height = 2 * Math.tan(vFov / 2) * camera.position.z; // visible height
      const width = height * aspect; // visible width
      
      const bounds = {
        x: width / 2 - 0.2, // Smaller buffer for particles
        y: height / 2 - 0.2,
      };
      
      // Bounce off left and right edges
      if (Math.abs(pos[i * 3 + 0]) > bounds.x) {
        velocities[i * 3 + 0] = -velocities[i * 3 + 0] * 0.8; // Reverse with energy loss
        pos[i * 3 + 0] = Math.sign(pos[i * 3 + 0]) * bounds.x; // Place at boundary
      }
      
      // Bounce off top and bottom edges
      if (Math.abs(pos[i * 3 + 1]) > bounds.y) {
        velocities[i * 3 + 1] = -velocities[i * 3 + 1] * 0.8; // Reverse with energy loss
        pos[i * 3 + 1] = Math.sign(pos[i * 3 + 1]) * bounds.y; // Place at boundary
      }
    }
    particles.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade out particles over time with a longer visible period
    if (particles.current.material) {
      particles.current.material.opacity = Math.min(1, 2 * (1 - age));
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
};

// Main game scene with simplified bubble generation
const GameScene = ({ gameActive, score, timeLeft, onScore }) => {
  const [bubbles, setBubbles] = useState([]);
  const [effects, setEffects] = useState([]);
  const { raycaster, camera, gl } = useThree();
  const sceneRef = useRef();

  // Emoji collection
  const emojis = useMemo(() => ({
    regular: [
      "🐶", "🐱", "🐼", "🦊", "🦁", "🐯", "🦖", "🐙", "🦋", "🐳",
      "🦄", "🐸", "🐰", "🐨", "🐮", "🐷", "🐵", "🦒", "🦘", "🦩",
      "🦦", "🦥", "🦡", "🦨", "🦔", "🐿️", "🦫", "🦃", "🦚", "🦜",
      "🐧", "🦢", "🦅", "🦉", "🐢", "🦎", "🐠", "🐡", "🦈", "🐋"
    ],
    grenades: ["💣", "🧨", "💥"]
  }), []);

  // Emoji color mapping
  const emojiColors = useMemo(() => ({
    // Animals with their characteristic colors
    "🐶": "#A52A2A",  // Brown
    "🐱": "#FFA500",  // Orange
    "🐼": "#FFFFFF",  // White
    "🦊": "#FF6B00",  // Fox orange
    "🦁": "#FFD700",  // Golden
    "🐯": "#FFA500",  // Tiger orange
    "🦖": "#228B22",  // Forest green
    "🐙": "#FF69B4",  // Pink
    "🦋": "#4169E1",  // Royal blue
    "🐳": "#00BFFF",  // Deep sky blue
    "🦄": "#FF69B4",  // Pink
    "🐸": "#32CD32",  // Lime green
    "🐰": "#FFE4E1",  // Misty rose
    "🐨": "#808080",  // Grey
    "🐮": "#000000",  // Black and white
    "🐷": "#FFC0CB",  // Pink
    "🐵": "#8B4513",  // Brown
    "🦒": "#DAA520",  // Golden brown
    "🦘": "#CD853F",  // Tan
    "🦩": "#FF69B4",  // Pink
    "🦦": "#8B4513",  // Brown
    "🦥": "#8B4513",  // Brown
    "🦡": "#808080",  // Grey
    "🦨": "#000000",  // Black
    "🦔": "#8B4513",  // Brown
    "🐿️": "#CD853F", // Brown
    "🦫": "#8B4513",  // Brown
    "🦃": "#8B4513",  // Brown
    "🦚": "#4169E1",  // Royal blue
    "🦜": "#FF0000",  // Red
    "🐧": "#000000",  // Black
    "🦢": "#FFFFFF",  // White
    "🦅": "#8B4513",  // Brown
    "🦉": "#8B4513",  // Brown
    "🐢": "#228B22",  // Forest green
    "🦎": "#32CD32",  // Lime green
    "🐠": "#00BFFF",  // Deep sky blue
    "🐡": "#FF69B4",  // Pink
    "🦈": "#808080",  // Grey
    "🐋": "#0000FF",  // Blue
    // Grenades
    "💣": "#000000",  // Black
    "🧨": "#FF0000",  // Red
    "💥": "#FF4500"   // Orange red
  }), []);

  // Generate bubbles with better initial positions
  useEffect(() => {
    if (!gameActive) {
      setBubbles([]);
      return;
    }

    const interval = setInterval(() => {
      if (bubbles.length < 15) {
        const isGrenade = Math.random() < 0.3; // 30% chance for grenade
        
        // Calculate screen bounds based on camera
        const vFov = camera.fov * (Math.PI / 180); // vertical fov in radians
        const height = 2 * Math.tan(vFov / 2) * camera.position.z; // visible height
        const width = height * camera.aspect; // visible width
        
        const spawnBounds = {
          x: width / 2,
          y: height / 2
        };
        
        // Choose spawn side: top, bottom, left, right, or center
        const spawnType = Math.random();
        let spawnPosition;
        
        if (spawnType < 0.2) { // Top
          spawnPosition = [
            (Math.random() - 0.5) * width,  // Random x position across width
            spawnBounds.y + 0.5,            // Just above top edge
            0
          ];
        } else if (spawnType < 0.4) { // Bottom
          spawnPosition = [
            (Math.random() - 0.5) * width,  // Random x position across width
            -spawnBounds.y - 0.5,           // Just below bottom edge
            0
          ];
        } else if (spawnType < 0.6) { // Left
          spawnPosition = [
            -spawnBounds.x - 0.5,           // Just left of left edge
            (Math.random() - 0.5) * height, // Random y position across height
            0
          ];
        } else if (spawnType < 0.8) { // Right
          spawnPosition = [
            spawnBounds.x + 0.5,            // Just right of right edge
            (Math.random() - 0.5) * height, // Random y position across height
            0
          ];
        } else { // Center area
          spawnPosition = [
            (Math.random() - 0.5) * (width * 0.6),  // Random x in center area (60% of width)
            (Math.random() - 0.5) * (height * 0.6), // Random y in center area (60% of height)
            0
          ];
        }

        // Adjust initial velocity based on spawn position - direct toward center
        const velocityX = spawnPosition[0] > 0 ? -1.5 : (spawnPosition[0] < 0 ? 1.5 : (Math.random() - 0.5) * 1.5);
        const velocityY = spawnPosition[1] > 0 ? -1.5 : (spawnPosition[1] < 0 ? 1.5 : (Math.random() - 0.5) * 1.5);

        const newBubble = {
          id: Math.random().toString(36).substr(2, 9),
          position: spawnPosition,
          size: isGrenade ? 0.5 : Math.random() * 0.4 + 0.3,
          emoji: isGrenade 
            ? emojis.grenades[Math.floor(Math.random() * emojis.grenades.length)]
            : emojis.regular[Math.floor(Math.random() * emojis.regular.length)],
          color: isGrenade ? '#ff0000' : `hsl(${Math.random() * 360}, 80%, 75%)`,
          isGrenade: isGrenade,
          ref: null,
          initialVelocity: [velocityX, velocityY, 0]
        };
        setBubbles(prev => [...prev, newBubble]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameActive, bubbles.length, emojis, camera]);

  const handlePop = useCallback((id) => {
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble || !bubble.ref?.current || !bubble.groupRef?.current) return prev;

      // Calculate absolute position by combining group and mesh positions
      const groupPosition = bubble.groupRef.current.position;
      const meshPosition = bubble.ref.current.position;
      const absolutePosition = [
        groupPosition.x + meshPosition.x,
        groupPosition.y + meshPosition.y,
        0  // Keep z at 0
      ];

      // Create explosion effect with more visible particles
      setEffects(prev => [...prev, {
        id: Math.random(),
        position: absolutePosition,
        // Use color matching the emoji, with fallback to a default color
        color: emojiColors[bubble.emoji] 
          ? parseInt(emojiColors[bubble.emoji].replace('#', '0x'))
          : 0xFFD700, // Default to gold color if no mapping exists
        count: 20,
        spread: bubble.isGrenade ? 3.0 : 2.5,
        size: bubble.isGrenade ? 0.2 : 0.25,
        lifetime: bubble.isGrenade ? 1500 : 1500,
        startTime: Date.now(),
        isGrenade: bubble.isGrenade
      }]);

      // Update score
      onScore(bubble.isGrenade ? 50 : 10);

      return prev.filter(b => b.id !== id);
    }, [onScore, emojiColors]);
  }, [onScore, emojiColors]);

  // Cleanup old effects
  useEffect(() => {
    const cleanup = setInterval(() => {
      setEffects(prev => prev.filter(effect => 
        Date.now() - effect.startTime < effect.lifetime
      ));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleClick = (event) => {
      if (!gameActive) return;

      // Get click coordinates
      const x = (event.clientX / canvas.clientWidth) * 2 - 1;
      const y = -(event.clientY / canvas.clientHeight) * 2 + 1;

      // Update raycaster
      raycaster.layers.enableAll();
      raycaster.params.Line.threshold = 0.1;
      raycaster.params.Points.threshold = 0.1;
      raycaster.setFromCamera({ x, y }, camera);

      // Find intersections with meshes
      const intersects = raycaster.intersectObjects(
        bubbles.map(b => b.ref?.current).filter(Boolean),
        false
      );

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const bubble = bubbles.find(b => b.ref?.current === clickedMesh);
        if (bubble) {
          handlePop(bubble.id);
        }
      }
    };

    const handleTouch = (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      handleClick(touch);
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameActive, bubbles, camera, gl, raycaster, handlePop]);
  
  return (
    <group ref={sceneRef}>
      {/* Enhanced Lighting - adjusted for sky blue background */}
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={2.5} />
      <pointLight position={[-10, -10, -10]} intensity={1.5} />
      <directionalLight position={[-10, 10, -5]} intensity={2} />
      <directionalLight position={[0, -10, 0]} intensity={0.8} color="#ffffff" />

      {/* Game boundary indicator - wireframe box */}
      <mesh visible={gameActive}>
        <boxGeometry args={[
          camera.aspect * 2 * Math.tan(camera.fov * (Math.PI / 180) / 2) * camera.position.z - 0.1, 
          2 * Math.tan(camera.fov * (Math.PI / 180) / 2) * camera.position.z - 0.1, 
          0.01
        ]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent wireframe />
      </mesh>
      
      {/* Corner markers for better visibility */}
      {gameActive && (
        <>
          {/* Calculate corner positions */}
          {(() => {
            const width = camera.aspect * 2 * Math.tan(camera.fov * (Math.PI / 180) / 2) * camera.position.z - 0.1;
            const height = 2 * Math.tan(camera.fov * (Math.PI / 180) / 2) * camera.position.z - 0.1;
            const halfWidth = width / 2;
            const halfHeight = height / 2;
            
            return (
              <>
                {/* Top-left corner */}
                <mesh position={[-halfWidth, halfHeight, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#ff5555" />
                </mesh>
                
                {/* Top-right corner */}
                <mesh position={[halfWidth, halfHeight, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#55ff55" />
                </mesh>
                
                {/* Bottom-left corner */}
                <mesh position={[-halfWidth, -halfHeight, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#5555ff" />
                </mesh>
                
                {/* Bottom-right corner */}
                <mesh position={[halfWidth, -halfHeight, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#ffff55" />
                </mesh>
              </>
            );
          })()}
        </>
      )}

      {/* Bubbles */}
      {bubbles.map(bubble => (
        <Bubble key={bubble.id} {...bubble} bubbles={bubbles} onPop={handlePop} />
      ))}

      {/* Effects */}
      {effects.map(effect => (
        <ParticleSystem 
          key={effect.id} 
          position={effect.position} 
          {...effect} 
          bubbles={bubbles}
          onBubblePop={handlePop}
          isGrenade={effect.isGrenade}
        />
      ))}

      {/* Game UI */}
      <Html fullscreen>
      <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-10">
          <div className="bg-white bg-opacity-90 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
          Score: {score}
        </div>
          <div className="bg-white bg-opacity-90 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
          Time: {timeLeft}s
        </div>
      </div>
      </Html>
    </group>
  );
};

// Main game component
const EmojiGame = () => {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(120);
  };
        
        return (
    <div className="w-full h-screen relative">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(2px) rotate(1deg); }
            50% { transform: translateY(3px) rotate(2deg); }
            75% { transform: translateY(4px) rotate(2.5deg); }
            100% { transform: translateY(5px) rotate(3deg); }
          }
          
          @keyframes appear {
            0% { opacity: 0; transform: scale(0.5); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          .emoji-bubble {
            transform: translate3d(0,0,0);
            backface-visibility: hidden;
            perspective: 1000px;
            transform-style: preserve-3d;
          }
        `}
      </style>
      <div className="absolute inset-0 z-0" style={{ backgroundColor: '#87CEEB' }}>
        <Canvas
          camera={{ 
            position: [0, 0, 12],  // Moved camera further back
            fov: 35,               // Reduced FOV for less distortion
            near: 0.1,
            far: 1000
          }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <color attach="background" args={['#87CEEB']} />
          <GameScene
            gameActive={gameActive}
            score={score}
            timeLeft={timeLeft}
            onScore={(points) => setScore(prev => prev + points)}
          />
        </Canvas>
        </div>
      
      {/* Start/End screen */}
      {!gameActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-50" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4">
              {timeLeft === 0 ? "Game Over!" : "3D Emoji Bubble Pop!"}
            </h1>
            
            {timeLeft === 0 && (
              <p className="text-xl mb-6">Your score: {score}</p>
            )}
            
            <p className="mb-6">
              {timeLeft === 0 
                ? "Great job! Want to play again?" 
                : "Pop as many 3D emoji bubbles as you can in 120 seconds!"}
            </p>
            
            <button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
              onClick={startGame}
              style={{ cursor: 'pointer' }}
            >
              {timeLeft === 0 ? "Play Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}

      {/* Game UI */}
      {gameActive && (
        <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-40">
          <div className="bg-white bg-opacity-90 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
            Score: {score}
          </div>
          <div className="bg-white bg-opacity-90 rounded-full px-4 py-2 font-bold text-lg shadow-lg">
            Time: {timeLeft}s
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiGame;