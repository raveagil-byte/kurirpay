import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getAuditLogs } from '../controllers/auditLogController';

const router = express.Router();

// Only authenticated users (Admins preferably) should see logs.
// For now, we assume authenticateToken + frontend checks role.
// In strict enterprise, we'd add authorizeRole('ADMIN') middleware.
router.get('/', authenticateToken, getAuditLogs);

export default router;
