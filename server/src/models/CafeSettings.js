import mongoose from 'mongoose';

const cafeSettingsSchema = new mongoose.Schema({
  cafeName: {
    type: String,
    default: 'Smart Café',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Scan. Order. Enjoy.',
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  gstNumber: {
    type: String,
    default: '',
  },
  taxConfig: {
    cgstPercent: { type: Number, default: 2.5 },
    sgstPercent: { type: Number, default: 2.5 },
    serviceChargePercent: { type: Number, default: 0 },
    isGstEnabled: { type: Boolean, default: true },
  },
  currency: {
    type: String,
    default: 'INR',
  },
  currencySymbol: {
    type: String,
    default: '₹',
  },
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '22:00' },
  },
  logo: {
    type: String,
    default: '',
  },
  orderPrefix: {
    type: String,
    default: 'ORD',
  },
  nextOrderNumber: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

const defaultCafeSettings = {
  cafeName: 'Smart Café',
  tagline: 'Scan. Order. Enjoy.',
  address: '123 Gourmet St, Foodville',
  phone: '+91 98765 43210',
  email: 'hello@smartcafe.com',
  gstNumber: '29ABCDE1234F1Z5',
  taxConfig: {
    cgstPercent: 2.5,
    sgstPercent: 2.5,
    serviceChargePercent: 0,
    isGstEnabled: true,
  },
  currency: 'INR',
  currencySymbol: '₹',
  operatingHours: {
    open: '08:00',
    close: '22:00',
  },
  logo: '',
  orderPrefix: 'ORD',
  nextOrderNumber: 1,
};

// Ensure only one settings document exists
cafeSettingsSchema.statics.getSettings = async function () {
  if (mongoose.connection.readyState !== 1) {
    return defaultCafeSettings;
  }
  try {
    let settings = await this.findOne();
    if (!settings) {
      settings = await this.create({});
    }
    return settings;
  } catch (err) {
    console.warn('Notice: CafeSettings.getSettings failed, returning defaults:', err.message);
    return defaultCafeSettings;
  }
};

// Atomically increment and return next order number
cafeSettingsSchema.statics.getNextOrderNumber = async function () {
  if (mongoose.connection.readyState !== 1) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${rand}`;
  }
  try {
    const settings = await this.findOneAndUpdate(
      {},
      { $inc: { nextOrderNumber: 1 } },
      { new: false, upsert: true }
    );
    const num = settings?.nextOrderNumber || 1;
    return `${settings?.orderPrefix || 'ORD'}-${String(num).padStart(4, '0')}`;
  } catch (err) {
    console.warn('Notice: getNextOrderNumber failed, using fallback:', err.message);
    return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};

const CafeSettings = mongoose.model('CafeSettings', cafeSettingsSchema);
export default CafeSettings;
