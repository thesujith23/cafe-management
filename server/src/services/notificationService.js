import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// The payload every guest screen receives. The socket id doubles as a dedupe key when
// the database is unavailable and no Notification row could be written.
const readyPayload = (order, notification) => ({
  _id: notification?._id ? String(notification._id) : `ready-${order._id}-${Date.now()}`,
  type: 'order_ready',
  title: `Order ${order.orderNumber} is ready`,
  message: `Please collect order ${order.orderNumber} at the counter.`,
  orderId: String(order._id),
  orderNumber: order.orderNumber,
  createdAt: notification?.createdAt || new Date().toISOString(),
});

/**
 * Called once when an order reaches `ready`: records the notification for the guest and
 * the counter, then rings the guest's open screen. The socket event is emitted even if
 * the row could not be written, so a database blip never silences the pickup call.
 */
export const notifyOrderReady = async (io, order) => {
  if (!order?._id) return null;

  let notification = null;
  if (mongoose.connection.readyState === 1) {
    try {
      notification = await Notification.create({
        type: 'order_ready',
        title: `Order ${order.orderNumber} is ready`,
        message: `Please collect order ${order.orderNumber} at the counter.`,
        order: order._id,
        targetRoles: ['customer', 'counter'],
      });
    } catch (error) {
      console.warn('Notice: could not record the ready notification:', error.message);
    }
  }

  const payload = readyPayload(order, notification);
  if (io) {
    io.to(`order:${order._id}`).emit('notification:new', payload);
    io.to('admin').emit('notification:new', payload);
  }

  return payload;
};

export default notifyOrderReady;
