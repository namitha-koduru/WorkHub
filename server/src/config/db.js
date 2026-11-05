import mongoose from 'mongoose';
import dns from 'node:dns';
import { ENV } from './env.js';

// Configure reliable DNS servers for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Graceful fallback
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('[Database] Using existing MongoDB connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    if (ENV.MONGODB_URI.includes('mongodb+srv://')) {
      console.log('[Database] Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/workhub)...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/workhub', {
          serverSelectionTimeoutMS: 3000,
          autoIndex: true,
        });
        isConnected = localConn.connection.readyState === 1;
        console.log(`[Database] Connected to local fallback MongoDB: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`[Database Error] Local MongoDB fallback failed: ${localErr.message}`);
      }
    }
    console.warn(`[Database] Note: Ensure MongoDB is running locally or specify a valid MONGODB_URI in server/.env.`);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

