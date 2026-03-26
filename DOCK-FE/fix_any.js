const fs = require('fs');

const errors = fs.readFileSync('ts_errors.log', 'utf8').split('\n');
const fixes = {};

for (const line of errors) {
  const match = line.match(/(.+?)\((\d+),(\d+)\): error TS7006: Parameter '(.+?)'/);
  if (match) {
    const file = match[1];
    const r = parseInt(match[2], 10) - 1; 
    const c = parseInt(match[3], 10) - 1; 
    const param = match[4];
    
    if (!fixes[file]) fixes[file] = [];
    fixes[file].push({ r, c, param });
  }
}

for (const file in fixes) {
  if (!fs.existsSync(file)) continue;
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  
  fixes[file].sort((a, b) => b.r - a.r || b.c - a.c);
  
  for (const fix of fixes[file]) {
    const { r, c, param } = fix;
    const line = lines[r];
    if (line.substr(c, param.length) === param) {
      if (!line.substr(c, param.length + 5).includes(':')) {
         let prefix = line.substring(0, c);
         let suffix = line.substring(c + param.length);
         let prevChar = prefix.trim().slice(-1);
         if (prevChar !== '(' && prevChar !== ',') {
             lines[r] = prefix.replace(/\s+$/, '') + '(' + param + ': any)' + suffix.replace(/^\s*/, '');
         } else {
             lines[r] = prefix + param + ': any' + suffix;
         }
      }
    }
  }
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
}
