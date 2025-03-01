import * as THREE from 'three';

class AlienShip {
  constructor(scene, wave = 1) {
    this.scene = scene;
    this.wave = wave;
    this.health = this.getBaseHealth() * (1 + 0.1 * wave);
    this.pointValue = this.getBasePoints() * wave;
    this.mesh = null;
    this.movementPattern = this.getRandomMovementPattern();
    this.elapsedTime = 0;
    this.speed = this.getBaseSpeed() * (1 + 0.05 * wave);
    this.type = this.getRandomType();
    
    // Create the alien ship
    this.createShip();
  }
  
  getBaseHealth() {
    return 10;
  }
  
  getBasePoints() {
    return 100;
  }
  
  getBaseSpeed() {
    return 10;
  }
  
  getRandomType() {
    const types = ['scout', 'fighter', 'cruiser'];
    const typeIndex = Math.floor(Math.random() * types.length);
    return types[typeIndex];
  }
  
  getRandomMovementPattern() {
    const patterns = ['straight', 'zigzag', 'circle'];
    const patternIndex = Math.floor(Math.random() * patterns.length);
    return patterns[patternIndex];
  }
  
  createShip() {
    let geometry;
    let material;
    
    // Different shapes based on ship type
    switch (this.type) {
      case 'scout':
        // Simple triangular ship
        geometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        break;
        
      case 'fighter':
        // X-wing type ship
        geometry = new THREE.BoxGeometry(1.5, 0.3, 1);
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        break;
        
      case 'cruiser':
        // Larger, more complex ship
        geometry = new THREE.CylinderGeometry(0.7, 1, 2, 8);
        material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        break;
        
      default:
        geometry = new THREE.SphereGeometry(0.7, 16, 16);
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    }
    
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Position the ship at a random location in the distance
    const spawnDistance = -100;
    const spawnRadius = 50;
    this.mesh.position.set(
      (Math.random() - 0.5) * spawnRadius,
      (Math.random() - 0.5) * spawnRadius,
      spawnDistance
    );
    
    // Rotation for visual interest
    this.mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    // Add to scene
    this.scene.add(this.mesh);
  }
  
  update(delta) {
    this.elapsedTime += delta;
    
    // Move the ship based on its movement pattern
    switch (this.movementPattern) {
      case 'straight':
        this.mesh.position.z += this.speed * delta;
        break;
        
      case 'zigzag':
        this.mesh.position.z += this.speed * delta;
        this.mesh.position.x += Math.sin(this.elapsedTime * 2) * delta * this.speed * 0.5;
        break;
        
      case 'circle':
        this.mesh.position.z += this.speed * delta;
        const circleRadius = 5;
        this.mesh.position.x = Math.cos(this.elapsedTime) * circleRadius;
        this.mesh.position.y = Math.sin(this.elapsedTime) * circleRadius;
        break;
        
      default:
        // Default to straight movement if pattern is unknown
        this.mesh.position.z += this.speed * delta;
        break;
    }
    
    // Rotate the ship for visual interest
    this.mesh.rotation.x += delta * 0.5;
    this.mesh.rotation.y += delta * 0.3;
    
    // Return true if the ship is past the camera and should be removed
    return this.mesh.position.z > 10;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
  
  destroy() {
    this.scene.remove(this.mesh);
  }
  
  get position() {
    return this.mesh.position;
  }
}

export default AlienShip;