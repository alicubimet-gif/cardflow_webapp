const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

try {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Use current timestamp as build ID
  const buildId = Date.now().toString();
  
  // Replace version marker
  const updatedContent = content.replace(/v1\.0\.0-[A-Za-z0-9_]+/g, `v1.0.0-${buildId}`);
  
  fs.writeFileSync(swPath, updatedContent, 'utf8');
  console.log(`[PWA Build] Successfully updated Service Worker version to v1.0.0-${buildId}`);
} catch (error) {
  console.error('[PWA Build] Failed to update Service Worker version:', error);
}
