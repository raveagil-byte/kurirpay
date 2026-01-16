import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public get (for login page app name) or protected? Authenticated safer.
// But Login page needs AppName. Let's make get public for now or separate public config.
// For simplicity, allowed public read, protected write.
router.get('/', getSettings);
router.put('/', authenticateToken, updateSettings);

export default router;
