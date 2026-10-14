const AuditLog = require('../models/AuditLog');

/**
 * logAudit
 * --------
 * Records an immutable audit log entry in MongoDB for compliance and security tracking.
 * Failures to write audit logs are caught and logged so primary business flows are not blocked.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} [params.actorId] - User ID performing the action
 * @param {string} [params.actorRole] - Role of the actor ('student'|'lecturer'|'admin'|'system')
 * @param {string} params.action - Structured action name (e.g. 'ATTENDANCE_CHECKIN_FAILED')
 * @param {string} [params.targetType] - Entity affected ('AttendanceRecord'|'Session'|'Course'|etc.)
 * @param {string|mongoose.Types.ObjectId} [params.targetId] - ID of affected entity
 * @param {string} [params.result] - Outcome ('success' | 'failure')
 * @param {object} [params.metadata] - Additional contextual details (passwords/tokens stripped)
 */
const logAudit = async ({
  actorId = null,
  actorRole = 'system',
  action,
  targetType = null,
  targetId = null,
  result = 'success',
  metadata = {},
}) => {
  try {
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.token;

    await AuditLog.create({
      actorId: actorId || null,
      actorRole: actorRole || 'system',
      action,
      targetType: targetType || null,
      targetId: targetId ? targetId.toString() : null,
      result,
      metadata: safeMetadata,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit record:', err.message);
  }
};

module.exports = logAudit;
