import * as THREE from 'three';

class Weapon {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.projectiles = [];
    this.cooldown = 0.25; // Time between shots in seconds
    this.lastShotTime = 0;
    this.projectileSpeed = 100;
    this.projectileLifetime = 3; // Increased lifetime for longer lasers
    this.damage = 5;
    
    // Create laser geometry and material (longer and thinner for laser effect)
    this.laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 6, 8); // Longer cylinder (6 units)
    this.laserGeometry.rotateX(Math.PI / 2); // Rotate to point forward
    this.laserMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7,
    });
    
    // Create weapon mounts on left and right sides
    this.leftWeaponMount = new THREE.Object3D();
    this.leftWeaponMount.position.set(-0.8, -0.3, -1);
    this.camera.add(this.leftWeaponMount);
    
    this.rightWeaponMount = new THREE.Object3D();
    this.rightWeaponMount.position.set(0.8, -0.3, -1);
    this.camera.add(this.rightWeaponMount);
    
    // Add weapon models
    this.createWeaponModels();
    
    // Add a light at each weapon position to give the effect of weapon glow
    this.leftWeaponLight = new THREE.PointLight(0x00ffff, 0, 5);
    this.leftWeaponLight.position.copy(this.leftWeaponMount.position);
    this.camera.add(this.leftWeaponLight);
    
    this.rightWeaponLight = new THREE.PointLight(0x00ffff, 0, 5);
    this.rightWeaponLight.position.copy(this.rightWeaponMount.position);
    this.camera.add(this.rightWeaponLight);
    
    this.scene.add(this.camera);
  }
  
  createWeaponModels() {
    // Create simple weapon models for visual reference
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const weaponMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    
    const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    leftWeapon.position.set(0, 0, 0);
    this.leftWeaponMount.add(leftWeapon);
    
    const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    rightWeapon.position.set(0, 0, 0);
    this.rightWeaponMount.add(rightWeapon);
  }
  
  shoot() {
    // Check cooldown
    const now = performance.now() / 1000; // Convert to seconds
    if (now - this.lastShotTime < this.cooldown) {
      return;
    }
    
    // Update last shot time
    this.lastShotTime = now;
    
    // Get direction from camera's forward direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    // Shoot from left weapon
    this.createLaser(this.leftWeaponMount, direction, now);
    
    // Shoot from right weapon simultaneously
    this.createLaser(this.rightWeaponMount, direction, now);
    
    // Flash both weapon lights
    this.leftWeaponLight.intensity = 1;
    this.rightWeaponLight.intensity = 1;
  }
  
  createLaser(weaponMount, direction, now) {
    // Create a new laser projectile
    const laser = new THREE.Mesh(this.laserGeometry, this.laserMaterial);
    
    // Set position at weapon mount position (convert from local to world coordinates)
    const weaponWorldPosition = new THREE.Vector3();
    weaponMount.getWorldPosition(weaponWorldPosition);
    laser.position.copy(weaponWorldPosition);
    
    // Align laser with shooting direction
    laser.quaternion.copy(this.camera.quaternion);
    
    laser.userData = {
      direction: direction,
      createdAt: now,
      damage: this.damage,
    };
    
    // Add to scene and projectiles array
    this.scene.add(laser);
    this.projectiles.push(laser);
  }
  
  update(delta, crosshair) {
    const now = performance.now() / 1000;
    
    // Fade weapon lights
    if (this.leftWeaponLight.intensity > 0) {
      this.leftWeaponLight.intensity -= delta * 5;
      if (this.leftWeaponLight.intensity < 0) {
        this.leftWeaponLight.intensity = 0;
      }
    }
    
    if (this.rightWeaponLight.intensity > 0) {
      this.rightWeaponLight.intensity -= delta * 5;
      if (this.rightWeaponLight.intensity < 0) {
        this.rightWeaponLight.intensity = 0;
      }
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Move projectile
      const moveDistance = this.projectileSpeed * delta;
      projectile.position.addScaledVector(projectile.userData.direction, moveDistance);
      
      // Check if projectile should be removed
      if (now - projectile.userData.createdAt > this.projectileLifetime) {
        this.scene.remove(projectile);
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  reset() {
    // Remove all projectiles
    this.projectiles.forEach(projectile => {
      this.scene.remove(projectile);
    });
    this.projectiles = [];
    
    // Reset weapon lights
    this.leftWeaponLight.intensity = 0;
    this.rightWeaponLight.intensity = 0;
  }
  
  getProjectiles() {
    return this.projectiles;
  }
}

export default Weapon;
