class BaseProvider {
  constructor(config) {
    this.config = config; // Already decrypted credentials
  }

  /**
   * Generates a hosted payment gateway checkout link for a customer invoice
   * @param {Object} invoice Sequelize model instance
   * @param {Object} company Sequelize model instance
   * @returns {Promise<Object>} { paymentLinkId, paymentLink }
   */
  async createPaymentLink(invoice, company) {
    throw new Error('createPaymentLink not implemented');
  }

  /**
   * Cryptographically validates webhook signatures from the gateway
   * @param {String} rawBody Raw request body string
   * @param {String} signature Header signature
   * @param {String} webhookSecret Shared secret
   * @returns {Boolean}
   */
  verifyWebhook(rawBody, signature, webhookSecret) {
    throw new Error('verifyWebhook not implemented');
  }

  /**
   * Retrieves active details from the provider's transaction log
   * @param {String} paymentId Gateway transaction id
   * @returns {Promise<Object>} Raw response details
   */
  async getPaymentDetails(paymentId) {
    throw new Error('getPaymentDetails not implemented');
  }

  /**
   * Deactivates/expires an active payment link
   * @param {String} paymentLinkId
   * @returns {Promise<Boolean>}
   */
  async expirePaymentLink(paymentLinkId) {
    throw new Error('expirePaymentLink not implemented');
  }
}

module.exports = BaseProvider;
