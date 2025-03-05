const fs = require('fs');
const { createCanvas } = require('canvas');

// Sizes for all required icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Function to draw a smiley face and save it as PNG
function createSmileyIcon(size) {
  // Create canvas with the required dimensions
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const radius = size / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Draw yellow circle background
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#FFDE00'; // Bright yellow
  ctx.fill();
  
  // Draw border
  ctx.lineWidth = size / 24;
  ctx.strokeStyle = '#FF9500'; // Orange border
  ctx.stroke();
  
  // Draw eyes
  const eyeRadius = size / 12;
  const eyeY = radius * 0.7;
  const leftEyeX = radius * 0.65;
  const rightEyeX = radius * 1.35;
  
  // Left eye
  ctx.beginPath();
  ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#333333';
  ctx.fill();
  
  // Right eye
  ctx.beginPath();
  ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#333333';
  ctx.fill();
  
  // Draw smile
  ctx.beginPath();
  ctx.arc(radius, radius, radius * 0.6, 0.2 * Math.PI, 0.8 * Math.PI, false);
  ctx.lineWidth = size / 16;
  ctx.strokeStyle = '#333333';
  ctx.stroke();
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const filename = `public/icons/icon-${size}x${size}.png`;
  
  // Ensure directory exists
  if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
  }
  
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
  
  // Also save as logo192.png and logo512.png if it matches those sizes
  if (size === 192) {
    fs.writeFileSync('public/logo192.png', buffer);
    console.log('Created public/logo192.png');
  } else if (size === 512) {
    fs.writeFileSync('public/logo512.png', buffer);
    console.log('Created public/logo512.png');
  }
  
  // Also save as favicon.ico if it's 72px (will be small but should work)
  if (size === 72) {
    fs.writeFileSync('public/favicon.ico', buffer);
    console.log('Created public/favicon.ico (from 72px image)');
  }
}

// Create all the icons
console.log('Generating smiley face icons...');
sizes.forEach(size => createSmileyIcon(size));
console.log('All icons created successfully!'); 