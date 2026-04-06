const { AuditLog } = require('../models');

/**
 * Centrally manages the creation of audit logs across the application.
 */
class AuditService {
  /**
   * Logs a critical action to the AuditLog table.
   * 
   * @param {Object} params
   * @param {string} params.action - The action name (e.g., 'CREATE_VOUCHER')
   * @param {string} [params.tableName] - The name of the table affected
   * @param {string|number} [params.recordId] - The ID of the affected record
   * @param {Object} [params.oldData] - Data before modification
   * @param {Object} [params.newData] - Data after modification
   * @param {string} [params.companyId] - The ID of the company (tenant context)
   * @param {string} [params.userId] - The ID of the user who performed the action 
   * @param {Object} [params.req] - Express request object to capture IP/UserAgent
   */
  static async log({ 
    action, 
    tableName, 
    recordId, 
    oldData, 
    newData, 
    companyId, 
    userId, 
    req 
  }) {
    try {
      await AuditLog.create({
        action,
        tableName,
        recordId: recordId?.toString(),
        oldData: oldData || null,
        newData: newData || null,
        CompanyId: companyId,
        UserId: userId,
        ipAddress: req?.ip || req?.headers['x-forwarded-for'] || null,
        userAgent: req?.headers['user-agent'] || null
      });
    } catch (err) {
      // We don't want to crash the main request if logging fails, but we should log the error
      console.error('[AuditService Error]:', err.message);
    }
  }
}

module.exports = AuditService;
