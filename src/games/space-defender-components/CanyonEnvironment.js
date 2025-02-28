import * as THREE from 'three';

class CanyonEnvironment {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.walls = [];
    this.floorAndCeiling = [];
    this.maxTilt = 0.3; // Maximum camera tilt
    
    // Canyon properties
    this.canyonWidth = 30;
    this.canyonHeight = 20;
    this.canyonDepth = 1000;
    this.segmentLength = 20;
    this.segments = Math.ceil(this.canyonDepth / this.segmentLength);
    
    // Create canyon walls, floor and ceiling
    this.createCanyon();
  }
  
  createCanyon() {
    // Canyon wall material with some texture
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa6633,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    
    // Floor material
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x664422,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Ceiling material (space)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 1.0,
      metalness: 0.0,
      emissive: 0x222244,
    });
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffaa55, 1);
    directionalLight.position.set(5, 10, 2);
    this.scene.add(directionalLight);
    
    // Create canyon segments
    for (let i = 0; i < this.segments; i++) {
      const zPos = -i * this.segmentLength;
      
      // Allow for slight random variation in canyon width
      const widthVariation = (Math.random() * 0.3 + 0.85) * this.canyonWidth;
      const heightVariation = (Math.random() * 0.2 + 0.9) * this.canyonHeight;
      
      // Left wall
      const leftWallGeometry = new THREE.PlaneGeometry(this.segmentLength, heightVariation);
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
      leftWall.position.set(-widthVariation / 2, 0, zPos - this.segmentLength / 2);
      leftWall.rotation.y = Math.PI / 2;
      this.scene.add(leftWall);
      this.walls.push(leftWall);
      
      // Right wall
      const rightWallGeometry = new THREE.PlaneGeometry(this.segmentLength, heightVariation);
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
      rightWall.position.set(widthVariation / 2, 0, zPos - this.segmentLength / 2);
      rightWall.rotation.y = -Math.PI / 2;
      this.scene.add(rightWall);
      this.walls.push(rightWall);
      
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(widthVariation, this.segmentLength);
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.set(0, -heightVariation / 2, zPos - this.segmentLength / 2);
      floor.rotation.x = Math.PI / 2;
      this.scene.add(floor);
      this.floorAndCeiling.push(floor);
      
      // Ceiling
      const ceilingGeometry = new THREE.PlaneGeometry(widthVariation, this.segmentLength);
      const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
      ceiling.position.set(0, heightVariation / 2, zPos - this.segmentLength / 2);
      ceiling.rotation.x = -Math.PI / 2;
      this.scene.add(ceiling);
      this.floorAndCeiling.push(ceiling);
      
      // Add some random rock formations on the walls
      if (Math.random() > 0.7) {
        this.addRockFormation(zPos, widthVariation, heightVariation);
      }
    }
  }
  
  addRockFormation(zPos, width, height) {
    // Decide if rock formation is on left or right wall
    const isLeft = Math.random() > 0.5;
    const xPos = isLeft ? -width / 2 : width / 2;
    
    // Create rock geometry
    const rockGeometry = new THREE.IcosahedronGeometry(Math.random() * 2 + 1, 1);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x886655,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(
      xPos,
      Math.random() * height - height / 3,
      zPos - Math.random() * this.segmentLength
    );
    
    if (isLeft) {
      rock.position.x += 1; // Adjust to protrude from left wall
    } else {
      rock.position.x -= 1; // Adjust to protrude from right wall
    }
    
    this.scene.add(rock);
    this.walls.push(rock);
  }
  
  update(delta, mouseX) {
    // Calculate how much to tilt the camera based on mouse position
    // mouseX is between -1 (left) and 1 (right)
    const targetTilt = -mouseX * this.maxTilt;
    
    // Smoothly interpolate current rotation toward target
    this.camera.rotation.z = THREE.MathUtils.lerp(
      this.camera.rotation.z,
      targetTilt,
      delta * 3 // Adjust this for faster/slower response
    );
    
    // Also slightly adjust x position to enhance the feeling of moving in the direction
    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      mouseX * (this.canyonWidth / 3),
      delta * 2
    );
    
    // Move all environment pieces forward to create the illusion of movement
    const moveSpeed = 30 * delta; // Speed of travel through canyon
    
    [...this.walls, ...this.floorAndCeiling].forEach(object => {
      object.position.z += moveSpeed;
      
      // If the segment has moved past the camera, move it back to the end of the canyon
      if (object.position.z > 10) {
        object.position.z -= this.canyonDepth;
      }
    });
  }
}

export default CanyonEnvironment;
