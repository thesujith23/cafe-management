import mongoose from 'mongoose';
import CafeSettings from '../models/CafeSettings.js';

const defaultSettings = {
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

// @desc    Get cafe settings
// @route   GET /api/settings
export const getSettings = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: defaultSettings, isFallback: true });
  }

  try {
    const settings = await CafeSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.warn('Notice: getSettings failed, using fallback:', error.message);
    res.json({ success: true, data: defaultSettings, isFallback: true });
  }
};

// @desc    Update cafe settings
// @route   PUT /api/settings
export const updateSettings = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently connecting or unavailable. Please try again shortly.',
    });
  }

  try {
    let settings = await CafeSettings.findOne();
    if (!settings) {
      settings = await CafeSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
