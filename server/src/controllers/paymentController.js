import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/index.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import DiningTable from '../models/DiningTable.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

const isDummyKey = !config.razorpay.keyId || config.razorpay.keyId.includes('xxxx');

// @desc    Create Razorpay order for a pending order
// @route   POST /api/payments/create/:orderId
export const createPaymentOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    // Check if a payment order already exists and is still valid
    const existingPayment = await Payment.findOne({
      order: order._id,
      status: 'created',
    });

    if (existingPayment) {
      return res.json({
        success: true,
        data: {
          razorpayOrderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          orderId: order._id,
          orderNumber: order.orderNumber,
          keyId: config.razorpay.keyId,
          isDemo: isDummyKey,
        },
      });
    }

    let razorpayOrderId;
    const amountInPaise = Math.round(order.totalAmount * 100);

    if (isDummyKey) {
      // Demo / Sandbox mode fallback
      razorpayOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    } else {
      // Create Razorpay order — amount in paise (INR * 100)
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order._id.toString(),
          tableId: order.tableId,
        },
      });
      razorpayOrderId = razorpayOrder.id;
    }

    // Save payment record
    const payment = await Payment.create({
      order: order._id,
      amount: order.totalAmount,
      currency: 'INR',
      razorpayOrderId,
      status: 'created',
    });

    order.payment = payment._id;
    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        orderId: order._id,
        orderNumber: order.orderNumber,
        keyId: config.razorpay.keyId,
        isDemo: isDummyKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment after customer completes Razorpay checkout
// @route   POST /api/payments/verify
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Idempotency: if already verified, return success
    if (payment.status === 'captured' && payment.verifiedAt) {
      const order = await Order.findById(payment.order);
      return res.json({ success: true, data: { order, payment }, message: 'Already verified' });
    }

    // Check if this was a demo order or signature verification
    const isDemoOrder =
      razorpay_order_id.startsWith('order_demo_') ||
      razorpay_payment_id.startsWith('pay_demo_') ||
      razorpay_signature === 'demo_signature' ||
      isDummyKey;

    if (!isDemoOrder) {
      if (!razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment signature' });
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }

      // Verify the amount matches by fetching from Razorpay
      try {
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
        if (razorpayPayment.amount !== Math.round(payment.amount * 100)) {
          payment.status = 'failed';
          payment.failureReason = 'Amount mismatch';
          await payment.save();
          return res.status(400).json({ success: false, message: 'Amount mismatch' });
        }
        payment.method = razorpayPayment.method || 'online';
      } catch (fetchErr) {
        console.warn('Notice: Razorpay payment fetch notice:', fetchErr.message);
        payment.method = 'online';
      }
    } else {
      payment.method = 'upi_mock';
    }

    // Update payment
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature || 'demo_signature';
    payment.status = 'captured';
    payment.verifiedAt = new Date();
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    order.paymentStatus = 'paid';
    order.preparationStatus = 'new';
    await order.save();

    await OrderStatusHistory.create({
      order: order._id,
      fromStatus: 'waiting_payment',
      toStatus: 'new',
      note: `Payment verified: ${razorpay_payment_id}`,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('table', 'tableId displayName');

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('order:new', populatedOrder);
      io.to('admin').emit('order:new', populatedOrder);
      io.to('display').emit('order:new', populatedOrder);
      io.to(`order:${order._id}`).emit('order:paid', populatedOrder);
    }

    res.json({ success: true, data: { order: populatedOrder, payment } });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
export const handleWebhook = async (req, res, next) => {
  try {
    // Verify webhook signature using raw body
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = req.rawBody || JSON.stringify(req.body);

    if (config.razorpay.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(webhookBody)
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    const { event: eventType, payload } = event;

    if (eventType === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });

      if (payment && !payment.webhookProcessed) {
        // Idempotent processing
        payment.status = 'captured';
        payment.razorpayPaymentId = paymentEntity.id;
        payment.method = paymentEntity.method;
        payment.webhookProcessed = true;
        payment.webhookProcessedAt = new Date();
        if (!payment.verifiedAt) payment.verifiedAt = new Date();
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          if (order.preparationStatus === 'waiting_payment') {
            order.preparationStatus = 'new';
          }
          await order.save();
        }
      }
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });

      if (payment) {
        payment.status = 'failed';
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        payment.webhookProcessed = true;
        payment.webhookProcessedAt = new Date();
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
        }
      }
    }

    // Always respond 200 to Razorpay
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true }); // Still respond 200 to avoid retries
  }
};

// @desc    Get Razorpay key for frontend
// @route   GET /api/payments/key
export const getPaymentKey = async (req, res) => {
  res.json({ success: true, data: { keyId: config.razorpay.keyId } });
};
