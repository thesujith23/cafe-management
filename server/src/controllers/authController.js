import User from '../models/User.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import { recordAudit } from '../utils/audit.js';

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MS = 15 * 60 * 1000;

// @desc    Register a new staff user
// @route   POST /api/auth/register
// @access  Private (Owner only)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    await AuditLog.create({
      action: 'user_created',
      performedBy: req.user?._id,
      targetModel: 'User',
      targetId: user._id,
      details: { name, email, role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts on this account. Try again in a few minutes.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        user.failedLoginAttempts = 0;
        recordAudit(req, 'account_locked', {
          targetModel: 'User',
          targetId: user._id,
          details: { email: user.email },
        });
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // The session lives in the httpOnly cookie; the body carries the profile only.
    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

// @desc    Get all staff users
// @route   GET /api/auth/users
// @access  Private (Owner)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/auth/users/:id
// @access  Private (Owner)
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    recordAudit(req, 'user_updated', {
      targetModel: 'User',
      targetId: user._id,
      details: { name, email, role, isActive },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
