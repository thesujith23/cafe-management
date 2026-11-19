import AuditLog from '../models/AuditLog.js';
import logger from './logger.js';

// Staff actions that change money, tables or staff accounts are recorded. Auditing
// must never fail the request it describes.
export const recordAudit = (req, action, { targetModel = '', targetId, details = {} } = {}) => {
  AuditLog.create({
    action,
    performedBy: req.user?._id,
    targetModel,
    targetId: targetId || undefined,
    details,
    ipAddress: req.ip || '',
  }).catch((error) => logger.warn('audit write failed', { action, error: error.message }));
};

export default recordAudit;
