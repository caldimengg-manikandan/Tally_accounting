const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'modules');

const getDepth = (filePath) => {
  const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
  const parts = relativePath.split(path.sep);
  return parts.length - 1; // Number of directories deep
};

const getImportPath = (depth) => {
  if (depth === 1) return '../hooks/usePermissions';
  if (depth === 2) return '../../hooks/usePermissions';
  if (depth === 3) return '../../../hooks/usePermissions';
  return '../../hooks/usePermissions';
};

const processFile = (filePath) => {
  if (!filePath.endsWith('View.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already processed
  if (content.includes('usePermissions')) return;
  
  const depth = getDepth(filePath);
  const importPath = getImportPath(depth);
  
  // 1. Add import
  const importStatement = `import usePermissions from '${importPath}';\n`;
  // Add after the last import
  const lastImportIndex = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
  content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);
  
  // 2. Add hook call inside component
  const componentNameMatch = content.match(/const\s+([A-Za-z0-9_]+View)\s*=\s*\([^)]*\)\s*=>\s*\{/);
  if (!componentNameMatch) return;
  
  const componentDef = componentNameMatch[0];
  const hookCall = `\n  const { canCreate, canEdit, canDelete, canApprove } = usePermissions();`;
  content = content.replace(componentDef, componentDef + hookCall);
  
  // 3. Wrap "New" buttons at the top right
  // Pattern: <button ... onClick={() => navigate('/.../new')} ... > ... <Plus ... /> New ... </button>
  // This is too hard with regex reliably. We'll leave the UI wrapping to manual multi_replace, OR
  // we can do a targeted regex if it's strictly formatted.
  // Actually, many files have: <button \n onClick={() => navigate('/.../new')} ... >
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${path.basename(filePath)}`);
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath);
    } else {
      processFile(fullPath);
    }
  }
};

walkSync(modulesDir);
