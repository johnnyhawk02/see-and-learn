class GameState {
  constructor() {
    this.score = 0;
    this.health = 100;
    this.wave = 1;
    this.status = 'start'; // 'start', 'playing', 'paused', 'gameover'
    this.aliensDestroyed = 0;
    this.aliensRequiredForNextWave = 10;
    
    // Callback functions
    this.onScoreChange = null;
    this.onHealthChange = null;
    this.onWaveChange = null;
    this.onGameStatusChange = null;
  }
  
  startGame() {
    this.score = 0;
    this.health = 100;
    this.wave = 1;
    this.aliensDestroyed = 0;
    this.setGameStatus('playing');
    
    // Call callbacks to update UI
    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onHealthChange) this.onHealthChange(this.health);
    if (this.onWaveChange) this.onWaveChange(this.wave);
  }
  
  pauseGame() {
    this.setGameStatus('paused');
  }
  
  resumeGame() {
    this.setGameStatus('playing');
  }
  
  endGame() {
    this.setGameStatus('gameover');
  }
  
  incrementScore(points) {
    this.score += points;
    this.aliensDestroyed++;
    
    // Check if we should advance to the next wave
    if (this.aliensDestroyed >= this.aliensRequiredForNextWave) {
      this.advanceWave();
    }
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score);
    }
  }
  
  decrementHealth(damage) {
    this.health -= damage;
    
    // Check for game over
    if (this.health <= 0) {
      this.health = 0;
      this.endGame();
    }
    
    if (this.onHealthChange) {
      this.onHealthChange(this.health);
    }
  }
  
  advanceWave() {
    this.wave++;
    this.aliensDestroyed = 0;
    this.aliensRequiredForNextWave += 5; // Increase aliens needed for next wave
    
    if (this.onWaveChange) {
      this.onWaveChange(this.wave);
    }
  }
  
  setGameStatus(status) {
    this.status = status;
    
    if (this.onGameStatusChange) {
      this.onGameStatusChange(status);
    }
  }
  
  getScore() {
    return this.score;
  }
  
  getHealth() {
    return this.health;
  }
  
  getWave() {
    return this.wave;
  }
  
  getStatus() {
    return this.status;
  }
}

export default GameState;
