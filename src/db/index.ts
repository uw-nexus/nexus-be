import mysql from 'mysql2';
import { DB } from '../config';

const pool = mysql.createPool({
  host: DB.HOST,
  port: DB.PORT,
  socketPath: DB.SOCKET ? `/cloudsql/${DB.SOCKET}` : null,
  user: DB.USER,
  password: DB.PASS,
  database: DB.NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export default {
  pool: pool,
  promisePool: pool.promise(),
};
