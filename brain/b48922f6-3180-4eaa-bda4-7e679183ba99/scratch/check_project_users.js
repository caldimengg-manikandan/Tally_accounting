const path = require('path');
const modelsPath = path.join(process.cwd(), 'backend', 'models');
const { ProjectUser, User } = require(modelsPath);

async function checkProjectUsers() {
  try {
    const projectId = 'b28236c6-87f8-4d93-a5b2-6e735b1e6908';
    const pus = await ProjectUser.findAll({ 
      where: { ProjectId: projectId },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });
    console.log('Project Users for caldim:', JSON.stringify(pus, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProjectUsers();
