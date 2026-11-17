import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['order_new', 'order_paid', 'order_ready', 'order_cancelled', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  targetRoles: [{
    type: String,
    enum: ['owner', 'counter', 'kitchen', 'display', 'customer'],
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1, targetRoles: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
