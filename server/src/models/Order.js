import mongoose from 'mongoose';

// Embedded snapshot of an ordered item. Prices and names are frozen at order time;
// the only field that still changes is the kitchen's tick.
const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: false,
  },
  // Snapshot fields (preserved even if menu changes later)
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  selectedSize: {
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
  },
  selectedAddons: [{
    name: { type: String },
    price: { type: Number, default: 0 },
  }],
  customizations: [{
    name: { type: String },
    selected: { type: String },
  }],
  specialInstructions: { type: String, default: '' },
  itemTotal: { type: Number, required: true, min: 0 },
  isVeg: { type: Boolean, default: true },
  prepTime: { type: Number, default: 15 },
  // Set when the kitchen ticks this dish off the ticket.
  isDone: { type: Boolean, default: false },
  doneAt: Date,
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningTable',
    required: false,
  },
  tableId: {
    type: String,
    required: true,
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxDetails: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  preparationStatus: {
    type: String,
    enum: ['waiting_payment', 'new', 'confirmed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'waiting_payment',
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  customerNotes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  customerName: {
    type: String,
    default: '',
    trim: true,
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true,
  },
  acceptedAt: Date,
  confirmedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  estimatedPrepTime: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

orderSchema.index({ table: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, preparationStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
