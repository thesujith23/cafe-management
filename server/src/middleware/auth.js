import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';

const readToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers.authorization?.startsWith('Bearer')) return req.headers.authorization.split(' ')[1];
  return null;
};

// Protect routes - verify JWT from cookie or Authorization header
export const protect = async (req, res, next) => {
  try {
    const token = readToken(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

// Identify a signed-in staff member when there is one, but never reject a guest.
// Public routes that behave differently for staff (a guest cancelling their own order)
// use this instead of trusting a flag in the request body.
export const optionalAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) req.user = user;
  } catch {
    // An invalid cookie is simply "not signed in" for these routes.
  }
  return next();
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

// Generate JWT and set cookie
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAgeMs,
    path: '/',
  });
};

export const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  });
};
