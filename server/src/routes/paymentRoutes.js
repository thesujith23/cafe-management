import { Router } from 'express';
import {
  createPaymentOrder, verifyPayment, handleWebhook, getPaymentKey,
} from '../controllers/paymentController.js';

const router = Router();

// Public routes
router.get('/key', getPaymentKey);
router.post('/create/:orderId', createPaymentOrder);
router.post('/verify', verifyPayment);

// Webhook — uses raw body (configured in app.js)
router.post('/webhook', handleWebhook);

export default router;
