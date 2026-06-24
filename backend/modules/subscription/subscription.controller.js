// Mock Razorpay since it's not in package.json dependencies
class RazorpayMock {
  constructor(options) {
    this.key_id = options.key_id;
    this.key_secret = options.key_secret;
    this.orders = {
      create: async (options) => {
        return {
          id: 'order_mock_' + Date.now(),
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000)
        };
      }
    };
  }
}

const crypto = require('crypto');
const { Company, SubscriptionPlan, CompanySubscription } = require('../../models');

// Initialize Razorpay (will silently fail if env vars are missing, allowing local testing without keys)
const razorpay = new RazorpayMock({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
});

exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const companyId = req.companyId;

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const company = await Company.findByPk(companyId);

    // Create an order in Razorpay (Amount must be in paise for INR)
    const options = {
      amount: parseInt(plan.price * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${companyId}_${Date.now()}`
    };

    // If using real keys, this will call Razorpay. For safety/test we try/catch.
    try {
      const order = await razorpay.orders.create(options);
      
      // Store pending subscription history
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month prepaid

      await CompanySubscription.create({
        CompanyId: company.id,
        PlanId: plan.id,
        startDate: now,
        endDate: endDate,
        amount: plan.price,
        paymentStatus: 'Pending',
        razorpaySubscriptionId: order.id
      });

      res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
    } catch (rzpErr) {
      console.error('Razorpay API Error:', rzpErr);
      res.status(500).json({ error: 'Failed to communicate with Payment Gateway', details: rzpErr.message });
    }

  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.verifyPaymentWebhook = async (req, res) => {
  try {
    // Razorpay sends the payload in req.body and the signature in headers
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    
    // The signature is an HMAC hex digest using the webhook secret
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
      // Signature is valid!
      const event = req.body.event;
      
      if (event === 'payment.captured' || event === 'order.paid') {
        const orderId = req.body.payload.payment.entity.order_id;

        // Find the pending subscription
        const subscription = await CompanySubscription.findOne({ where: { razorpaySubscriptionId: orderId } });
        if (subscription) {
          subscription.paymentStatus = 'Paid';
          await subscription.save();

          // Unlock the company
          const company = await Company.findByPk(subscription.CompanyId);
          if (company) {
            company.subscriptionStatus = 'Active';
            company.planId = subscription.PlanId;
            await company.save();
          }
        }
      }
      
      // Acknowledge receipt to Razorpay
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(403).json({ error: 'Invalid Signature' });
    }
  } catch (err) {
    console.error('Webhook Verification Error:', err);
    res.status(500).json({ error: 'Webhook Error' });
  }
};

exports.mockSuccessPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const subscription = await CompanySubscription.findOne({ where: { razorpaySubscriptionId: orderId } });
    if (!subscription) return res.status(404).json({ error: 'Subscription order not found' });

    subscription.paymentStatus = 'Paid';
    await subscription.save();

    const company = await Company.findByPk(subscription.CompanyId);
    if (company) {
      company.subscriptionStatus = 'Active';
      company.planId = subscription.PlanId;
      await company.save();
    }

    res.json({ success: true, message: 'Payment successfully mocked and subscription updated!' });
  } catch (err) {
    next(err);
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['price', 'ASC']]
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
};
