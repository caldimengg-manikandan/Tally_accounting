const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.model.js'));

const injectFields = `
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },`;

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has CreatedBy
  if (content.includes('CreatedBy:') || content.includes('CreatedBy :')) {
    console.log(`Skipped ${file} (already has CreatedBy)`);
    return;
  }

  // Find the id field or CompanyId field to insert after
  const insertRegex = /(id:\s*{[\s\S]*?},|CompanyId:\s*{[\s\S]*?},)/;
  
  if (insertRegex.test(content)) {
    content = content.replace(insertRegex, `$1${injectFields}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find insertion point in ${file}`);
  }
});
