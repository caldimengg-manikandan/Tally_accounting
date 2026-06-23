const { Company, SubscriptionPlan } = require('../models');

exports.requireFeature = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      if (!req.companyId) return res.status(400).json({ error: 'Company ID missing in request' });

      const company = await Company.findByPk(req.companyId, {
        include: [{ model: SubscriptionPlan, as: 'SubscriptionPlan' }]
      });

      if (!company) return res.status(404).json({ error: 'Company not found' });

      // If the company has no plan assigned, or the plan doesn't have the feature, block it.
      const plan = company.SubscriptionPlan;
      if (!plan || !plan.features || !plan.features.includes(requiredFeature)) {
        return res.status(403).json({
          error: 'FEATURE_NOT_IN_PLAN',
          message: `The feature '${requiredFeature}' is not available in your current plan. Please upgrade to access this functionality.`
        });
      }

      next();
    } catch (err) {
      console.error('Feature Gating Middleware Error:', err);
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
};
