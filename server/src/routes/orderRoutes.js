import { Router } from 'express';
import {
  createOrder, getOrder, getOrders, getOrdersByToken,
  updateOrderStatus, updateOrderItem, getKitchenOrders, getDisplayOrders,
  getOrderTimeline, getOrderStats, getSalesReport, cancelOrder, clearOrder, notifyGuest,
} from '../controllers/orderController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import validateQRToken from '../middleware/validateQR.js';
import { validateBody } from '../middleware/validate.js';
import { orderCreateSchema, orderCancelSchema, orderStatusSchema, orderItemSchema } from '../validators/schemas.js';
import { orderLimiter } from '../middleware/limiters.js';

const router = Router();

const STAFF = ['owner', 'counter'];
const WORKERS = ['owner', 'counter', 'kitchen'];

// Customer routes (QR-validated)
router.post('/token/:token', validateQRToken, orderLimiter, validateBody(orderCreateSchema), createOrder);
router.get('/track/:token', getOrdersByToken);

// Public display board (sanitised payloads only)
router.get('/display', getDisplayOrders);

// Staff boards
router.get('/kitchen', protect, authorize(...WORKERS), getKitchenOrders);
router.get('/stats', protect, authorize(...STAFF), getOrderStats);
router.get('/reports', protect, authorize('owner'), getSalesReport);
router.get('/', protect, authorize(...WORKERS), getOrders);

// Cancellation: a guest may cancel their own fresh order when they present the table
// token; staff may cancel from the console. The old `isStaffOverride` body flag is no
// longer trusted on its own.
router.patch('/:id/cancel', optionalAuth, validateBody(orderCancelSchema), cancelOrder);
router.delete('/:id', protect, authorize(...STAFF), clearOrder);
router.post('/:id/clear', protect, authorize(...STAFF), clearOrder);

router.get('/:id/timeline', protect, authorize(...WORKERS), getOrderTimeline);
router.get('/:id', protect, authorize(...WORKERS), getOrder);
router.patch('/:id/status', protect, authorize(...WORKERS), validateBody(orderStatusSchema), updateOrderStatus);
// Only the counter and the owner may call a guest back to collect a ready ticket.
router.post('/:id/notify', protect, authorize(...STAFF), notifyGuest);
router.patch('/:id/items/:itemId', protect, authorize(...WORKERS), validateBody(orderItemSchema), updateOrderItem);

export default router;
