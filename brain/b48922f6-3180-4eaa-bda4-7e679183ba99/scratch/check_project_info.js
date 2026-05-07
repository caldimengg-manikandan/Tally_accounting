const path = require('path');
const modelsPath = path.join(process.cwd(), 'backend', 'models');
const { Project } = require(modelsPath);

async function checkProject() {
  try {
    const id = 'b28236c6-87f8-4d93-a5b2-6e735b1e6908';
    const p = await Project.findByPk(id);
    console.log('Project Info:', JSON.stringify(p, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProject();
