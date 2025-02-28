class SoundEffects {
  constructor() {
    this.sounds = {};
    this.audioContext = null;
    this.initialized = false;
    
    // Create audio context on first user interaction
    this.initOnInteraction();
  }
  
  initOnInteraction() {
    const initAudio = () => {
      if (!this.initialized) {
        // Initialize AudioContext
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create sounds
        this.createSounds();
        
        this.initialized = true;
      }
      
      // Remove event listeners once initialized
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }
  
  createSounds() {
    // Create laser sound (player shooting)
    this.createLaserSound();
    
    // Create explosion sound (alien destroyed)
    this.createExplosionSound();
    
    // Create game start sound
    this.createGameStartSound();
    
    // Create game over sound
    this.createGameOverSound();
  }
  
  createLaserSound() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    
    this.sounds.laser = {
      play: () => {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
      }
    };
  }
  
  createExplosionSound() {
    this.sounds.explosion = {
      play: () => {
        if (!this.audioContext) return;
        
        // Create noise buffer
        const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // Create filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);
        
        // Create gain
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        // Connect nodes
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Start and stop the sound
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.5);
      }
    };
  }
  
  createGameStartSound() {
    this.sounds.start = {
      play: () => {
        if (!this.audioContext) return;
        
        // Create oscillator
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        
        // Play ascending arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const duration = 0.1;
        
        notes.forEach((note, index) => {
          osc.frequency.setValueAtTime(note, this.audioContext.currentTime + index * duration);
        });
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + notes.length * duration - 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + notes.length * duration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + notes.length * duration);
      }
    };
  }
  
  createGameOverSound() {
    this.sounds.gameover = {
      play: () => {
        if (!this.audioContext) return;
        
        // Create oscillator
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        
        // Play descending notes
        const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4
        const duration = 0.2;
        
        notes.forEach((note, index) => {
          osc.frequency.setValueAtTime(note, this.audioContext.currentTime + index * duration);
        });
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + notes.length * duration - 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + notes.length * duration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + notes.length * duration);
      }
    };
  }
  
  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }
}

export default SoundEffects;
