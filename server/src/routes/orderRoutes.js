import { Router } from 'express';
import {
  createOrder, getOrder, getOrders, getOrdersByToken,
  updateOrderStatus, updateOrderItem, getKitchenOrders, getDisplayOrders,
  getOrderTimeline, getOrderStats, getSalesReport, cancelOrder, clearOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import validateQRToken from '../middleware/validateQR.js';

const router = Router();

// Customer routes (QR-validated)
router.post('/token/:token', validateQRToken, createOrder);
router.get('/track/:token', getOrdersByToken);

// Order cancellation (Customer 1-minute window / Staff override)
router.patch('/:id/cancel', cancelOrder);
router.delete('/:id', clearOrder);
router.post('/:id/clear', clearOrder);

// Public display
router.get('/display', getDisplayOrders);

// Kitchen routes
router.get('/kitchen', getKitchenOrders);

// Admin & Order routes
router.get('/stats', protect, authorize('owner', 'counter'), getOrderStats);
router.get('/reports', protect, authorize('owner'), getSalesReport);
router.get('/', getOrders);
router.get('/:id/timeline', getOrderTimeline);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/items/:itemId', updateOrderItem);

export default router;
