const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { from: /localStorage\.getItem\('token'\)/g, to: "sessionStorage.getItem('token')" },
  { from: /localStorage\.setItem\('token'/g, to: "sessionStorage.setItem('token'" },
  { from: /localStorage\.removeItem\('token'\)/g, to: "sessionStorage.removeItem('token')" },
  { from: /localStorage\.getItem\('user'\)/g, to: "sessionStorage.getItem('user')" },
  { from: /localStorage\.setItem\('user'/g, to: "sessionStorage.setItem('user'" },
  { from: /localStorage\.removeItem\('user'\)/g, to: "sessionStorage.removeItem('user')" },
  { from: /localStorage\.getItem\('companyId'\)/g, to: "sessionStorage.getItem('companyId')" },
  { from: /localStorage\.setItem\('companyId'/g, to: "sessionStorage.setItem('companyId'" },
  { from: /localStorage\.removeItem\('companyId'\)/g, to: "sessionStorage.removeItem('companyId')" },
  { from: /localStorage\.getItem\('companyName'\)/g, to: "sessionStorage.getItem('companyName')" },
  { from: /localStorage\.setItem\('companyName'/g, to: "sessionStorage.setItem('companyName'" },
  { from: /localStorage\.removeItem\('companyName'\)/g, to: "sessionStorage.removeItem('companyName')" },
  { from: /localStorage\.removeItem\(k\)/g, to: "sessionStorage.removeItem(k)" },
];

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(({ from, to }) => {
        if (content.match(from)) {
          content = content.replace(from, to);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Done replacing localStorage with sessionStorage.');
