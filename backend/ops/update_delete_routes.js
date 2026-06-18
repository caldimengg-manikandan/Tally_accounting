const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.routes.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // 1. Ensure authorizeRoles is imported if not present
      if (content.includes('router.delete(') && !content.includes('authorizeRoles')) {
        content = content.replace(/(const router = express\.Router\(\);)/, "$1\nconst { authorizeRoles } = require('../../middleware/auth.middleware');");
        changed = true;
      }

      // 2. Replace router.delete(..., authorizeRoles(...), ...) with router.delete(..., authorizeRoles('ADMIN', 'SUPER_ADMIN'), ...)
      content = content.replace(/router\.delete\((['"`].+?['"`])\s*,\s*authorizeRoles\([^)]+\)\s*,/g, "router.delete($1, authorizeRoles('ADMIN', 'SUPER_ADMIN'),");
      
      // 3. For routes that don't have authorizeRoles in delete yet, add it
      // Look for router.delete('/path', handler) or router.delete('/path', verifyToken, handler)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('router.delete(')) {
          if (!lines[i].includes('authorizeRoles')) {
            // Find the comma after the path
            lines[i] = lines[i].replace(/router\.delete\((['"`].+?['"`])\s*,/, "router.delete($1, authorizeRoles('ADMIN', 'SUPER_ADMIN'),");
            changed = true;
          } else if (!lines[i].includes("'ADMIN', 'SUPER_ADMIN'")) {
             lines[i] = lines[i].replace(/authorizeRoles\([^)]+\)/, "authorizeRoles('ADMIN', 'SUPER_ADMIN')");
             changed = true;
          }
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log('Updated routes in', fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'modules'));
console.log('Done.');
