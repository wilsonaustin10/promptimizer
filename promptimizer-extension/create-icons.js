import { writeFileSync } from 'fs';

// Simple rocket emoji as SVG for our icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#667eea" rx="16"/>
  <text x="64" y="88" font-size="72" text-anchor="middle" fill="white">🚀</text>
</svg>`;

// Convert SVG to PNG using canvas (this is a placeholder - in production you'd use a proper converter)
// For now, we'll create a simple colored square as placeholder
const sizes = [16, 48, 128];

sizes.forEach(size => {
  // Create a simple placeholder PNG (1x1 purple pixel stretched)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(`public/icon-${size}.png`, png);
});

console.log('Icons created!');