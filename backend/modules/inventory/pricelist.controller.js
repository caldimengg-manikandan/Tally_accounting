const { PriceList, AuditLog } = require('../../models');

const pricelistController = {
  // 1. Create Price List
  createPriceList: async (req, res) => {
    try {
      const { 
        name, 
        transactionType, 
        priceListType, 
        description, 
        markupType, 
        percentage, 
        roundOffTo,
        pricingScheme,
        currency,
        includeDiscount,
        itemRates,
        CompanyId 
      } = req.body;

      // Validation
      if (!name) return res.status(400).json({ error: 'Name is required' });
      if (!CompanyId) return res.status(400).json({ error: 'Company association is required' });

      const pricelist = await PriceList.create({
        name,
        transactionType,
        priceListType,
        description,
        markupType,
        percentage: percentage || 0,
        roundOffTo,
        pricingScheme: pricingScheme || 'Unit Pricing',
        currency: currency || 'INR - Indian Rupee',
        includeDiscount: includeDiscount || false,
        itemRates: itemRates || {},
        CompanyId
      });

      // Audit Log
      await AuditLog.create({
        action: 'CREATE_PRICELIST',
        details: `Created price list: ${name}`,
        CompanyId,
        UserId: req.user.id
      });

      res.status(201).json(pricelist);
    } catch (err) {
      console.error('Create PriceList Error:', err);
      res.status(500).json({ error: 'Failed to create price list' });
    }
  },

  // 2. Get All Price Lists for a Company
  getPriceLists: async (req, res) => {
    try {
      const { companyId } = req.params;
      const pricelists = await PriceList.findAll({
        where: { CompanyId: companyId },
        order: [['createdAt', 'DESC']]
      });
      res.json(pricelists);
    } catch (err) {
      console.error('Get PriceLists Error:', err);
      res.status(500).json({ error: 'Failed to fetch price lists' });
    }
  },

  // 3. Get Single Price List
  getPriceListById: async (req, res) => {
    try {
      const { id } = req.params;
      const pricelist = await PriceList.findByPk(id);
      if (!pricelist) return res.status(404).json({ error: 'Price list not found' });
      res.json(pricelist);
    } catch (err) {
      console.error('Get PriceList Error:', err);
      res.status(500).json({ error: 'Failed to fetch price list' });
    }
  },

  // 4. Update Price List
  updatePriceList: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const pricelist = await PriceList.findByPk(id);
      if (!pricelist) return res.status(404).json({ error: 'Price list not found' });

      await pricelist.update(updates);

      // Audit Log
      await AuditLog.create({
        action: 'UPDATE_PRICELIST',
        details: `Updated price list: ${pricelist.name}`,
        CompanyId: pricelist.CompanyId,
        UserId: req.user.id
      });

      res.json(pricelist);
    } catch (err) {
      console.error('Update PriceList Error:', err);
      res.status(500).json({ error: 'Failed to update price list' });
    }
  },

  // 5. Delete Price List
  deletePriceList: async (req, res) => {
    try {
      const { id } = req.params;
      const pricelist = await PriceList.findByPk(id);
      if (!pricelist) return res.status(404).json({ error: 'Price list not found' });

      const name = pricelist.name;
      const companyId = pricelist.CompanyId;
      
      await pricelist.destroy();

      // Audit Log
      await AuditLog.create({
        action: 'DELETE_PRICELIST',
        details: `Deleted price list: ${name}`,
        CompanyId: companyId,
        UserId: req.user.id
      });

      res.json({ message: 'Price list deleted successfully' });
    } catch (err) {
      console.error('Delete PriceList Error:', err);
      res.status(500).json({ error: 'Failed to delete price list' });
    }
  }
};

module.exports = pricelistController;
