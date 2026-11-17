import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  razorpayRefundId: {
    type: String,
    unique: true,
    sparse: true,
  },
  reason: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['initiated', 'processed', 'failed'],
    default: 'initiated',
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
