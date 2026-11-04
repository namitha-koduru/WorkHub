import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';
import mongoose from 'mongoose';

const run = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('[Seed Runner] Done! Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Runner Error]', err);
    process.exit(1);
  }
};

run();

