import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Custom hook for sound effects
const useSoundEffects = () => {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [activeSounds, setActiveSounds] = useState([]);
  
  // Define sound effects
  const sounds = useMemo(() => ({
    pop: new Audio('/sounds/pop.mp3'),
    explosion: new Audio('/sounds/explosion.mp3'),
    gameStart: new Audio('/sounds/game_start.mp3'),
    gameOver: new Audio('/sounds/game_over.mp3'),
    backgroundMusic: new Audio('/sounds/background_music.mp3')
  }), []);
  
  // Initialize sounds
  useEffect(() => {
    // Set volume levels
    sounds.pop.volume = 0.7;
    sounds.explosion.volume = 0.8;
    sounds.gameStart.volume = 0.7;
    sounds.gameOver.volume = 0.7;
    sounds.backgroundMusic.volume = 0.4;
    
    // Configure sounds to not loop by default
    sounds.pop.loop = false;
    sounds.explosion.loop = false;
    sounds.gameStart.loop = false;
    sounds.gameOver.loop = false;
    sounds.backgroundMusic.loop = true; // Only background music should loop
    
    // Cleanup function
    return () => {
      // Stop all sounds when component unmounts
      Object.values(sounds).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    };
  }, [sounds]);
  
  // Function to play a sound
  const play = useCallback((soundName, addVariation = false) => {
    if (!soundsEnabled) return null;
    
    // Skip background music if music is disabled
    if (soundName === 'backgroundMusic' && !musicEnabled) return null;
    
    const sound = sounds[soundName];
    if (!sound) return null;
    
    // Create a clone for overlapping sounds
    const soundInstance = soundName === 'backgroundMusic' ? sound : sound.cloneNode();
    
    // Add slight pitch variation for more natural sound (except for music)
    if (addVariation && soundName !== 'backgroundMusic') {
      soundInstance.playbackRate = 0.85 + Math.random() * 0.3;
    }
    
    // Ensure non-background sounds don't loop
    if (soundName !== 'backgroundMusic') {
      soundInstance.loop = false;
    }
    
    // Play the sound
    soundInstance.play().catch(e => console.error('Error playing sound:', e));
    
    // Add to active sounds
    const id = Date.now();
    setActiveSounds(prev => [...prev, { id, instance: soundInstance, name: soundName }]);
    
    // Remove from active sounds when finished
    soundInstance.addEventListener('ended', () => {
      setActiveSounds(prev => prev.filter(s => s.id !== id));
    });
    
    return soundInstance;
  }, [sounds, soundsEnabled, musicEnabled]);
  
  // Function to stop all sounds
  const stopAllSounds = useCallback(() => {
    activeSounds.forEach(({ instance }) => {
      instance.pause();
      instance.currentTime = 0;
    });
    setActiveSounds([]);
  }, [activeSounds]);
  
  // Toggle background music
  const toggleBackgroundMusic = useCallback(() => {
    setMusicEnabled(prev => {
      const newState = !prev;
      
      // Stop any currently playing music
      const bgMusic = sounds.backgroundMusic;
      bgMusic.pause();
      bgMusic.currentTime = 0;
      
      // If turning on and sounds are enabled, start playing
      if (newState && soundsEnabled) {
        bgMusic.play().catch(e => console.error('Error playing background music:', e));
      }
      
      return newState;
    });
  }, [sounds, soundsEnabled]);
  
  // Toggle sound effects
  const toggleSounds = useCallback(() => {
    setSoundsEnabled(prev => {
      const newState = !prev;
      
      // If turning off, stop all sounds
      if (!newState) {
        stopAllSounds();
      }
      
      return newState;
    });
  }, [stopAllSounds]);
  
  return {
    play,
    stopAllSounds,
    toggleBackgroundMusic,
    toggleSounds,
    soundsEnabled,
    musicEnabled
  };
};

// Bubble component with simplified physics
const Bubble = React.memo(({ position, size, emoji, color, isGrenade, onPop, id, bubbles, initialVelocity, settings }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const randomVelocity = new THREE.Vector3(
    (Math.random() - 0.5) * 1.8 * settings.bubbleSpeed,
    (Math.random() - 0.5) * 1.8 * settings.bubbleSpeed,
    0
  );
  // Very gentle initial rotation
  const randomAngularVelocity = (Math.random() - 0.5) * 0.1;
  const velocity = useRef(randomVelocity);
  const angularVelocity = useRef(randomAngularVelocity);
  const rotationAngle = useRef(0);
  const startTime = useRef(Date.now());
  const currentScale = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate scale with smoother easing (0.5 seconds)
    const age = Math.min(1, (Date.now() - startTime.current) / 500);
    const easedScale = age < 0.5 ? 4 * age * age * age : 1 - Math.pow(-2 * age + 2, 3) / 2;
    currentScale.current = easedScale;

    // Apply gravity
    velocity.current.y -= settings.gravity * delta;

    // Update position with smooth movement
    const speedMultiplier = settings.bubbleSpeed;
    let posX = position[0] + velocity.current.x * delta * speedMultiplier;
    let posY = position[1] + velocity.current.y * delta * speedMultiplier;
    const posZ = position[2];

    // Bounce off walls
    let velocityX = velocity.current.x;
    let velocityY = velocity.current.y;

    // Update rotation angle based on angular velocity
    rotationAngle.current += angularVelocity.current * delta;

    // Create rotation matrix
    const rotation = new THREE.Matrix4().makeRotationZ(rotationAngle.current);
    meshRef.current.matrix.copy(rotation);
    meshRef.current.matrixAutoUpdate = false;

    // Very gentle natural dampening of rotation
    angularVelocity.current *= 0.995;

    // Calculate screen bounds based on camera properties
    const camera = state.camera;
    const aspect = camera.aspect || window.innerWidth / window.innerHeight;
    const vFov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(vFov / 2) * camera.position.z;
    const width = height * aspect;
    
    const bounds = {
      x: width / 2 - 0.5,
      y: height / 2 - 0.5,
    };

    // Enhanced bounces off walls with spin effects
    if (Math.abs(posX) > bounds.x) {
      velocityX = -velocityX * settings.bounceEnergy;
      posX = Math.sign(posX) * bounds.x;
      velocityY += (Math.random() - 0.5) * 0.3 * settings.bounceEnergy;
      // Add spin based on velocity
      angularVelocity.current += Math.sign(velocityX) * Math.abs(velocityX) * 0.5;
    }

    if (posY < -bounds.y) {
      velocityY = Math.abs(velocityY) * settings.bounceEnergy;
      posY = -bounds.y;
      velocityX += (Math.random() - 0.5) * 0.3 * settings.bounceEnergy;
      angularVelocity.current += velocityX * 0.3;
    }

    if (posY > bounds.y) {
      velocityY = -Math.abs(velocityY) * settings.bounceEnergy;
      posY = bounds.y;
      velocityX += (Math.random() - 0.5) * 0.3 * settings.bounceEnergy;
      angularVelocity.current += velocityX * 0.3;
    }

    // Check collisions with other bubbles
    bubbles.forEach(otherBubble => {
      if (otherBubble.id === id || !otherBubble.ref?.current) return;

      const otherPos = new THREE.Vector3();
      otherBubble.ref.current.getWorldPosition(otherPos);
      const myPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(myPos);

      const distance = myPos.distanceTo(otherPos);
      const combinedSize = (size + otherBubble.size) * 1.2;

      if (distance < combinedSize) {
        const normal = myPos.clone().sub(otherPos).normalize();
        const relativeVelocity = velocity.current.clone().sub(otherBubble.velocity || new THREE.Vector3());
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        const impactSpeed = Math.abs(velocityAlongNormal);
        
        // Increased explosion threshold and made it depend more on relative speed
        const explosionThreshold = 5.0 / settings.explosionPower;
        if (impactSpeed > explosionThreshold && Math.random() < 0.7) {
          onPop(id);
          onPop(otherBubble.id);
          return;
        }

        if (velocityAlongNormal < 0) {
          const restitution = 1.2 * settings.bounceEnergy;
          const impulseStrength = -(1 + restitution) * velocityAlongNormal;
          const impulse = normal.multiplyScalar(impulseStrength);

          // Add more spin based on collision angle and speed
          const tangent = new THREE.Vector3(-normal.y, normal.x, 0);
          const relativeSpeed = relativeVelocity.length();
          const spinFactor = Math.abs(tangent.dot(relativeVelocity)) * 2.0;
          
          // Apply spin based on collision properties
          angularVelocity.current += spinFactor * relativeSpeed * 0.3;
          
          // Update velocities
          velocity.current.add(impulse.clone().multiplyScalar(1.2 * settings.bounceEnergy));
          if (otherBubble.velocity) {
            otherBubble.velocity.sub(impulse.clone().multiplyScalar(1.2 * settings.bounceEnergy));
          }

          // Transfer some spin to the other bubble
          if (otherBubble.angularVelocity !== undefined) {
            otherBubble.angularVelocity -= spinFactor * relativeSpeed * 0.3;
          }

          const overlap = combinedSize - distance;
          const separationVector = normal.multiplyScalar(overlap * 0.6);
          myPos.add(separationVector);
        }
      }
    });

    // Limit maximum rotation speed
    const maxRotationSpeed = 8.0;
    angularVelocity.current = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, angularVelocity.current));

    // Update position
    meshRef.current.position.set(posX, posY, posZ);
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
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
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
            transition: 'transform 0.2s ease-out',
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
const ParticleSystem = ({ position, count = 30, color, emoji, size = 0.1, spread = 1, lifetime = 1000, bubbles, onBubblePop, isGrenade, startTime = Date.now(), settings }) => {
  const particles = useRef();
  const startTimeRef = useRef(startTime);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Initialize particles with more explosive spread
    for (let i = 0; i < count; i++) {
      // Set initial positions at the bubble's location
      pos[i * 3 + 0] = position.x !== undefined ? position.x : position[0] || 0;
      pos[i * 3 + 1] = position.y !== undefined ? position.y : position[1] || 0;
      pos[i * 3 + 2] = position.z !== undefined ? position.z : position[2] || 0;

      // Create more varied explosion angles
      const angle = (i / count) * Math.PI * 2;
      const randomSpread = Math.random() * Math.PI * 2;
      const upwardBias = Math.random() * 0.5;
      
      // Calculate velocities with more variation and higher initial speed
      const speed = (Math.random() * 0.5 + 0.5) * spread * 2;
      velocities[i * 3 + 0] = Math.cos(angle + randomSpread) * speed;
      velocities[i * 3 + 1] = Math.sin(angle + randomSpread) * speed + upwardBias * speed;
      velocities[i * 3 + 2] = 0;
      
      // Vary particle sizes for more natural look
      // eslint-disable-next-line no-unused-vars
      sizes[i] = (Math.random() * 0.5 + 0.5) * size * 4.0; // 400% bigger particles with variation
    }
    return { positions: pos, velocities, sizes };
  }, [count, spread, position, size]);

  useFrame((state, delta) => {
    if (!particles.current) return;
    
    const { positions: pos, velocities, sizes } = positions;
    const age = (Date.now() - startTimeRef.current) / lifetime;
    
    if (age >= 1) return;
    
    bubbles.forEach(bubble => {
      if (!bubble.ref?.current) return;
      
      const bubblePos = new THREE.Vector3();
      bubble.ref.current.getWorldPosition(bubblePos);
      const bubbleRadius = bubble.size;

      for (let i = 0; i < count; i++) {
        const particlePos = new THREE.Vector3(
          pos[i * 3 + 0],
          pos[i * 3 + 1],
          pos[i * 3 + 2]
        );

        const distance = particlePos.distanceTo(bubblePos);
        
        if (distance < bubbleRadius + 0.1) {
          if (isGrenade) {
            onBubblePop(bubble.id);
            break;
          } else {
            if (bubble.velocity) {
              const direction = new THREE.Vector3()
                .subVectors(bubblePos, particlePos)
                .normalize();
              
              const particleSpeed = Math.sqrt(
                velocities[i * 3 + 0] * velocities[i * 3 + 0] + 
                velocities[i * 3 + 1] * velocities[i * 3 + 1]
              );
              
              const impactForce = particleSpeed * (sizes[i] / 10) * settings.particleForce;
              
              bubble.velocity.add(
                direction.multiplyScalar(-impactForce)
              );
              
              if (bubble.angularVelocity !== undefined) {
                const tangent = new THREE.Vector3(-direction.y, direction.x, 0);
                bubble.angularVelocity += tangent.x * impactForce * 2;
              }
              
              const bounceDirection = new THREE.Vector3()
                .subVectors(particlePos, bubblePos)
                .normalize();
              
              velocities[i * 3 + 0] = bounceDirection.x * particleSpeed * settings.bounceEnergy;
              velocities[i * 3 + 1] = bounceDirection.y * particleSpeed * settings.bounceEnergy;
            }
          }
        }
      }
    });

    for (let i = 0; i < count; i++) {
      // Update positions with higher speed
      pos[i * 3 + 0] += velocities[i * 3 + 0] * delta * 2;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * delta * 2;
      pos[i * 3 + 2] = position.z !== undefined ? position.z : position[2] || 0;
      
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
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={positions.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size * 4.0} // Make particles 400% bigger (4x original size)
        sizeAttenuation={true}
        color={color}
        transparent
        opacity={1}
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
        vertexColors={false}
      />
    </points>
  );
};

// Add RippleBackground component
const RippleBackground = () => {
  const planeRef = useRef();
  const materialRef = useRef();
  const timeRef = useRef(0);
  
  useEffect(() => {
    if (!materialRef.current) return;
    
    // Create ripple shader with color waves
    materialRef.current.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.vertexShader = `
        varying vec2 vUv;
        uniform float time;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vUv = uv;
        float wave1 = sin(uv.x * 2.0 + time * 0.1) * 0.015;
        float wave2 = sin(uv.y * 1.5 + time * 0.08) * 0.015;
        float wave3 = sin((uv.x + uv.y) * 1.8 + time * 0.12) * 0.01;
        transformed.z += wave1 + wave2 + wave3;
        `
      );
      
      shader.fragmentShader = `
        varying vec2 vUv;
        uniform float time;

        vec3 hslToRgb(float h, float s, float l) {
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          float hp = h * 6.0;
          float x = c * (1.0 - abs(mod(hp, 2.0) - 1.0));
          float m = l - c/2.0;
          vec3 rgb;
          
          if (hp < 1.0) rgb = vec3(c, x, 0.0);
          else if (hp < 2.0) rgb = vec3(x, c, 0.0);
          else if (hp < 3.0) rgb = vec3(0.0, c, x);
          else if (hp < 4.0) rgb = vec3(0.0, x, c);
          else if (hp < 5.0) rgb = vec3(x, 0.0, c);
          else rgb = vec3(c, 0.0, x);
          
          return rgb + m;
        }

        ${shader.fragmentShader}
      `.replace(
        '#include <color_fragment>',
        `
        // Create base colors for the background
        vec3 color1 = vec3(0.53, 0.81, 0.92);  // Light sky blue (#87CEEB)
        vec3 color2 = vec3(0.68, 0.88, 0.94);  // Lighter blue (#AFE0F0)
        
        // Create waves for color mixing
        float wave1 = sin(vUv.x * 2.0 + time * 0.1) * 0.5;
        float wave2 = sin(vUv.y * 1.5 + time * 0.08) * 0.5;
        float wave3 = sin((vUv.x + vUv.y) * 1.8 + time * 0.12) * 0.3;
        
        // Combine waves and normalize to [0,1]
        float combinedWave = (wave1 + wave2 + wave3) * 0.3 + 0.5;
        
        // Mix the colors based on the wave
        diffuseColor.rgb = mix(color1, color2, combinedWave);
        
        // Ensure minimum brightness
        float minBrightness = 0.5;
        diffuseColor.rgb = max(diffuseColor.rgb, vec3(minBrightness));
        `
      );
      
      materialRef.current.userData.shader = shader;
    };
  }, []);
  
  useFrame((state, delta) => {
    timeRef.current += delta * 0.2;  // Very slow color shifting
    if (materialRef.current?.userData.shader) {
      materialRef.current.userData.shader.uniforms.time.value = timeRef.current;
    }
  });
  
  return (
    <mesh ref={planeRef} position={[0, 0, -1]} scale={[40, 40, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <meshPhongMaterial
        ref={materialRef}
        color="#87CEEB"
        shininess={50}
        transparent={false}
        opacity={1}
      />
    </mesh>
  );
};

// Update the LaserGun component
const LaserGun = ({ position, rotation, onFire }) => {
  const gunRef = useRef();
  
  // Make the gun ref available to parent components
  useEffect(() => {
    if (gunRef.current && onFire) {
      onFire.setGunRef(gunRef);
    }
  }, [onFire]);
  
  return (
    <group ref={gunRef} position={position} rotation={[0, 0, rotation]}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.4, 0.8, 16]} />
        <meshPhongMaterial color="#4444ff" shininess={100} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
        <meshPhongMaterial color="#22ccff" shininess={150} />
      </mesh>
    </group>
  );
};

// Update the LaserBeam component to properly align with its direction
const LaserBeam = ({ position, direction, onHit }) => {
  const beamRef = useRef();
  const speed = 30;
  
  // Set up the beam on first render
  useEffect(() => {
    if (beamRef.current) {
      // Calculate the rotation to align with the direction
      const angle = Math.atan2(direction.y, direction.x) - Math.PI/2;
      beamRef.current.rotation.z = angle;
    }
  }, [direction]);
  
  useFrame((state, delta) => {
    if (!beamRef.current) return;
    
    // Move the laser beam
    const movement = direction.clone().multiplyScalar(speed * delta);
    beamRef.current.position.add(movement);
    
    // Check if laser is out of bounds
    const camera = state.camera;
    const aspect = camera.aspect || window.innerWidth / window.innerHeight;
    const vFov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(vFov / 2) * camera.position.z;
    const width = height * aspect;
    
    const pos = beamRef.current.position;
    if (Math.abs(pos.x) > width/2 || Math.abs(pos.y) > height/2) {
      onHit('outOfBounds');
    }
  });

  return (
    <group ref={beamRef} position={position}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
        <meshPhongMaterial color="#22ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#00ffff" intensity={2} distance={3} />
    </group>
  );
};

// Main game scene with simplified bubble generation
const GameScene = ({ 
  gameActive, 
  score, 
  timeLeft, 
  onScore, 
  onGameOver, 
  soundEffects, 
  settings,
  onControlsReady
}) => {
  const [bubbles, setBubbles] = useState([]);
  const [effects, setEffects] = useState([]);
  const { raycaster, camera, gl } = useThree();
  const sceneRef = useRef();
  const [laserRotation, setLaserRotation] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  const lastFireTime = useRef(Date.now());
  const fireRate = 150; // Fire every 150ms
  const [lasers, setLasers] = useState([]);
  const gunRef = useRef(null);

  // Default game settings
  const gameSettings = useMemo(() => ({
    spawnRate: 800,       // ms between spawns
    maxBubbles: 15,       // maximum bubbles on screen
    grenadeChance: 0.3,   // chance for grenades
    bubbleSpeed: 0.4      // bubble movement speed (reduced by 60% from 1.0)
  }), []);

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

  // Emoji color mapping - Used to match particle colors with their emoji
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

  // Reset bubbles when game state changes
  useEffect(() => {
    if (!gameActive) {
      setBubbles([]);
      setEffects([]);
    }
  }, [gameActive]);

  // Generate bubbles with better initial positions
  useEffect(() => {
    if (!gameActive) {
      setBubbles([]);
      return;
    }

    const interval = setInterval(() => {
      if (bubbles.length < gameSettings.maxBubbles) {
        const isGrenade = Math.random() < gameSettings.grenadeChance;
        
        // Calculate screen bounds based on camera
        const vFov = camera.fov * (Math.PI / 180); // vertical fov in radians
        const height = 2 * Math.tan(vFov / 2) * camera.position.z; // visible height
        const width = height * camera.aspect; // visible width
        
        const spawnBounds = {
          x: width / 2,
          y: height / 2
        };
        
        // Choose spawn type with higher probability for central spawns
        const spawnType = Math.random();
        let spawnPosition;
        
        if (spawnType < 0.1) { // Top (reduced probability from 0.2 to 0.1)
          spawnPosition = [
            (Math.random() - 0.5) * width * 0.8,  // More central x position (80% of width)
            spawnBounds.y + 0.5,                  // Just above top edge
            0
          ];
        } else if (spawnType < 0.2) { // Bottom (reduced probability from 0.4 to 0.1)
          spawnPosition = [
            (Math.random() - 0.5) * width * 0.8,  // More central x position (80% of width)
            -spawnBounds.y - 0.5,                 // Just below bottom edge
            0
          ];
        } else if (spawnType < 0.3) { // Left (reduced probability from 0.6 to 0.1)
          spawnPosition = [
            -spawnBounds.x - 0.5,                 // Just left of left edge
            (Math.random() - 0.5) * height * 0.8, // More central y position (80% of height)
            0
          ];
        } else if (spawnType < 0.4) { // Right (reduced probability from 0.8 to 0.1)
          spawnPosition = [
            spawnBounds.x + 0.5,                  // Just right of right edge
            (Math.random() - 0.5) * height * 0.8, // More central y position (80% of height)
            0
          ];
        } else { // Center area (increased probability from 0.2 to 0.6)
          // Use a normal-like distribution to favor the center more
          // Math.random() + Math.random() - 1 creates a triangular distribution centered at 0
          const centralBiasX = (Math.random() + Math.random() - 1) * 0.8;
          const centralBiasY = (Math.random() + Math.random() - 1) * 0.8;
          
          spawnPosition = [
            centralBiasX * (width * 0.4),  // Central area (40% of width)
            centralBiasY * (height * 0.4), // Central area (40% of height)
            0
          ];
        }

        // Adjust initial velocity based on spawn position - direct toward center
        // Reduced by 60% (from 1.5 to 0.6)
        // Use smaller initial velocity for central spawns to keep them more central
        const distanceFromCenter = Math.sqrt(spawnPosition[0]**2 + spawnPosition[1]**2);
        const maxDistance = Math.sqrt((spawnBounds.x)**2 + (spawnBounds.y)**2);
        const velocityScale = 0.6 * (distanceFromCenter / maxDistance); // Scale velocity by distance from center
        
        const velocityX = spawnPosition[0] > 0 ? -velocityScale : (spawnPosition[0] < 0 ? velocityScale : (Math.random() - 0.5) * 0.3);
        const velocityY = spawnPosition[1] > 0 ? -velocityScale : (spawnPosition[1] < 0 ? velocityScale : (Math.random() - 0.5) * 0.3);

        const newBubble = {
          id: Math.random().toString(36).substr(2, 9),
          position: spawnPosition,
          size: (isGrenade ? 0.5 : Math.random() * 0.4 + 0.3) * settings.spawnSize,
          emoji: isGrenade 
            ? emojis.grenades[Math.floor(Math.random() * emojis.grenades.length)]
            : emojis.regular[Math.floor(Math.random() * emojis.regular.length)],
          color: isGrenade ? '#ff0000' : `hsl(${Math.random() * 360}, 80%, 75%)`,
          isGrenade: isGrenade,
          ref: null,
          groupRef: null,
          velocity: new THREE.Vector3(velocityX, velocityY, 0),
          angularVelocity: (Math.random() - 0.5) * 0.8 * settings.bubbleSpeed,
          rotationQuaternion: new THREE.Quaternion()
        };
        
        // Add the bubble without playing any spawn sound
        setBubbles(prev => [...prev, newBubble]);
      }
    }, gameSettings.spawnRate);

    return () => clearInterval(interval);
  }, [gameActive, bubbles.length, emojis, camera, settings]);

  // Check for bubbles reaching the top
  useEffect(() => {
    if (!gameActive) return;
    
    const checkInterval = setInterval(() => {
      // Calculate screen bounds based on camera
      const vFov = camera.fov * (Math.PI / 180); // vertical fov in radians
      const height = 2 * Math.tan(vFov / 2) * camera.position.z; // visible height
      const topBound = height / 2;
      
      // Check if any bubble has reached the top
      bubbles.forEach(bubble => {
        if (bubble.ref?.current && bubble.groupRef?.current) {
          const position = new THREE.Vector3();
          bubble.groupRef.current.getWorldPosition(position);
          const meshPosition = bubble.ref.current.position;
          const absoluteY = position.y + meshPosition.y;
          
          // Only trigger game over if the bubble is fully above the top boundary
          // Add a small buffer to make the collision less aggressive
          if (absoluteY > topBound + (bubble.size * 0.5)) {
            console.log('Game over triggered by bubble at position:', absoluteY, 'top bound:', topBound);
            onGameOver();
          }
        }
      });
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [gameActive, bubbles, camera, onGameOver]);

  // Handle popping a bubble
  const handlePop = useCallback((bubbleId) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble || !bubble.ref?.current) return;
    
    // Play pop sound
    if (soundEffects.soundsEnabled) {
      soundEffects.play(bubble.isGrenade ? 'explosion' : 'pop', false);
    }
    
    // Create explosion effect
    const position = new THREE.Vector3();
    bubble.ref.current.getWorldPosition(position);
    
    // Add score
    onScore(bubble.isGrenade ? 5 : 1);
    
    // Get the emoji's color from the emojiColors map or use the bubble's color as fallback
    const emojiColor = emojiColors[bubble.emoji] || bubble.color;
    
    // Create explosion effect
    setEffects(prev => [
      ...prev,
      {
        id: `effect-${Date.now()}-${Math.random()}`,
        position: position,
        time: 0,
        type: bubble.isGrenade ? 'explosion' : 'pop',
        color: emojiColor, // Use the emoji's color
        emoji: bubble.emoji,
        size: bubble.size * 1.5,
        startTime: Date.now(),
        lifetime: 1000,
        isGrenade: bubble.isGrenade
      }
    ]);
    
    // Remove the bubble
    setBubbles(prev => prev.filter(b => b.id !== bubbleId));
  }, [bubbles, onScore, soundEffects, emojiColors]);

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
      handleClick(event);
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameActive, bubbles, camera, gl, raycaster, handlePop]);
  
  // Update bubble positions
  useFrame((state, delta) => {
    if (!gameActive) return;
    
    setBubbles(prevBubbles => {
      return prevBubbles.map(bubble => {
        // Skip bubbles without refs
        if (!bubble.ref?.current) return bubble;
        
        // Initialize velocity if it doesn't exist
        if (!bubble.velocity) {
          bubble.velocity = new THREE.Vector3(
            bubble.initialVelocity ? bubble.initialVelocity[0] : (Math.random() - 0.5) * 4.5,
            bubble.initialVelocity ? bubble.initialVelocity[1] : (Math.random() - 0.5) * 4.5,
            0
          );
        }
        
        // Initialize angular velocity if it doesn't exist
        if (bubble.angularVelocity === undefined) {
          bubble.angularVelocity = (Math.random() - 0.5) * 2;
        }
        
        // Initialize rotation quaternion if it doesn't exist
        if (!bubble.rotationQuaternion) {
          bubble.rotationQuaternion = new THREE.Quaternion();
        }
        
        // Apply velocity with standard speed multiplier
        const speedMultiplier = settings.bubbleSpeed;
        let posX = bubble.position[0] + bubble.velocity.x * delta * speedMultiplier;
        let posY = bubble.position[1] + bubble.velocity.y * delta * speedMultiplier;
        const posZ = bubble.position[2];

        // Bounce off walls
        let velocityX = bubble.velocity.x;
        let velocityY = bubble.velocity.y;

        // Calculate a gentle rotation based on movement
        const movementRotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          bubble.angularVelocity * delta
        );

        // Apply the rotation with smooth interpolation
        const rotationQuaternion = new THREE.Quaternion();
        rotationQuaternion.copy(bubble.rotationQuaternion);
        rotationQuaternion.multiply(movementRotation);

        // Apply final rotation
        bubble.ref.current.quaternion.copy(rotationQuaternion);
        
        // Gradually reduce angular velocity (friction)
        bubble.angularVelocity *= 0.98; // Gentler friction for smoother deceleration

        // Limit maximum rotation speed
        const maxRotationSpeed = 0.5;
        bubble.angularVelocity = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, bubble.angularVelocity));

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
        if (Math.abs(posX) > bounds.x) {
          velocityX = -velocityX * settings.bounceEnergy;
          posX = Math.sign(posX) * bounds.x;
          velocityY += (Math.random() - 0.5) * 0.5 * settings.bounceEnergy;
          bubble.angularVelocity += Math.sign(velocityX) * 1.2 * settings.bounceEnergy;
        }

        if (posY < -bounds.y) {
          velocityY = Math.abs(velocityY) * settings.bounceEnergy;
          posY = -bounds.y;
          velocityX += (Math.random() - 0.5) * 0.5 * settings.bounceEnergy;
          bubble.angularVelocity += velocityX * 0.8 * settings.bounceEnergy;
        }

        if (posY > bounds.y) {
          velocityY = -Math.abs(velocityY) * settings.bounceEnergy;
          posY = bounds.y;
          velocityX += (Math.random() - 0.5) * 0.5 * settings.bounceEnergy;
          bubble.angularVelocity += velocityX * 0.8 * settings.bounceEnergy;
        }

        // Check collisions with other bubbles
        bubbles.forEach(otherBubble => {
          if (otherBubble.id === bubble.id || !otherBubble.ref?.current) return;

          const otherPos = new THREE.Vector3();
          otherBubble.ref.current.getWorldPosition(otherPos);
          const myPos = new THREE.Vector3();
          bubble.ref.current.getWorldPosition(myPos);

          const distance = myPos.distanceTo(otherPos);
          const combinedSize = (bubble.size + otherBubble.size) * 1.2;

          if (distance < combinedSize) {
            const normal = myPos.clone().sub(otherPos).normalize();
            const relativeVelocity = bubble.velocity.clone().sub(otherBubble.velocity || new THREE.Vector3());
            const velocityAlongNormal = relativeVelocity.dot(normal);
            
            const impactSpeed = Math.abs(velocityAlongNormal);
            
            const explosionThreshold = 3.0 / settings.explosionPower;
            if (impactSpeed > explosionThreshold) {
              handlePop(bubble.id);
              handlePop(otherBubble.id);
              return;
            }

            if (velocityAlongNormal < 0) {
              const restitution = 1.2 * settings.bounceEnergy;
              const impulseStrength = -(1 + restitution) * velocityAlongNormal;
              const impulse = normal.multiplyScalar(impulseStrength);

              bubble.velocity.add(impulse.clone().multiplyScalar(1.2 * settings.bounceEnergy));
              if (otherBubble.velocity) {
                otherBubble.velocity.sub(impulse.clone().multiplyScalar(1.2 * settings.bounceEnergy));
              }

              const tangent = new THREE.Vector3(-normal.y, normal.x, 0);
              const spinFactor = tangent.dot(relativeVelocity) * 2.0 * settings.bounceEnergy;
              bubble.angularVelocity += spinFactor * impactSpeed;
              
              if (otherBubble.angularVelocity !== undefined) {
                otherBubble.angularVelocity -= spinFactor * impactSpeed;
              }

              const overlap = combinedSize - distance;
              const separationVector = normal.multiplyScalar(overlap * 0.6);
              myPos.add(separationVector);
            }
          }
        });

        // Store current velocity and angular velocity for collision calculations
        bubble.ref.current.userData.velocity = bubble.velocity.clone();
        bubble.ref.current.userData.angularVelocity = bubble.angularVelocity;

        // Update position
        bubble.ref.current.position.set(posX, posY, posZ);
        
        // Update bubble position in state
        return {
          ...bubble,
          position: [posX, posY, posZ],
          velocity: new THREE.Vector3(velocityX, velocityY, 0),
          rotationQuaternion: rotationQuaternion
        };
      });
    });
  });

  // Update laser rotation
  useFrame((state, delta) => {
    if (!gameActive) return;
    
    const rotationSpeed = 3; // Radians per second
    if (isMovingLeft) {
      setLaserRotation(prev => prev - rotationSpeed * delta); // Reversed direction
    }
    if (isMovingRight) {
      setLaserRotation(prev => prev + rotationSpeed * delta); // Reversed direction
    }

    // Continuous firing
    if (isFiring && Date.now() - lastFireTime.current > fireRate) {
      fireLaser();
      lastFireTime.current = Date.now();
    }
  });

  // Pass the control functions to the parent
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        setIsMovingLeft,
        setIsMovingRight,
        startFiring: () => setIsFiring(true),
        stopFiring: () => setIsFiring(false)
      });
    }
  }, [onControlsReady]);

  // Update laser firing
  const fireLaser = useCallback(() => {
    if (!gameActive) return;
    
    // Calculate the direction based on the laser rotation
    const direction = new THREE.Vector3(
      Math.sin(laserRotation),
      Math.cos(laserRotation),
      0
    );
    
    // Calculate the starting position at the tip of the gun barrel
    const barrelLength = 0.8; // Length of the barrel (0.4) + a bit more to start at the tip
    const startPosition = new THREE.Vector3(
      Math.sin(laserRotation) * barrelLength,
      Math.cos(laserRotation) * barrelLength,
      0
    );
    
    // Create new laser beam
    const newLaser = {
      id: `laser-${Date.now()}-${Math.random()}`,
      position: startPosition,
      direction: direction,
      startTime: Date.now()
    };
    
    setLasers(prev => [...prev, newLaser]);

    // Play laser sound
    if (soundEffects.soundsEnabled) {
      soundEffects.play('pop', true);
    }
  }, [gameActive, laserRotation, soundEffects]);

  // Handle laser hits
  const handleLaserHit = useCallback((laserId, type) => {
    setLasers(prev => prev.filter(laser => laser.id !== laserId));
  }, []);

  // Check laser collisions with bubbles
  useFrame(() => {
    if (!gameActive) return;
    
    lasers.forEach(laser => {
      bubbles.forEach(bubble => {
        if (!bubble.ref?.current) return;
        
        const bubblePos = new THREE.Vector3();
        bubble.ref.current.getWorldPosition(bubblePos);
        const laserPos = laser.position.clone();
        
        const distance = laserPos.distanceTo(bubblePos);
        if (distance < bubble.size + 0.2) {
          handlePop(bubble.id);
          handleLaserHit(laser.id, 'hit');
          
          // Create laser impact effect
          setEffects(prev => [...prev, {
            id: `impact-${Date.now()}-${Math.random()}`,
            position: bubblePos,
            time: 0,
            type: 'impact',
            color: '#22ffff',
            size: 0.3,
            startTime: Date.now(),
            lifetime: 300,
            isLaser: true
          }]);
        }
      });
    });
  });

  // Cleanup old lasers
  useEffect(() => {
    const cleanup = setInterval(() => {
      setLasers(prev => prev.filter(laser => 
        Date.now() - laser.startTime < 2000
      ));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <group ref={sceneRef}>
      <RippleBackground />
      
      {/* Enhanced Lighting - adjusted for ripple effect */}
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={1.0} />
      <directionalLight position={[-10, 10, -5]} intensity={1.5} />
      <directionalLight position={[0, -10, 0]} intensity={0.6} color="#ffffff" />

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

      {/* Laser beams */}
      {lasers.map(laser => (
        <LaserBeam
          key={laser.id}
          position={laser.position}
          direction={laser.direction}
          onHit={(type) => handleLaserHit(laser.id, type)}
        />
      ))}

      {/* Bubbles */}
      {bubbles.map(bubble => (
        <Bubble key={bubble.id} {...bubble} bubbles={bubbles} onPop={handlePop} settings={settings} />
      ))}

      {/* Effects */}
      {effects.map(effect => (
        <ParticleSystem 
          key={effect.id} 
          position={effect.position} 
          count={effect.isLaser ? 15 : (effect.isGrenade ? 50 : 30)}
          color={effect.color}
          emoji={effect.emoji}
          size={effect.size / 5}
          spread={effect.isGrenade ? 2 : (effect.isLaser ? 0.5 : 1)}
          lifetime={effect.lifetime || 1000}
          bubbles={bubbles}
          onBubblePop={handlePop}
          isGrenade={effect.isGrenade}
          startTime={effect.startTime || Date.now()}
          settings={settings}
        />
      ))}

      <LaserGun 
        position={[0, 0, 0]} 
        rotation={laserRotation} 
        onFire={{ setGunRef: (ref) => { gunRef.current = ref; } }} 
      />
    </group>
  );
};

// Add this near the top of the file, after the imports
const DevControlPanel = ({ settings, onSettingChange }) => {
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg text-white text-xs z-50" style={{ width: '200px' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold">Dev Controls</span>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block mb-1">Spawn Speed: {settings.bubbleSpeed.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={settings.bubbleSpeed}
            onChange={(e) => onSettingChange('bubbleSpeed', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Grenade Chance: {(settings.grenadeChance * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.grenadeChance}
            onChange={(e) => onSettingChange('grenadeChance', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Spawn Size: {settings.spawnSize.toFixed(2)}</label>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={settings.spawnSize}
            onChange={(e) => onSettingChange('spawnSize', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Gravity: {settings.gravity.toFixed(2)}</label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={settings.gravity}
            onChange={(e) => onSettingChange('gravity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Bounce Energy: {settings.bounceEnergy.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={settings.bounceEnergy}
            onChange={(e) => onSettingChange('bounceEnergy', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Explosion Power: {settings.explosionPower.toFixed(2)}</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={settings.explosionPower}
            onChange={(e) => onSettingChange('explosionPower', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1">Particle Force: {settings.particleForce.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={settings.particleForce}
            onChange={(e) => onSettingChange('particleForce', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// Main game component
const EmojiGame = () => {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('emojiBubbleHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const soundEffects = useSoundEffects();
  
  // Add game settings state
  const [gameSettings, setGameSettings] = useState({
    bubbleSpeed: 0.4,
    grenadeChance: 0.3,
    spawnSize: 1.0,
    gravity: 0.0,
    bounceEnergy: 0.85,
    explosionPower: 3.0,
    particleForce: 0.3,
    spawnRate: 800,
    maxBubbles: 15
  });

  // Add handler for settings changes
  const handleSettingChange = (setting, value) => {
    setGameSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const startGame = useCallback(() => {
    soundEffects.stopAllSounds();
    
    // Play game start sound
    if (soundEffects.soundsEnabled) {
      soundEffects.play('gameStart', false);
    }
    
    // Start background music if enabled
    if (soundEffects.musicEnabled && soundEffects.soundsEnabled) {
      soundEffects.play('backgroundMusic', true);
    }
    
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60); // Reset time
  }, [soundEffects]);

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    
    // Stop background music
    soundEffects.stopAllSounds();
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('emojiBubbleHighScore', score.toString());
    }
  }, [score, highScore, soundEffects]);

  // Handle scoring
  const handleScore = useCallback((points) => {
    setScore(prev => prev + points);
  }, []);

  // Game timer
  useEffect(() => {
    if (!gameActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, endGame]);

  const [controls, setControls] = useState(null);

  // Add the controls handler
  const handleControlsReady = useCallback((gameControls) => {
    setControls(gameControls);
  }, []);

  return (
    <div className="emoji-game">
      <div className="w-full h-screen relative">
        <div className="absolute inset-0 z-0" style={{ backgroundColor: '#87CEEB' }}>
          <Canvas
            camera={{ 
              position: [0, 0, 12],
              fov: 35,
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
              onScore={handleScore}
              onGameOver={endGame}
              soundEffects={soundEffects}
              settings={gameSettings}
              onControlsReady={handleControlsReady}
            />
          </Canvas>
        </div>
        
        {/* Add Dev Control Panel */}
        {process.env.NODE_ENV === 'development' && (
          <DevControlPanel
            settings={gameSettings}
            onSettingChange={handleSettingChange}
          />
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
        
        {/* Start/End screen */}
        {!gameActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-50" style={{ pointerEvents: 'auto' }}>
            <div className="bg-white rounded-xl p-8 max-w-md text-center">
              <h1 className="text-3xl font-bold mb-4">
                {gameOver ? "Game Over!" : "3D Emoji Bubble Pop!"}
              </h1>
              
              {gameOver && (
                <p className="text-xl mb-6">Your score: {score}</p>
              )}
              
              <p className="mb-6">
                {gameOver 
                  ? "Great job! Want to play again?" 
                  : "Pop as many 3D emoji bubbles as you can in 60 seconds!"}
              </p>
              
              <button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
                onClick={startGame}
                style={{ cursor: 'pointer' }}
              >
                {gameOver ? "Play Again" : "Start Game"}
              </button>
              
              {/* Sound controls */}
              <div className="mt-4 flex justify-center space-x-4">
                <button 
                  className={`${soundEffects.musicEnabled ? 'bg-green-200 hover:bg-green-300' : 'bg-gray-200 hover:bg-gray-300'} text-gray-800 font-medium py-2 px-4 rounded-full text-sm transition-all`}
                  onClick={soundEffects.toggleBackgroundMusic}
                >
                  {soundEffects.musicEnabled ? '🎵 Music On' : '🔇 Music Off'}
                </button>
                
                <button 
                  className={`${soundEffects.soundsEnabled ? 'bg-green-200 hover:bg-green-300' : 'bg-gray-200 hover:bg-gray-300'} text-gray-800 font-medium py-2 px-4 rounded-full text-sm transition-all`}
                  onClick={soundEffects.toggleSounds}
                >
                  {soundEffects.soundsEnabled ? '🔊 Sounds On' : '🔈 Sounds Off'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Touch Controls */}
        {gameActive && controls && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-4 z-40">
            <button 
              className="w-24 h-24 bg-blue-500 bg-opacity-50 rounded-full text-white text-4xl flex items-center justify-center active:bg-blue-600 select-none"
              onTouchStart={() => controls.setIsMovingLeft(true)}
              onTouchEnd={() => controls.setIsMovingLeft(false)}
              onMouseDown={() => controls.setIsMovingLeft(true)}
              onMouseUp={() => controls.setIsMovingLeft(false)}
              onMouseLeave={() => controls.setIsMovingLeft(false)}
            >
              ↺
            </button>
            <button 
              className="w-32 h-32 bg-red-500 bg-opacity-50 rounded-full text-white text-4xl flex items-center justify-center active:bg-red-600 select-none"
              onTouchStart={controls.startFiring}
              onTouchEnd={controls.stopFiring}
              onMouseDown={controls.startFiring}
              onMouseUp={controls.stopFiring}
              onMouseLeave={controls.stopFiring}
            >
              🔫
            </button>
            <button 
              className="w-24 h-24 bg-blue-500 bg-opacity-50 rounded-full text-white text-4xl flex items-center justify-center active:bg-blue-600 select-none"
              onTouchStart={() => controls.setIsMovingRight(true)}
              onTouchEnd={() => controls.setIsMovingRight(false)}
              onMouseDown={() => controls.setIsMovingRight(true)}
              onMouseUp={() => controls.setIsMovingRight(false)}
              onMouseLeave={() => controls.setIsMovingRight(false)}
            >
              ↻
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiGame;