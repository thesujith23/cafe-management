import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  fromStatus: {
    type: String,
    required: true,
  },
  toStatus: {
    type: String,
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
export default OrderStatusHistory;
