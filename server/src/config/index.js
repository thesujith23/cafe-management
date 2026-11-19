import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from the server directory regardless of the caller's cwd. dotenv does not
// overwrite variables that already exist in the process environment, so a shell that
// exports PORT=0 (or an empty PORT) still reaches us here.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// PORT arrived as the string "0" in this environment, and "0" is truthy, so `|| 5000`
// never fired and the server tried to bind port 0. Treat anything that is not a real,
// positive port number as unset.
const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
};

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

// A comma separated allowlist lets the same API serve the app on a custom domain and
// the platform preview URL without opening CORS to the world.
const allowedOrigins = (process.env.CLIENT_URLS || clientUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';
const cookieSecret = process.env.COOKIE_SECRET || 'fallback_cookie_secret';
const qrTokenSecret = process.env.QR_TOKEN_SECRET || 'fallback_qr_secret';
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management';

// Production runs must not fall back to a secret that is printed in this repository.
// Failing at boot is louder and safer than minting forgeable sessions.
if (isProduction) {
  const missing = [
    ['JWT_SECRET', jwtSecret],
    ['COOKIE_SECRET', cookieSecret],
    ['QR_TOKEN_SECRET', qrTokenSecret],
    ['MONGODB_URI', mongoUri],
  ].filter(([, value]) => !value || /fallback_|your_.*_here|change_in_production|x{4}/i.test(String(value)));

  if (missing.length) {
    throw new Error(
      `Refusing to start in production without real values for: ${missing.map(([key]) => key).join(', ')}`,
    );
  }
}

if (!isProduction) {
  if (jwtSecret === 'fallback_jwt_secret') {
    console.warn('⚠️  JWT_SECRET is not set — using the development fallback. Never deploy like this.');
  }
}

// Render/Railway/Fly terminate TLS in front of the app. Trusting one proxy hop keeps
// request IPs (rate limits) and req.secure (cookies) correct.
const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return isProduction ? 1 : false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
};

const config = {
  port: parsePort(process.env.PORT, 5000),
  nodeEnv,
  isProduction,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  clientUrl,
  allowedOrigins,
  // What a phone should open. PUBLIC_CLIENT_URL wins when set (a tunnel, a real domain).
  publicClientUrl: process.env.PUBLIC_CLIENT_URL
    || (isLoopback && lan ? clientUrl.replace(/\/\/(localhost|127\.0\.0\.1)/, `//${lan}`) : clientUrl),
  cookieSecret,
  qrTokenSecret,
  cookie: {
    maxAgeMs: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  },
  // Optional shared key for a public TV board. When unset the display room stays open
  // (it only ever carries sanitised, name-free ticket data).
  displayToken: process.env.DISPLAY_TOKEN || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
};

export default config;
