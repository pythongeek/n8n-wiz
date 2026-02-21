#!/usr/bin/env node

/**
 * Debug build script for Vercel
 * This helps diagnose why vite is not found during build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== DEBUG BUILD SCRIPT ===\n');

// Check Node and NPM versions
console.log('Node version:', process.version);
try {
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
  console.log('NPM version:', npmVersion);
} catch (e) {
  console.log('NPM version: ERROR -', e.message);
}

// Check current directory
console.log('\nCurrent directory:', process.cwd());

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
console.log('node_modules exists:', fs.existsSync(nodeModulesPath));

// Check if vite is installed
const vitePaths = [
  path.join(nodeModulesPath, '.bin', 'vite'),
  path.join(nodeModulesPath, '.bin', 'vite.cmd'),
  path.join(nodeModulesPath, 'vite', 'bin', 'vite.js'),
];

console.log('\nChecking for vite:');
vitePaths.forEach(p => {
  console.log('  ', p, ':', fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND');
});

// Check package.json
console.log('\nReading package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  console.log('  Dependencies:', Object.keys(pkg.dependencies || {}).join(', '));
  console.log('  DevDependencies:', Object.keys(pkg.devDependencies || {}).join(', '));
  console.log('  Has vite in dependencies:', 'vite' in (pkg.dependencies || {}));
  console.log('  Has vite in devDependencies:', 'vite' in (pkg.devDependencies || {}));
} catch (e) {
  console.log('  ERROR reading package.json:', e.message);
}

// Try to run npx vite
console.log('\nTrying npx vite:');
try {
  const npxOutput = execSync('npx vite --version', { encoding: 'utf8', timeout: 30000 }).trim();
  console.log('  npx vite version:', npxOutput);
} catch (e) {
  console.log('  npx vite ERROR:', e.message);
}

// Try to run the actual build
console.log('\n=== RUNNING BUILD ===\n');
try {
  execSync('npx tsc -b && npx vite build', { 
    stdio: 'inherit',
    timeout: 120000
  });
  console.log('\n=== BUILD SUCCESS ===');
  process.exit(0);
} catch (e) {
  console.log('\n=== BUILD FAILED ===');
  console.log('Error:', e.message);
  process.exit(1);
}
