const { Company } = require('./models');

async function test() {
  try {
    const c = await Company.findByPk("undefined");
    console.log(c);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test().then(()=>process.exit(0));
