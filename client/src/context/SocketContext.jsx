import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  useEffect(() => {
    // Connect directly to backend to eliminate Vite intermediary proxy drops
    const socketUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (typeof window !== 'undefined' && window.location.port === '5173'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : '/');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection notice:', err.message);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomName) => {
    if (socketRef.current && roomName) {
      socketRef.current.emit('join:room', roomName);
    }
  };

  const leaveRoom = (roomName) => {
    if (socketRef.current && roomName) {
      socketRef.current.emit('leave:room', roomName);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
