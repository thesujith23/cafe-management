import mongoose from 'mongoose';

const diningTableSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    default: 4,
    min: 1,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  currentQrToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRToken',
  },
  activeOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  currentCustomer: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    guests: { type: Number, default: 1 },
    checkedInAt: { type: Date },
  },
  reservation: {
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    guests: { type: Number, default: 1 },
    startsAt: { type: Date },
    notes: { type: String, default: '' },
    bookedAt: { type: Date },
  },
}, {
  timestamps: true,
});

diningTableSchema.index({ status: 1 });

const DiningTable = mongoose.model('DiningTable', diningTableSchema);
export default DiningTable;
