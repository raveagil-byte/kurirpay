import { Router } from 'express';
import { getDeliveries, createDelivery, updateDelivery, deleteDelivery, getPublicDeliveries } from '../controllers/deliveryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/public', getPublicDeliveries);

// Protected Routes
router.use(authenticateToken);

router.get('/', getDeliveries);
router.post('/', createDelivery);
router.patch('/:id', updateDelivery);
router.delete('/:id', deleteDelivery);

export default router;
