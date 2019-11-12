import { config } from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { error } = config();
if (error) {
  throw new Error('⚠️  .env file not found  ⚠️');
}

export default {
  PORT: parseInt(process.env.PORT) || 3100,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASS: process.env.DB_PASS || '',
  DB_NAME: process.env.DB_NAME || '',
  JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret',
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
};
