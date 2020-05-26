import { config } from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { error } = config();
if (error) {
  throw new Error('⚠️  .env file not found  ⚠️');
}

export const DOMAIN = process.env.DOMAIN || 'localhost';
export const FE_ADDR = process.env.FE_ADDR || 'http://localhost:3000';
export const BE_ADDR = process.env.BE_ADDR || 'http://localhost:3100';

export const PORT = parseInt(process.env.PORT) || 3100;

export const DB = {
  SOCKET: process.env.DB_SOCKET || null,
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT) || 3306,
  USER: process.env.DB_USER || 'root',
  PASS: process.env.DB_PASS || null,
  NAME: process.env.DB_NAME || null,
};

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';

export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

export const EMAIL_ADDR = process.env.EMAIL_ADDR || '';
export const EMAIL_NAME = process.env.EMAIL_NAME || '';

export const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || '';
export const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || '';
