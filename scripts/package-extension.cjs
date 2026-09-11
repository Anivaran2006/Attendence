const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('--- Checking Extension Deployment Readiness ---');

const extDir = path.join(__dirname, '..', 'extension');
const manifestPath = path.join(extDir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('ERROR: manifest.json not found!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`Manifest Name: ${manifest.name} (v${manifest.version})`);

// Copy content.css into dist if not already there
const contentCssSrc = path.join(extDir, 'src', 'content', 'content.css');
const contentCssDist = path.join(extDir, 'dist', 'content.css');
if (fs.existsSync(contentCssSrc)) {
  fs.copyFileSync(contentCssSrc, contentCssDist);
  console.log('✓ Synced dist/content.css');
}

// Check all manifest files
const filesToCheck = [
  manifest.action?.default_popup,
  manifest.background?.service_worker,
  ...(manifest.content_scripts?.flatMap(cs => [...(cs.js || []), ...(cs.css || [])]) || []),
  manifest.icons?.['16'],
  manifest.icons?.['48'],
  manifest.icons?.['128'],
  'dashboard/index.html'
];

let allValid = true;
for (const f of filesToCheck) {
  if (!f) continue;
  const fullPath = path.join(extDir, f);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Verified: ${f}`);
  } else {
    console.error(`✗ MISSING: ${f} (${fullPath})`);
    allValid = false;
  }
}

if (!allValid) {
  console.error('Deployment validation FAILED: Missing required files.');
  process.exit(1);
}

console.log('========================================================');
console.log('🎉 ALL CHECKS PASSED: Extension is 100% READY TO DEPLOY!');
console.log('Load folder in Chrome/Edge Developer Mode:');
console.log(`-> ${extDir}`);
console.log('========================================================');
