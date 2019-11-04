import { Pool } from 'mysql2/promise';
import { Student } from '../types';

export default class StudentService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudent(user: Student): Promise<void> {
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

  async getProfile(studentId: string): Promise<{ student: Student; majors: string[] }> {
    const query = `
      SELECT 
        USR.username AS username,
        STU.first_name AS firstName,
        STU.last_name AS lastName,
        STU.email AS email,
        STU.dob AS dob,
        SCH.name AS school,
        STA.name AS standing,
        CTY.name AS city,
        MJR.name AS major
      FROM student STU
      JOIN user USR ON USR.user_id = STU.user_id
      JOIN school SCH ON SCH.school_id = STU.school_id
      JOIN standing STA ON STA.standing_id = STU.standing_id
      JOIN city CTY ON CTY.city_id = STU.city_id
      JOIN student_major STU_MJR ON STU_MJR.student_id = STU.student_id
      JOIN major MJR ON MJR.major_id = STU_MJR.major_id
      WHERE student_id = ?;
    `;

    try {
      const [res] = await this.db.execute(query, [studentId]);
      let student: Student;

      if (res[0]) {
        student = {
          username: res[0].username,
          firstName: res[0].firstName,
          lastName: res[0].lastName,
          email: res[0].email,
          dob: new Date(res[0].dob),
          school: res[0].school,
          standing: res[0].standing,
          city: res[0].city,
        };
      }

      const majors = (res as []).reduce((acc, cur) => {
        acc.push(cur['major']);
        return acc;
      }, []);

      return { student, majors };
    } catch (err) {
      console.log(`error fetching student profile: ${err}`);
      return null;
    }
  }

  async updateProfile(studentId: string, student: Student): Promise<void> {
    const schoolStmt = student.school ? `school_id = (SELECT school_id FROM school WHERE name = ?)` : '';
    const standingStmt = student.standing ? `standing_id = (SELECT standing_id FROM standing WHERE name = ?)` : '';
    const cityStmt = student.city ? `city_id = (SELECT city_id FROM city WHERE name = ?)` : '';

    const statement = `
      UPDATE student
      SET ${[schoolStmt, standingStmt, cityStmt].filter(Boolean).join(', ')}
      WHERE studentId = ?;
    `;

    const params = [];

    ['school', 'standing', 'city'].forEach(attr => {
      if (student[attr]) params.push(student[attr]);
    });

    try {
      await this.db.execute(statement, [...params, studentId]);
    } catch (err) {
      console.log(`error updating student profile: ${err}`);
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    const findUserId = `SELECT user_id FROM student WHERE student_id = ?;`;
    const deleteStudent = `DELETE FROM student WHERE student_id = ?;`;
    const deleteUser = `DELETE FROM user WHERE user_id = ?;`;

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const [student] = await conn.execute(findUserId, [studentId]);
      await conn.execute(deleteStudent, [studentId]);
      await conn.execute(deleteUser, [student[0]['user_id']]);
      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error deleting student user: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }
}
