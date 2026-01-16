import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getUnpaidDeliveries, createPayout, getPayments } from '../controllers/paymentController';

const router = express.Router();

router.use(authenticateToken); // Protection

router.get('/unpaid/:courierId', getUnpaidDeliveries);
router.post('/payout', createPayout);
router.get('/', getPayments);

export default router;
