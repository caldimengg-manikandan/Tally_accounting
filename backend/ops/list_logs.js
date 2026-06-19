const fs = require('fs');
const path = require('path');
const logDir = 'C:/Users/loges/.gemini/antigravity-ide/brain/11383197-075d-4deb-8e10-1cafe191b675/.system_generated/tasks';
try {
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    console.log(`Log Directory exists. Found ${files.length} files:`);
    files.forEach(file => {
      const fullPath = path.join(logDir, file);
      const stats = fs.statSync(fullPath);
      console.log(`- ${file} (${stats.size} bytes)`);
    });
  } else {
    console.log('Log Directory does not exist:', logDir);
  }
} catch (err) {
  console.error('Error listing log directory:', err.message);
}
