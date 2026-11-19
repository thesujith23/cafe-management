import { Router } from 'express';
import {
  createPaymentOrder, verifyPayment, handleWebhook, getPaymentKey,
} from '../controllers/paymentController.js';
import { validateBody } from '../middleware/validate.js';
import { paymentCreateSchema, paymentVerifySchema } from '../validators/schemas.js';
import { paymentLimiter } from '../middleware/limiters.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes: a guest has no account, but every call must carry the table token so
// one table cannot drive another table's payments.
router.get('/key', getPaymentKey);
router.post('/create/:orderId', paymentLimiter, optionalAuth, validateBody(paymentCreateSchema), createPaymentOrder);
router.post('/verify', paymentLimiter, optionalAuth, validateBody(paymentVerifySchema), verifyPayment);

// Webhook — uses raw body (configured in app.js)
router.post('/webhook', handleWebhook);

export default router;
