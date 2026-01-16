import { Router } from 'express';
import { getDeliveries, createDelivery, updateDelivery, deleteDelivery } from '../controllers/deliveryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken); // Protect all delivery routes

router.get('/', getDeliveries);
router.post('/', createDelivery);
router.patch('/:id', updateDelivery);
router.delete('/:id', deleteDelivery);

export default router;
