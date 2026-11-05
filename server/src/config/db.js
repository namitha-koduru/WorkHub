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
    return true;
  }

  const uri = process.env.MONGODB_URI || ENV.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.log('[Database] MongoDB Atlas Cluster0 detected in configuration.');
    console.log('[Database] To connect and persist data to MongoDB Cluster0:');
    console.log('[Database] Update MONGODB_URI in your .env file with your MongoDB database username and password.');
    return false;
  }

  try {
    console.log(`[Database] Connecting to MongoDB: ${uri.replace(/:([^@]+)@/, ':****@')}...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);

    // Auto-seed initial Vignan Mahotsav dataset if collections are empty
    try {
      const { User } = await import('../models/User.js');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Database] Empty database detected. Seeding initial Vignan Mahotsav 2027 collections...');
        const { seedDatabase } = await import('../utils/seedData.js');
        await seedDatabase();
        console.log('[Database] Initial seeding completed.');
      }
    } catch (seedErr) {
      console.warn('[Database Seed Warning]', seedErr.message);
    }

    return true;
  } catch (error) {
    console.error(`[Database Error] Could not connect to MongoDB (${error.message}).`);
    if (uri.includes('mongodb+srv://')) {
      console.warn(`[Database] Note: Ensure your MongoDB Atlas user credentials and IP access list (0.0.0.0/0) are configured in MongoDB Atlas.`);
    }
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

export const getDBStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null,
});
