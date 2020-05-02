import { Pool } from 'mysql2/promise';
import { User } from '../../types';
import * as SQL from './sql';
import bcrypt from 'bcrypt';

export default class UserService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createUser(user: User): Promise<string> {
    const { username, password, userType } = user;

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
    const [res] = await this.db.execute(SQL.findUser, [username]);
    if (res[0]) {
      return res[0] as User;
    } else {
      throw new Error(`user not found`);
    }
  }

  async resetUserPassword(username: string, password: string): Promise<void> {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      await this.db.execute(SQL.resetUserPassword, [passwordHash, username]);
    } catch (err) {
      throw new Error(`error changing user password: ${err}`);
    }
  }

  generateRandomPassword(): string {
    const randomize = (): string =>
      Math.random()
        .toString(36)
        .slice(2);

    return randomize() + randomize();
  }
}
