import { config } from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { error } = config();
if (error) {
  throw new Error('⚠️  .env file not found  ⚠️');
}

export default {
  PORT: process.env.PORT || 3100,
};
