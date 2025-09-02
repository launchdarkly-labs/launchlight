const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../../../packages/editor-bridge/dist/index.js');
const targetPath = path.join(__dirname, '../public/overlay/iframe-bridge.umd.js');



try {
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy the file
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ Copied bridge to ${targetPath}`);
} catch (error) {
  console.error(`❌ Failed to copy bridge: ${error.message}`);
  process.exit(1);
}
