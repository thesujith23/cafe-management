// Remove orders that are still "active" long after they were placed — the seeded
// leftovers that make the live board look broken. Dry run by default.
//
//   node scripts/prune-stale-orders.mjs            (list)
//   node scripts/prune-stale-orders.mjs --apply    (delete)
//   node scripts/prune-stale-orders.mjs --days 3 --apply

import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';

const ACTIVE = ['waiting_payment', 'new', 'accepted', 'preparing', 'ready'];
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const days = Number(arg('--days', 7));
const apply = process.argv.includes('--apply');
const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');

const stale = await Order.find({ preparationStatus: { $in: ACTIVE }, createdAt: { $lt: cutoff } })
  .select('orderNumber preparationStatus createdAt totalAmount')
  .sort({ createdAt: 1 })
  .lean();

console.log(`${stale.length} active order(s) older than ${days} day(s)`);
stale.slice(0, 40).forEach((order) => {
  console.log(`  ${order.orderNumber}  ${order.preparationStatus.padEnd(10)}  ${order.createdAt.toISOString().slice(0, 10)}`);
});
if (stale.length > 40) console.log(`  …and ${stale.length - 40} more`);

if (apply && stale.length) {
  const result = await Order.deleteMany({ _id: { $in: stale.map((order) => order._id) } });
  console.log(`deleted ${result.deletedCount}`);
} else if (!apply) {
  console.log('Dry run — add --apply to delete them.');
}

await mongoose.disconnect();
