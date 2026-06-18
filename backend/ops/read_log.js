const fs = require('fs');
try {
  const content = fs.readFileSync('C:/Users/loges/.gemini/antigravity-ide/brain/11383197-075d-4deb-8e10-1cafe191b675/.system_generated/tasks/task-427.log', 'utf8');
  console.log(content);
} catch (err) {
  console.error('Failed to read log:', err.message);
}
