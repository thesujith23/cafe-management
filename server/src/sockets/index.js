import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const readCookie = (header, name) => {
  if (!header) return null;
  for (const part of String(header).split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
};

const STAFF_ROLES = new Set(['owner', 'counter', 'kitchen']);
const ROOM_PATTERN = /^(order|token):[A-Za-z0-9_-]{1,80}$/;

const setupSocket = (io) => {
  // A socket's identity comes from the same session cookie the API uses. Guests stay
  // connected (they need their own order room), but never enter staff rooms.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
      || readCookie(socket.handshake.headers?.cookie, 'token')
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    socket.role = 'guest';
    socket.isStaff = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.id).select('role isActive');
        if (user?.isActive) {
          socket.userId = String(user._id);
          socket.role = user.role;
          socket.isStaff = STAFF_ROLES.has(user.role);
        }
      } catch {
        // Fall through as a guest.
      }
    }

    return next();
  });

  const deny = (socket, room) => {
    logger.warn('socket room denied', { socketId: socket.id, room, role: socket.role });
    socket.emit('room:denied', { room });
  };

  io.on('connection', (socket) => {
    if (socket.isStaff) {
      socket.join('staff');
      if (socket.role === 'kitchen' || socket.role === 'counter' || socket.role === 'owner') socket.join('kitchen');
      if (socket.role === 'owner' || socket.role === 'counter') socket.join('admin');
    }

    // Guest-safe rooms: a table's own order feed and a single order's progress.
    const joinGuestRoom = (room) => {
      if (typeof room !== 'string') return deny(socket, room);
      // Staff screens join their workspace by name; the role decides whether it is theirs.
      if (room === 'kitchen' && socket.isStaff) return socket.join('kitchen');
      if (room === 'admin' && ['owner', 'counter'].includes(socket.role)) return socket.join('admin');
      if (room === 'display') return socket.join('display');
      if (!ROOM_PATTERN.test(room)) return deny(socket, room);
      return socket.join(room);
    };

    socket.on('join:room', joinGuestRoom);

    socket.on('leave:room', (room) => {
      if (typeof room === 'string' && ROOM_PATTERN.test(room)) socket.leave(room);
    });

    socket.on('join:kitchen', () => {
      if (!socket.isStaff) return deny(socket, 'kitchen');
      return socket.join('kitchen');
    });

    socket.on('join:admin', () => {
      if (!['owner', 'counter'].includes(socket.role)) return deny(socket, 'admin');
      return socket.join('admin');
    });

    socket.on('join:order', (orderId) => {
      if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(orderId)) return deny(socket, 'order');
      return socket.join(`order:${orderId}`);
    });

    // The public TV board only carries sanitised tickets; an optional DISPLAY_TOKEN can
    // still lock it down for a venue that wants that.
    socket.on('join:display', (payload = {}) => {
      if (config.displayToken && !socket.isStaff && payload?.key !== config.displayToken) {
        return deny(socket, 'display');
      }
      return socket.join('display');
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export default setupSocket;
