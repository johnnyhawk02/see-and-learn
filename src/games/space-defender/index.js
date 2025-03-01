import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import StarField from './space-defender-components/StarField';
import AlienShip from './space-defender-components/AlienShip';
import Weapon from './space-defender-components/Weapon';
import Controls from './space-defender-components/Controls';
import Collision from './space-defender-components/Collision';
import GameState from './space-defender-components/GameState';
import SoundEffects from './space-defender-components/SoundEffects';
import ParticleSystem from './space-defender-components/ParticleSystem';
import LunarEnvironment from './space-defender-components/LunarEnvironment';

const SpaceDefender = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const gameStateRef = useRef(null);
  const controlsRef = useRef(null);
  const starFieldRef = useRef(null);
  const lunarRef = useRef(null);
  const weaponRef = useRef(null);
  const aliensRef = useRef([]);
  const collisionRef = useRef(null);
  const soundRef = useRef(null);
  const particleSystemRef = useRef(null);
  const crosshairRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const normalizedMouseXRef = useRef(0); // Normalized mouse X position from -1 to 1
  const shipHeightRef = useRef(0); // Ship height position
  
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [gameStatus, setGameStatus] = useState('start'); // 'start', 'playing', 'paused', 'gameover'
  
  // Initialize the game
  useEffect(() => {
    // Setup Three.js scene, camera, and renderer
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Game state
    gameStateRef.current = new GameState();
    gameStateRef.current.onScoreChange = (newScore) => setScore(newScore);
    gameStateRef.current.onHealthChange = (newHealth) => setHealth(newHealth);
    gameStateRef.current.onWaveChange = (newWave) => setWave(newWave);
    gameStateRef.current.onGameStatusChange = (newStatus) => setGameStatus(newStatus);
    
    // Controls
    controlsRef.current = new Controls(container, crosshairRef);
    
    // Add callback for mouse movement to update normalized mouse position and height
    controlsRef.current.setMouseMoveCallback((mousePos) => {
      // Convert mouse position to normalized -1 to 1 range
      normalizedMouseXRef.current = (mousePos.x / (container.clientWidth / 2));
      // Store height value (already normalized in the Controls class)
      shipHeightRef.current = mousePos.height;
    });
    
    // Star field (fewer stars since we have the lunar environment with stars)
    starFieldRef.current = new StarField(scene, { numStars: 200 });
    
    // Lunar environment
    lunarRef.current = new LunarEnvironment(scene, camera);
    
    // Weapon
    weaponRef.current = new Weapon(scene, camera);
    
    // Collision detection
    collisionRef.current = new Collision();
    
    // Sound effects
    soundRef.current = new SoundEffects();
    
    // Particle system
    particleSystemRef.current = new ParticleSystem(scene);
    
    // Handle window resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      container.removeChild(renderer.domElement);
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Update game objects
      const delta = 0.016; // Approximately 60fps
      
      // Update star field
      starFieldRef.current.update(delta);
      
      // Update controls for vertical movement
      controlsRef.current.update(delta);
      
      // Update lunar environment (pass normalized mouse X position and height)
      lunarRef.current.update(delta, normalizedMouseXRef.current, shipHeightRef.current);
      
      // Update aliens
      aliensRef.current.forEach(alien => alien.update(delta));
      
      // Update weapon
      weaponRef.current.update(delta, crosshairRef.current);
      
      // Handle collisions
      collisionRef.current.checkCollisions(
        weaponRef.current.getProjectiles(),
        aliensRef.current,
        (alien) => {
          // Handle alien hit
          soundRef.current.playSound('explosion');
          particleSystemRef.current.createExplosion(alien.position);
          gameStateRef.current.incrementScore(alien.pointValue);
          
          // Remove destroyed aliens
          aliensRef.current = aliensRef.current.filter(a => a !== alien);
        }
      );
      
      // Spawn new aliens if needed
      if (aliensRef.current.length < wave * 2) {
        const newAlien = new AlienShip(sceneRef.current, wave);
        aliensRef.current.push(newAlien);
      }
      
      // Update particle systems
      particleSystemRef.current.update(delta);
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStatus, wave]);
  
  // Handle space bar for shooting
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameStatus === 'playing') {
        weaponRef.current.shoot();
        soundRef.current.playSound('laser');
      } else if (e.code === 'Escape') {
        if (gameStatus === 'playing') {
          gameStateRef.current.pauseGame();
        } else if (gameStatus === 'paused') {
          gameStateRef.current.resumeGame();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus]);
  
  const startGame = () => {
    // Reset game state
    gameStateRef.current.startGame();
    
    // Clear any existing aliens
    aliensRef.current.forEach(alien => {
      sceneRef.current.remove(alien.mesh);
    });
    aliensRef.current = [];
    
    // Reset weapon
    weaponRef.current.reset();
    
    // Play start sound
    soundRef.current.playSound('start');
  };
  
  const resumeGame = () => {
    gameStateRef.current.resumeGame();
  };
  
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Game container */}
      <div ref={containerRef} className="absolute inset-0">
        {/* Canvas will be appended here */}
      </div>
      
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <circle cx="20" cy="20" r="2" fill="#ffffff" />
          <line x1="8" y1="20" x2="16" y2="20" stroke="#ffffff" strokeWidth="1" />
          <line x1="24" y1="20" x2="32" y2="20" stroke="#ffffff" strokeWidth="1" />
          <line x1="20" y1="8" x2="20" y2="16" stroke="#ffffff" strokeWidth="1" />
          <line x1="20" y1="24" x2="20" y2="32" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>
      
      {/* HUD - moved to the right to avoid back button */}
      <div className="absolute top-4 right-4 text-white text-right">
        <div>Score: {score}</div>
        <div>Health: {health}</div>
        <div>Wave: {wave}</div>
      </div>
      
      {/* Game Start Screen - added pointer-events-auto to ensure buttons work */}
      {gameStatus === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white pointer-events-auto" style={{ zIndex: 9000 }}>
          <h1 className="text-4xl mb-6">Lunar Defender</h1>
          <p className="mb-4">Defend against alien invaders on the lunar surface!</p>
          <p className="mb-8">
            Use your mouse to aim<br />
            W/↑ to fly up, S/↓ to fly down<br />
            Press SPACE to shoot<br />
            Press ESC to pause
          </p>
          <button 
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      )}
      
      {/* Pause Screen - added pointer-events-auto to ensure buttons work */}
      {gameStatus === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white pointer-events-auto" style={{ zIndex: 9000 }}>
          <h2 className="text-3xl mb-6">Game Paused</h2>
          <button 
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={resumeGame}
          >
            Resume Game
          </button>
        </div>
      )}
      
      {/* Game Over Screen - added pointer-events-auto to ensure buttons work */}
      {gameStatus === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white pointer-events-auto" style={{ zIndex: 9000 }}>
          <h2 className="text-3xl mb-2">Game Over</h2>
          <p className="text-xl mb-6">Final Score: {score}</p>
          <button 
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={startGame}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceDefender;
