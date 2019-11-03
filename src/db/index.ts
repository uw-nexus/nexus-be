import mysql from 'mysql2';
import config from '../config';

const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASS,
  database: config.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export default {
  pool: pool,
  promisePool: pool.promise(),
};
