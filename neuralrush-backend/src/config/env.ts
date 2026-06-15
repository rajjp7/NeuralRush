import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret_key',
};

if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  console.warn('⚠️ WARNING: JWT_SECRET is not set in production environment!');
}