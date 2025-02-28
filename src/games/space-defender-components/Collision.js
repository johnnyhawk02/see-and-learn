import * as THREE from 'three';

class Collision {
  constructor() {
    // Raycaster for projectile collision detection
    this.raycaster = new THREE.Raycaster();
  }
  
  checkCollisions(projectiles, aliens, onAlienHit) {
    // Check each projectile against each alien
    projectiles.forEach(projectile => {
      // Get projectile position and direction
      const origin = projectile.position.clone();
      const direction = projectile.userData.direction.clone();
      
      // Set up raycaster
      this.raycaster.set(origin, direction);
      
      // Get all alien meshes
      const alienMeshes = aliens.map(alien => alien.mesh);
      
      // Check for intersections
      const intersects = this.raycaster.intersectObjects(alienMeshes);
      
      if (intersects.length > 0) {
        // Find the closest intersection
        const intersection = intersects[0];
        const distance = intersection.distance;
        
        // Only count collision if it's close enough (prevents detecting aliens far ahead)
        if (distance < 2) {
          // Find the alien that was hit
          const hitMesh = intersection.object;
          const hitAlien = aliens.find(alien => alien.mesh === hitMesh);
          
          if (hitAlien) {
            // Apply damage
            const destroyed = hitAlien.takeDamage(projectile.userData.damage);
            
            if (destroyed) {
              // Remove alien if destroyed
              hitAlien.destroy();
              
              // Callback for alien destroyed
              if (onAlienHit) {
                onAlienHit(hitAlien);
              }
            }
          }
        }
      }
    });
  }
  
  // Simple sphere-based collision detection for two objects
  checkSphereCollision(obj1, obj2, radius1, radius2) {
    // Get positions
    const pos1 = obj1.position;
    const pos2 = obj2.position;
    
    // Calculate distance
    const distance = pos1.distanceTo(pos2);
    
    // Return true if objects are colliding
    return distance < (radius1 + radius2);
  }
}

export default Collision;
