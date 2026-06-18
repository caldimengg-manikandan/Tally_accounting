const { DeliveryChallan } = require('../../models');

exports.generateEWayBill = async (req, res) => {
  try {
    const { companyId, challanId } = req.params;

    const challan = await DeliveryChallan.findOne({
      where: { id: challanId, CompanyId: companyId }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Delivery Challan not found' });
    }

    if (challan.ewbNumber) {
      return res.status(400).json({ error: 'e-Way Bill already generated for this Challan' });
    }

    // MOCK API CALL TO NIC E-WAY BILL PORTAL
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockEwbNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 12 digit
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 3); // Valid for 3 days mock

    challan.ewbNumber = mockEwbNumber;
    challan.ewbDate = now;
    challan.ewbValidUntil = validUntil;

    await challan.save();

    res.json({
      success: true,
      message: 'e-Way Bill generated successfully (Simulation)',
      data: {
        ewbNumber: challan.ewbNumber,
        ewbDate: challan.ewbDate,
        ewbValidUntil: challan.ewbValidUntil
      }
    });

  } catch (err) {
    console.error('generateEWayBill error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.cancelEWayBill = async (req, res) => {
  try {
    const { companyId, challanId } = req.params;

    const challan = await DeliveryChallan.findOne({
      where: { id: challanId, CompanyId: companyId }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Delivery Challan not found' });
    }

    if (!challan.ewbNumber) {
      return res.status(400).json({ error: 'No e-Way Bill to cancel' });
    }

    // MOCK API CALL TO NIC
    await new Promise(resolve => setTimeout(resolve, 600));

    challan.ewbNumber = null;
    challan.ewbDate = null;
    challan.ewbValidUntil = null;
    await challan.save();

    res.json({
      success: true,
      message: 'e-Way Bill cancelled successfully (Simulation)'
    });

  } catch (err) {
    console.error('cancelEWayBill error:', err);
    res.status(500).json({ error: err.message });
  }
};
