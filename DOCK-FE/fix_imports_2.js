const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // fix models imports
  content = content.replace(/models\/paymentService/g, 'models/services/paymentService');
  content = content.replace(/models\/paymentOcrService/g, 'models/services/paymentOcrService');
  content = content.replace(/models\/paymentContentLayout/g, 'models/utils/paymentContentLayout');
  content = content.replace(/models\/paymentDisplay/g, 'models/utils/paymentDisplay');
  content = content.replace(/models\/paymentMappers/g, 'models/services/paymentMappers');
  
  // specific file fixes
  if (filePath.replace(/\\/g, '/').includes('payment/models/services/paymentService.ts')) {
    content = content.replace(/\.\/paymentApi/g, '../api/paymentApi');
  }
  
  // reportApi.ts fix (has error TS2307: Cannot find module './reportTypes')
  if (filePath.replace(/\\/g, '/').includes('report/models/api/reportApi.ts')) {
    content = content.replace(/\.\/reportTypes/g, '../types/reportTypes');
  }

  // fix component imports (assuming PaymentAnimatedTouchable is in common)
  content = content.replace(/\.\/PaymentAnimatedTouchable/g, '../common/PaymentAnimatedTouchable');

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
