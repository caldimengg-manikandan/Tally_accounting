const db = require('./models');
const companyId = '7d782f6b-d412-4fa4-8eb9-1079ec70ac10'; // Or fetch first company

async function check() {
  try {
    const items = await db.Item.findAll();
    console.log("Total items across all companies:", items.length);
    console.log("Here are the items:");
    console.log(JSON.stringify(items.map(r => ({
      name: r.name,
      salesInfo: r.salesInformation,
      typeSalesInfo: typeof r.salesInformation,
      pInfo: r.purchaseInformation,
      sp: r.sellingPrice,
      cp: r.costPrice,
      cId: r.CompanyId
    })), null, 2));
  } catch (e) {
    console.error("DB Error:", e);
  }
}
check();
