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
    try {
      const [res] = await this.db.execute(SQL.findUser, [username]);
      return res[0] as User;
    } catch (err) {
      throw new Error(`error finding user: ${err}`);
    }
  }

  async findOrCreateFromProvider(userId: string, provider: string, userType): Promise<User> {
    const username = `${provider}-${userId}`;
    const randomize = (): string =>
      Math.random()
        .toString(36)
        .slice(2);
    const password = randomize() + randomize();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const [userRes] = await this.db.execute(SQL.findUser, [username]);
      if (userRes[0]) return userRes[0] as User;

      const [res] = await this.db.execute(SQL.insertUser, [userType, username, passwordHash]);
      const user: User = {
        id: res['insertId'],
        username,
        userType,
        provider,
      };

      return user;
    } catch (err) {
      throw new Error(`error creating user: ${err}`);
    }
  }
}
