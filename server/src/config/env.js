import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workhub',
  JWT_SECRET: process.env.JWT_SECRET || 'workhub_jwt_super_secret_key_development_only_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'workhub_cookie_secret_key_dev',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

