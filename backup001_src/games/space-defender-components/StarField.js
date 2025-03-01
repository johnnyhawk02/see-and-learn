import * as THREE from 'three';

class StarField {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.stars = [];
    this.numStars = options.numStars || 2000;
    this.starColors = [0xFFFFFF, 0xCCCCFF, 0xFFCCCC, 0xCCFFFF, 0xFFEEDD];
    this.fieldSize = options.fieldSize || 1000; // How far stars can be from origin
    this.starMinSpeed = options.starMinSpeed || 5;
    this.starMaxSpeed = options.starMaxSpeed || 20;
    
    // Create nebulas (colored clouds in the background)
    this.createNebulas();
    
    // Create stars
    this.createStars();
  }
  
  createNebulas() {
    // Create a few nebula clouds
    const nebulaCount = 3;
    const nebulaColors = [0x3333AA, 0x333366, 0x336666, 0x663366];
    
    for (let i = 0; i < nebulaCount; i++) {
      // Create a nebula using a sprite with a gradient texture
      const size = Math.random() * 100 + 200;
      
      // Create canvas for nebula texture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      const color = new THREE.Color(nebulaColors[i % nebulaColors.length]);
      
      gradient.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.3)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      
      // Create texture from canvas
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      
      const material = new THREE.SpriteMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      
      const nebula = new THREE.Sprite(material);
      nebula.scale.set(size, size, 1);
      
      // Position nebula far away
      nebula.position.set(
        (Math.random() - 0.5) * this.fieldSize * 0.5,
        (Math.random() - 0.5) * this.fieldSize * 0.5,
        -Math.random() * this.fieldSize
      );
      
      // Store speed for movement
      nebula.userData = {
        speed: this.starMinSpeed * 0.2, // Nebulas move slower than stars
      };
      
      this.scene.add(nebula);
      this.stars.push(nebula);
    }
  }
  
  createStars() {
    // Create individual stars
    for (let i = 0; i < this.numStars; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 5, 5);
      const colorIndex = Math.floor(Math.random() * this.starColors.length);
      const material = new THREE.MeshBasicMaterial({
        color: this.starColors[colorIndex],
        transparent: true,
        opacity: Math.random() * 0.5 + 0.5,
      });
      
      const star = new THREE.Mesh(geometry, material);
      
      // Random position within the field
      star.position.set(
        (Math.random() - 0.5) * this.fieldSize,
        (Math.random() - 0.5) * this.fieldSize,
        -Math.random() * this.fieldSize
      );
      
      // Store speed for movement
      star.userData = {
        speed: Math.random() * (this.starMaxSpeed - this.starMinSpeed) + this.starMinSpeed,
      };
      
      // Make distant stars smaller
      const distanceScale = (this.fieldSize + star.position.z) / this.fieldSize;
      star.scale.set(distanceScale, distanceScale, distanceScale);
      
      this.scene.add(star);
      this.stars.push(star);
    }
  }
  
  update(delta) {
    // Move stars toward the camera
    this.stars.forEach(star => {
      // Move star based on its speed
      star.position.z += star.userData.speed * delta;
      
      // If star passes the camera, reset it to the back of the field
      if (star.position.z > 10) {
        star.position.z = -this.fieldSize;
        star.position.x = (Math.random() - 0.5) * this.fieldSize;
        star.position.y = (Math.random() - 0.5) * this.fieldSize;
        
        // Reset speed
        star.userData.speed = Math.random() * (this.starMaxSpeed - this.starMinSpeed) + this.starMinSpeed;
      }
      
      // Update star size based on distance (stars get bigger as they get closer)
      const distanceScale = (this.fieldSize + star.position.z) / this.fieldSize;
      star.scale.set(distanceScale, distanceScale, distanceScale);
    });
  }
}

export default StarField;
