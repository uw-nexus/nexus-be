import { config } from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { error } = config();
if (error) {
  throw new Error('⚠️  .env file not found  ⚠️');
}

export const PORT = parseInt(process.env.PORT) || 3100;

export const DB = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT) || 3306,
  USER: process.env.DB_USER || 'root',
  PASS: process.env.DB_PASS || '',
  NAME: process.env.DB_NAME || '',
};

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';

export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
