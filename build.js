#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'app');

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy all files from app to dist/app
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Building extension...');
copyDir(path.join(__dirname, 'app'), distDir);

// Set DEBUG to false in content-script.js
const contentScriptPath = path.join(distDir, 'content-script.js');
let content = fs.readFileSync(contentScriptPath, 'utf8');
content = content.replace(/const DEBUG = true;/g, 'const DEBUG = false;');
fs.writeFileSync(contentScriptPath, content);

console.log('✅ Build complete! Extension ready in dist/app/');
console.log('   - DEBUG mode disabled for production');
