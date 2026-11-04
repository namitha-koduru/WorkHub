import mongoose from 'mongoose';
import { ENV } from './env.js';

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
    console.warn(`[Database] Note: Ensure MongoDB is running locally or specify a valid MONGODB_URI in server/.env.`);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

