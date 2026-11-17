import dns from 'dns';
import mongoose from 'mongoose';
import config from './index.js';

let isConnected = false;

const connectDB = async () => {
  try {
    // Fix Windows/ISP local DNS SRV query failures for mongodb+srv URLs
    if (config.mongoUri && config.mongoUri.includes('mongodb+srv')) {
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
      } catch (dnsErr) {
        console.warn('DNS server adjustment notice:', dnsErr.message);
      }
    }

    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);

    try {
      const DiningTable = (await import('../models/DiningTable.js')).default;
      const count = await DiningTable.countDocuments();
      if (count === 0) {
        console.log('🌱 Database is empty. Seeding initial data...');
        const { runSeed } = await import('../seed.js');
        await runSeed(false);
      }
    } catch (seedErr) {
      console.warn('Auto-seed check notice:', seedErr.message);
    }

    return conn;
  } catch (error) {
    console.warn(`⚠️ Warning: Could not connect to MongoDB (${error.message}).`);
    console.warn(`💡 Please ensure MongoDB is running at ${config.mongoUri} or set MONGODB_URI in server/.env`);
    return null;
  }
};

export { isConnected };
export default connectDB;
