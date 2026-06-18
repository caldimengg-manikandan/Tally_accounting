const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../models');

fs.readdirSync(dir).forEach(f => {
  if (!f.endsWith('.model.js')) return;
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  if (content.includes('CompanyId')) {
    const lines = content.split('\n');
    const idx = lines.findIndex(l => l.includes('CompanyId'));
    const chunk = lines.slice(idx, idx + 6).join('\n');
    if (!chunk.includes('allowNull: false')) {
      console.log(`${f} has allowNull true or missing false`);
    }
  }
});
