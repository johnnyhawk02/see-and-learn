import * as THREE from 'three';

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    
    // Create reusable particle materials
    this.createParticleMaterials();
  }
  
  createParticleMaterials() {
    // Explosion particles
    this.explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.8,
    });
    
    // Weapon particles
    this.weaponMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
    });
  }
  
  createExplosion(position, count = 20) {
    // Create multiple particles at the explosion position
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.3 + 0.1;
      const geometry = new THREE.SphereGeometry(size, 4, 4);
      
      // Clone material and set random color from red to yellow
      const material = this.explosionMaterial.clone();
      const hue = Math.random() * 0.1 + 0.05; // 0.05 to 0.15 (red to orange)
      material.color = new THREE.Color().setHSL(hue, 1, 0.5);
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Set position at the explosion center
      particle.position.copy(position);
      
      // Set random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      // Set userData for the particle
      particle.userData = {
        velocity,
        lifetime: 1.0, // Seconds
        age: 0,
      };
      
      // Add to scene and particles array
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }
  
  createWeaponParticles(position, direction, count = 5) {
    // Create small particles at the weapon position
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.1 + 0.05;
      const geometry = new THREE.SphereGeometry(size, 4, 4);
      const particle = new THREE.Mesh(geometry, this.weaponMaterial);
      
      // Set position at the weapon position with slight randomness
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.2;
      particle.position.y += (Math.random() - 0.5) * 0.2;
      particle.position.z += (Math.random() - 0.5) * 0.2;
      
      // Set velocity in weapon direction with slight randomness
      const velocity = direction.clone();
      velocity.multiplyScalar(Math.random() * 2 + 5);
      velocity.x += (Math.random() - 0.5) * 2;
      velocity.y += (Math.random() - 0.5) * 2;
      
      // Set userData for the particle
      particle.userData = {
        velocity,
        lifetime: 0.5, // Seconds
        age: 0,
      };
      
      // Add to scene and particles array
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }
  
  update(delta) {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position based on velocity
      particle.position.x += particle.userData.velocity.x * delta;
      particle.position.y += particle.userData.velocity.y * delta;
      particle.position.z += particle.userData.velocity.z * delta;
      
      // Add age
      particle.userData.age += delta;
      
      // Fade out particle as it ages
      const lifeRatio = 1 - (particle.userData.age / particle.userData.lifetime);
      
      if (lifeRatio <= 0) {
        // Remove particle if lifetime is over
        this.scene.remove(particle);
        this.particles.splice(i, 1);
      } else {
        // Update opacity
        particle.material.opacity = lifeRatio;
        
        // Slow down velocity over time (drag)
        particle.userData.velocity.multiplyScalar(0.95);
      }
    }
  }
}

export default ParticleSystem;
