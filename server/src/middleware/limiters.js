import rateLimit from 'express-rate-limit';

const message = (text) => ({ success: false, message: text });

// Browsing the menu is a handful of reads per screen. The old 200 requests / 15 min
// blanket limit was low enough that a normal menu visit could trip it.
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many requests. Give it a minute and try again.'),
});

// Login is the one endpoint worth guessing at, so it gets its own budget.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Too many sign-in attempts. Try again in a few minutes.'),
});

// Guests add a few dishes at a time; a script shouldn't be able to flood the kitchen.
export const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('That is a lot of orders at once. Please wait a moment.'),
});

export const virtualTableLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many virtual table sessions. Please try again later.'),
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many payment attempts. Please wait a moment.'),
});

// Chat spends the owner's API credits, so it gets the tightest per-visitor budget.
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('You have asked quite a few questions. Try again a little later.'),
});

// Speech costs characters on top of the chat reply it reads out, so it gets its own,
// slightly wider budget rather than doubling the chat limit.
export const speechLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('That is a lot of talking. Give the fox a moment.'),
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many changes at once. Please slow down.'),
});

