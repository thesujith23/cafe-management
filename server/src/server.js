import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/index.js';
import connectDB from './config/database.js';
import setupSocket from './sockets/index.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setupSocket(io);

  // Make io accessible in routes via req.app.get('io')
  app.set('io', io);

  server.listen(config.port, () => {
    console.log(`\n🚀 Smart Café Server running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   API: http://localhost:${config.port}/api`);
    console.log(`   Client: ${config.clientUrl}\n`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
