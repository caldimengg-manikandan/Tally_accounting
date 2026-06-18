const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');
let hasErrors = false;

fs.readdirSync(modelsDir).forEach(file => {
  if (!file.endsWith('.model.js')) return;
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const matches = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('DOUBLE') || line.includes('FLOAT')) {
      matches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });

  if (matches.length > 0) {
    hasErrors = true;
    console.error(`❌ Model file "${file}" contains deprecated DOUBLE/FLOAT types:`);
    matches.forEach(m => {
      console.error(`   [Line ${m.lineNum}]: ${m.text}`);
    });
  }
});

if (hasErrors) {
  console.error('\n🚨 LINT FAILED: DataTypes.DOUBLE/FLOAT are forbidden in models. Use DataTypes.DECIMAL(18,2) instead.');
  process.exit(1);
} else {
  console.log('✅ Model lint check passed. No DOUBLE/FLOAT types detected.');
  process.exit(0);
}
