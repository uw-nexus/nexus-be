import { Pool } from 'mysql2/promise';
import { User } from '../../types';
import SQL from './sql';
import bcrypt from 'bcrypt';

export default class UserService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createUser(user: User, userType: string): Promise<string> {
    const { username, password } = user;

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const [res] = await this.db.execute(SQL.insertUser, [userType, username, passwordHash]);
      const userId = res['insertId'];
      return userId;
    } catch (err) {
      throw new Error(`error creating user: ${err}`);
    }
  }

  async findUser(username: string): Promise<User> {
    try {
      const [res] = await this.db.execute(SQL.findUser, [username]);
      let user: User;

      if (res[0]) {
        user = {
          username: res[0].username,
          password: res[0].password,
          userType: res[0].userType,
        };
      }

      return user;
    } catch (err) {
      throw new Error(`error finding user: ${err}`);
    }
  }
}
