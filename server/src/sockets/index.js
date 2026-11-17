import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const setupSocket = (io) => {
  // Socket connection middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    const room = socket.handshake.query?.room;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.userId = decoded.id;
        socket.isStaff = true;
      } catch (err) {
        // Continue as guest
        socket.isStaff = false;
      }
    }

    if (room) {
      socket.initialRoom = room;
    }

    return next();
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    if (socket.initialRoom) {
      socket.join(socket.initialRoom);
    }

    // Generic room join/leave
    socket.on('join:room', (roomName) => {
      if (roomName) {
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    socket.on('leave:room', (roomName) => {
      if (roomName) {
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      }
    });

    // Dedicated room aliases
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
    });

    socket.on('join:admin', () => {
      socket.join('admin');
    });

    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('join:display', () => {
      socket.join('display');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default setupSocket;
