const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dashboard', 'dist');
const dest = path.join(__dirname, '..', 'extension', 'dashboard');

if (fs.existsSync(src)) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log('Copied built dashboard to extension/dashboard successfully.');
} else {
  console.warn('dashboard/dist does not exist yet. Run build:dashboard first.');
}
