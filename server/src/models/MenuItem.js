import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
}, { _id: true });

const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: [true, 'Category is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  sizes: [sizeSchema],
  addons: [addonSchema],
  customizations: [{
    name: { type: String, trim: true },
    options: [{ type: String, trim: true }],
  }],
  isVeg: {
    type: Boolean,
    default: true,
  },
  allergens: [{
    type: String,
    trim: true,
  }],
  ingredients: [{
    type: String,
    trim: true,
  }],
  prepTime: {
    type: Number,
    default: 15,
    min: 1,
  },
  taxable: {
    type: Boolean,
    default: true,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
