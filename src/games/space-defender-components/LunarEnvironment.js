import * as THREE from 'three';

class LunarEnvironment {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.surfaces = [];
    this.craters = [];
    this.maxTilt = 0.3; // Maximum camera tilt
    
    // Lunar surface properties
    this.corridorWidth = 30;
    this.corridorDepth = 1000;
    this.segmentLength = 20;
    this.segments = Math.ceil(this.corridorDepth / this.segmentLength);
    
    // Create starry sky
    this.createStarrySky();
    
    // Create lunar surface
    this.createLunarSurface();
    
    // Add distant mountains/crater rims
    this.createDistantFeatures();
  }
  
  createStarrySky() {
    // Create a large sphere for the sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    // Reverse the geometry so we can see it from inside
    skyGeometry.scale(-1, 1, 1);
    
    // Create dark space material with small emissive component
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
    
    // Add distant stars (don't move these with the player)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false
    });
    
    const starPositions = [];
    for (let i = 0; i < 2000; i++) {
      // Create stars in spherical coordinates for better distribution
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 450 + Math.random() * 30;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
    
    // Add distant Earth
    const earthGeometry = new THREE.SphereGeometry(15, 32, 16);
    const earthMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366CC,
      emissive: 0x1133AA,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-200, 100, -400);
    this.scene.add(earth);
  }
  
  createLunarSurface() {
    // Lunar surface material
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.9,
      metalness: 0.2,
      flatShading: true,
    });
    
    // Add directional light (harsh sunlight with no atmosphere)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    sunLight.position.set(2, 10, 1);
    this.scene.add(sunLight);
    
    // Add very weak ambient light (light reflected from Earth)
    const ambientLight = new THREE.AmbientLight(0x111122, 0.2);
    this.scene.add(ambientLight);
    
    // Create lunar surface segments
    for (let i = 0; i < this.segments; i++) {
      const zPos = -i * this.segmentLength;
      
      // Create a segment of lunar ground - use a wider area than just the corridor
      const groundWidth = this.corridorWidth * 5;
      const groundGeometry = new THREE.PlaneGeometry(
        groundWidth, 
        this.segmentLength,
        Math.floor(groundWidth / 4),  // More vertices for terrain detail
        Math.floor(this.segmentLength / 4)
      );
      
      // Modify vertices to create uneven lunar terrain
      const position = groundGeometry.attributes.position;
      for (let j = 0; j < position.count; j++) {
        // Only modify Y (height) values
        const y = position.getY(j);
        
        // Create small height variations for basic terrain
        let heightMod = Math.random() * 1.5 - 0.5;
        
        // Make the edges of the corridor higher (crater rim-like)
        const x = position.getX(j);
        const distanceFromCenter = Math.abs(x) / (groundWidth / 2);
        if (distanceFromCenter > 0.3) {
          heightMod += (distanceFromCenter - 0.3) * 7;
        }
        
        position.setY(j, y + heightMod);
      }
      
      groundGeometry.computeVertexNormals();
      
      const ground = new THREE.Mesh(groundGeometry, surfaceMaterial);
      ground.position.set(0, -3, zPos - this.segmentLength / 2);
      ground.rotation.x = -Math.PI / 2;
      this.scene.add(ground);
      this.surfaces.push(ground);
      
      // Add craters randomly
      if (Math.random() > 0.6) {
        this.addCrater(zPos);
      }
      
      // Add lunar boulders/rocks randomly
      if (Math.random() > 0.7) {
        this.addLunarRocks(zPos);
      }
    }
  }
  
  addCrater(zPos) {
    // Random position within the corridor, but not directly in the player's path
    const xOffset = (Math.random() - 0.5) * this.corridorWidth * 0.8;
    const zOffset = Math.random() * this.segmentLength;
    
    // Create crater geometry
    const craterSize = Math.random() * 3 + 2;
    const craterGeometry = new THREE.CircleGeometry(craterSize, 32);
    
    // Modify the circle geometry to create a depression
    const position = craterGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      
      // Distance from center
      const distance = Math.sqrt(x * x + y * y);
      let z = 0;
      
      // Create bowl-shaped depression
      if (distance < craterSize) {
        z = -(1 - Math.pow(distance / craterSize, 2)) * craterSize * 0.3;
      }
      
      position.setZ(i, z);
    }
    
    craterGeometry.computeVertexNormals();
    
    // Use the same material as the surface but slightly darker
    const craterMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.9,
      metalness: 0.3,
      flatShading: true,
    });
    
    const crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(xOffset, -2.8, zPos - zOffset);
    crater.rotation.x = -Math.PI / 2;
    
    this.scene.add(crater);
    this.craters.push(crater);
  }
  
  addLunarRocks(zPos) {
    // Create a cluster of 1-3 rocks
    const rockCount = Math.floor(Math.random() * 3) + 1;
    const xBase = (Math.random() - 0.5) * this.corridorWidth * 0.7;
    const zBase = Math.random() * this.segmentLength;
    
    for (let i = 0; i < rockCount; i++) {
      // Slightly offset each rock in the cluster
      const xOffset = xBase + (Math.random() - 0.5) * 2;
      const zOffset = zBase + (Math.random() - 0.5) * 2;
      
      // Create rock with random size and shape
      const rockSize = Math.random() * 1 + 0.5;
      let rockGeometry;
      
      // Different rock shapes for variety
      const shapeType = Math.random();
      if (shapeType < 0.33) {
        rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      } else if (shapeType < 0.66) {
        rockGeometry = new THREE.OctahedronGeometry(rockSize, 0);
      } else {
        rockGeometry = new THREE.IcosahedronGeometry(rockSize, 0);
      }
      
      // Distort the rock slightly for more natural look
      const position = rockGeometry.attributes.position;
      for (let j = 0; j < position.count; j++) {
        const x = position.getX(j);
        const y = position.getY(j);
        const z = position.getZ(j);
        
        position.setX(j, x + (Math.random() - 0.5) * 0.2);
        position.setY(j, y + (Math.random() - 0.5) * 0.2);
        position.setZ(j, z + (Math.random() - 0.5) * 0.2);
      }
      
      rockGeometry.computeVertexNormals();
      
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 1.0,
        metalness: 0.1,
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(xOffset, -2 + rockSize / 2, zPos - zOffset);
      
      // Rotate randomly
      rock.rotation.x = Math.random() * Math.PI;
      rock.rotation.y = Math.random() * Math.PI;
      rock.rotation.z = Math.random() * Math.PI;
      
      this.scene.add(rock);
      this.surfaces.push(rock);
    }
  }
  
  createDistantFeatures() {
    // Create distant crater rims and mountains
    const rimGeometry = new THREE.TorusGeometry(100, 20, 16, 100, Math.PI * 0.7);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 1.0,
      metalness: 0.2,
      flatShading: true,
    });
    
    // Place several crater rims in the distance
    for (let i = 0; i < 3; i++) {
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      
      // Position far away and at different angles
      const angle = i * (Math.PI * 2 / 3);
      const distance = 200 + Math.random() * 100;
      rim.position.set(
        Math.cos(angle) * distance,
        -50 + Math.random() * 20,
        -500 - Math.random() * 200
      );
      
      // Rotate to face roughly toward the player
      rim.rotation.x = Math.PI / 2;
      rim.rotation.z = angle + Math.PI;
      
      this.scene.add(rim);
    }
  }
  
  update(delta, mouseX, shipHeight = 0) {
    // Calculate how much to tilt the camera based on mouse position
    // mouseX is between -1 (left) and 1 (right)
    const targetTilt = -mouseX * this.maxTilt;
    
    // Smoothly interpolate current rotation toward target
    this.camera.rotation.z = THREE.MathUtils.lerp(
      this.camera.rotation.z,
      targetTilt,
      delta * 3 // Adjust for faster/slower response
    );
    
    // Also slightly adjust x position to enhance the feeling of moving in the direction
    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      mouseX * (this.corridorWidth / 3),
      delta * 2
    );
    
    // Update vertical position based on ship height
    this.camera.position.y = THREE.MathUtils.lerp(
      this.camera.position.y,
      shipHeight,
      delta * 2
    );
    
    // Move all environment pieces forward to create the illusion of movement
    const moveSpeed = 30 * delta; // Speed of travel across lunar surface
    
    [...this.surfaces, ...this.craters].forEach(object => {
      object.position.z += moveSpeed;
      
      // If the segment has moved past the camera, move it back to the end
      if (object.position.z > 10) {
        object.position.z -= this.corridorDepth;
        
        // Randomize X position when recycling for variety
        if (object.geometry.type === 'CircleGeometry') {
          // It's a crater, reposition it
          object.position.x = (Math.random() - 0.5) * this.corridorWidth * 0.8;
        } else if (object.geometry.type.includes('hedronGeometry')) {
          // It's a rock, reposition it
          object.position.x = (Math.random() - 0.5) * this.corridorWidth * 0.7;
          
          // Rotate again for variety
          object.rotation.x = Math.random() * Math.PI;
          object.rotation.y = Math.random() * Math.PI;
          object.rotation.z = Math.random() * Math.PI;
        }
      }
    });
  }
}

export default LunarEnvironment;
