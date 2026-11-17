import dotenv from 'dotenv';
import os from 'os';
dotenv.config();

// A phone scanning a QR cannot resolve "localhost" — that is the phone itself. When the
// configured client URL is loopback, advertise this machine's LAN address instead.
const lanAddress = () => {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
};

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/.test(clientUrl);
const lan = lanAddress();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management',
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  clientUrl,
  // What a phone should open. PUBLIC_CLIENT_URL wins when set (a tunnel, a real domain).
  publicClientUrl: process.env.PUBLIC_CLIENT_URL
    || (isLoopback && lan ? clientUrl.replace(/\/\/(localhost|127\.0\.0\.1)/, `//${lan}`) : clientUrl),
  cookieSecret: process.env.COOKIE_SECRET || 'fallback_cookie_secret',
  qrTokenSecret: process.env.QR_TOKEN_SECRET || 'fallback_qr_secret',
};

export default config;
