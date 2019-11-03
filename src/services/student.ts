import { Pool } from 'mysql2/promise';
import { Student } from '../types';

export default class StudentService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createUser(user: Student): Promise<void> {
    const insertUser = `
      INSERT INTO user
      VALUES (null, (SELECT user_type_id FROM user_type WHERE name = 'Student'), ?, ?);
    `;

    const insertStudent = `
      INSERT INTO student
      VALUES (
        null, ?, ?, ?, ?, ?, 
        (SELECT school_id FROM school WHERE name = ?),
        (SELECT standing_id FROM standing WHERE name = ?),
        (SELECT city_id FROM city WHERE name = ?),
        CURDATE()
      );
    `;

    const userParams = [user.username, user.password];
    const userDOB = user.dob.toISOString().split('T')[0];
    const studentParams = [user.firstName, user.lastName, user.email, userDOB, user.school, user.standing, user.city];

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const [userRes] = await conn.execute(insertUser, userParams);
      await conn.execute(insertStudent, [userRes['insertId'], ...studentParams]);
      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error creating student user: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }
}
