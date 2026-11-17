import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  // Razorpay fields
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
    sparse: true,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
    default: 'created',
  },
  method: {
    type: String,
    default: '',
  },
  failureReason: {
    type: String,
    default: '',
  },
  // Idempotency: track webhook processing
  webhookProcessed: {
    type: Boolean,
    default: false,
  },
  webhookProcessedAt: Date,
  verifiedAt: Date,
}, {
  timestamps: true,
});

paymentSchema.index({ order: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
