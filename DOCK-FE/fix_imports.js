const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/models\/paymentTypes/g, 'models/types/paymentTypes');
  
  const fp = filePath.replace(/\\/g, '/');
  if (fp.includes('models/api') || fp.includes('models/services') || fp.includes('models/utils')) {
    content = content.replace(/\.\/paymentTypes/g, '../types/paymentTypes');
  } else if (fp.includes('models/paymentImagePicker.ts')) {
    content = content.replace(/\.\/paymentTypes/g, './types/paymentTypes');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walk('c:/ksc4305/duckchi/S14P21C102-FE/DOCK-FE/src/features');
