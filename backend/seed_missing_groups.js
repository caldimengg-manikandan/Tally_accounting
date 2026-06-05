const { Group, Company } = require('./models');
const { standardGroups } = require('./helpers/tallyGroups');
const { Op } = require('sequelize');

async function seedMissing() {
  try {
    const company = await Company.findOne();
    if (!company) {
      console.log('No company found.');
      return;
    }

    const companyId = company.id;

    const existingGroups = await Group.findAll({ where: { CompanyId: companyId } });
    const existingNames = new Set(existingGroups.map(g => g.name.toLowerCase()));

    // Pass 1: Primary groups
    const primaryGroups = standardGroups.filter(g => !g.parent);
    const groupMap = {};
    
    // map existing for parent reference
    existingGroups.forEach(g => {
        groupMap[g.name] = g.id;
    });

    for (const g of primaryGroups) {
      if (!existingNames.has(g.name.toLowerCase())) {
        const created = await Group.create({
          name: g.name,
          nature: g.nature,
          category: 'Primary',
          CompanyId: companyId
        });
        groupMap[g.name] = created.id;
        console.log(`Seeded primary group: ${g.name}`);
      }
    }

    // Pass 2: Sub-groups
    const subGroups = standardGroups.filter(g => g.parent);
    for (const g of subGroups) {
      if (!existingNames.has(g.name.toLowerCase())) {
        const parentId = groupMap[g.parent] || null;
        await Group.create({
          name: g.name,
          nature: g.nature,
          category: 'Sub-Group',
          parent_id: parentId,
          CompanyId: companyId
        });
        console.log(`Seeded sub-group: ${g.name}`);
      }
    }

    console.log('\nAll missing standard groups have been seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding groups:', err);
    process.exit(1);
  }
}

seedMissing();
