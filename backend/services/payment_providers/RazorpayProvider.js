const BaseProvider = require('./BaseProvider');
const crypto = require('crypto');

class RazorpayProvider extends BaseProvider {
  constructor(config) {
    super(config);
  }

  getHeaders() {
    const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString('base64');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    };
  }

  async createPaymentLink(invoice, company) {
    // Amount must be in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parseFloat(invoice.balance || invoice.totalAmount) * 100);
    const invoiceNum = invoice.invoiceNumber;
    
    // Callback goes back to the public secure share checkout view
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const callbackUrl = `${clientUrl}/shared/invoice/${invoice.shareToken}?payment=success`;

    const body = {
      amount: amountInPaise,
      currency: invoice.CustomerLedger?.currency || 'INR',
      accept_partial: false,
      reference_id: invoice.id,
      description: `Payment for Invoice ${invoiceNum} - ${company.name}`,
      customer: {
        name: invoice.CustomerLedger?.displayName || invoice.CustomerLedger?.name || 'Customer',
        email: invoice.CustomerLedger?.email || 'customer@example.com',
        contact: invoice.CustomerLedger?.workPhone || invoice.CustomerLedger?.mobile || '9999999999'
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: false,
      notes: {
        invoiceId: invoice.id,
        companyId: company.id
      },
      callback_url: callbackUrl,
      callback_method: 'get'
    };

    try {
      const response = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.description || `Razorpay Error: ${response.statusText}`);
      }

      return {
        paymentLinkId: data.id,
        paymentLink: data.short_url
      };
    } catch (err) {
      console.error('Razorpay Link Creation Failed:', err);
      throw err;
    }
  }

  verifyWebhook(rawBody, signature, webhookSecret) {
    if (!signature) return false;
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret || this.config.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }

  async getPaymentDetails(paymentId) {
    try {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.description || `Razorpay payment details fetch failed: ${response.statusText}`);
      }
      return data;
    } catch (err) {
      console.error('Razorpay getPaymentDetails failed:', err);
      throw err;
    }
  }

  async expirePaymentLink(paymentLinkId) {
    try {
      const response = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn('Razorpay expire link details:', data.error?.description);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Razorpay expire link error:', err);
      return false;
    }
  }
}

module.exports = RazorpayProvider;
