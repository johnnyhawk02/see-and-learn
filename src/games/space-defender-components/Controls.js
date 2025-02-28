class Controls {
  constructor(container, crosshairRef) {
    this.container = container;
    this.crosshairRef = crosshairRef;
    this.isPointerLocked = false;
    this.mouseMoveCallback = null;
    
    // Initialize mouse position in center
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Add vertical position for ship height control
    this.shipHeight = 0; // 0 is neutral position
    this.maxHeight = 8; // Maximum up/down distance from neutral
    this.heightChangeRate = 0.1; // How quickly height changes
    
    // Track key states
    this.keys = {
      up: false,
      down: false
    };
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Set a callback function to be called when mouse moves or height changes
  setMouseMoveCallback(callback) {
    this.mouseMoveCallback = callback;
  }
  
  setupEventListeners() {
    // Mouse movement for aiming
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Click to request pointer lock (for FPS controls)
    this.container.addEventListener('click', this.requestPointerLock.bind(this));
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('mozpointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('webkitpointerlockchange', this.handlePointerLockChange.bind(this));
    
    // Keyboard controls for vertical movement
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  handleKeyDown(event) {
    // Handle up/down movement keys
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.keys.up = true;
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.keys.down = true;
    }
  }
  
  handleKeyUp(event) {
    // Release up/down movement keys
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.keys.up = false;
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.keys.down = false;
    }
  }
  
  handleMouseMove(event) {
    if (this.isPointerLocked) {
      // Use pointer lock movement data (more accurate for FPS)
      const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      
      // Update mouse position
      this.mouseX += movementX;
      this.mouseY += movementY;
      
      // Clamp to prevent extreme values
      const maxX = this.container.clientWidth / 4;
      const maxY = this.container.clientHeight / 4;
      this.mouseX = Math.max(-maxX, Math.min(maxX, this.mouseX));
      this.mouseY = Math.max(-maxY, Math.min(maxY, this.mouseY));
    } else {
      // Just use mouse position relative to center of screen
      const rect = this.container.getBoundingClientRect();
      this.mouseX = event.clientX - rect.left - rect.width / 2;
      this.mouseY = event.clientY - rect.top - rect.height / 2;
    }
    
    // Update crosshair reference
    if (this.crosshairRef.current) {
      this.crosshairRef.current.x = this.mouseX;
      this.crosshairRef.current.y = this.mouseY;
    }
    
    // Call the callback if it exists
    this.notifyPositionChange();
  }
  
  update(delta) {
    // Handle vertical ship movement based on key states
    if (this.keys.up) {
      this.shipHeight += this.heightChangeRate * delta * 60; // Scale by delta and approx 60fps
    } else if (this.keys.down) {
      this.shipHeight -= this.heightChangeRate * delta * 60;
    }
    
    // Apply constraints to keep within boundaries
    this.shipHeight = Math.max(-this.maxHeight, Math.min(this.maxHeight, this.shipHeight));
    
    // Only notify if there's vertical movement
    if (this.keys.up || this.keys.down) {
      this.notifyPositionChange();
    }
  }
  
  notifyPositionChange() {
    if (this.mouseMoveCallback) {
      this.mouseMoveCallback({
        x: this.mouseX,
        y: this.mouseY,
        height: this.shipHeight
      });
    }
  }
  
  requestPointerLock() {
    if (!this.isPointerLocked) {
      const element = this.container;
      
      element.requestPointerLock = element.requestPointerLock || 
                                   element.mozRequestPointerLock ||
                                   element.webkitRequestPointerLock;
      
      element.requestPointerLock();
    }
  }
  
  handlePointerLockChange() {
    if (document.pointerLockElement === this.container || 
        document.mozPointerLockElement === this.container ||
        document.webkitPointerLockElement === this.container) {
      this.isPointerLocked = true;
    } else {
      this.isPointerLocked = false;
    }
  }
  
  exitPointerLock() {
    document.exitPointerLock = document.exitPointerLock ||
                              document.mozExitPointerLock ||
                              document.webkitExitPointerLock;
    document.exitPointerLock();
  }
  
  getMousePosition() {
    return {
      x: this.mouseX,
      y: this.mouseY,
      height: this.shipHeight
    };
  }
}

export default Controls;
