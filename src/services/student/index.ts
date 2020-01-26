import { Pool, RowDataPacket } from 'mysql2/promise';
import { Student, StudentProfile } from '../../types';
import * as SQL from './sql';

export default class StudentService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudent(username: string, profile: StudentProfile): Promise<string> {
    const { firstName, lastName, email } = profile;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      const studentParams = [username, firstName, lastName, email];

      const [studentRes] = await conn.execute(SQL.insertStudent, studentParams);
      const studentId = studentRes['insertId'];

      await conn.commit();
      conn.release();

      return studentId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async getStudentId(username: string): Promise<string> {
    const [res] = await this.db.execute(SQL.getStudentId, [username]);
    if (!res[0]) {
      throw new Error('Student not found.');
    }

    return res[0].studentId;
  }

  async getStudentProfile(username: string, studentId: string): Promise<StudentProfile> {
    const [res] = await this.db.execute(SQL.getStudentProfile, [studentId]);
    let profile: StudentProfile;

    if (res[0]) {
      profile = {
        user: { username },
        firstName: res[0].firstName,
        lastName: res[0].lastName,
        email: res[0].email,
        dob: new Date(res[0].dob),
        school: res[0].school,
        standing: res[0].standing,
        location: {
          city: res[0].city,
          state: res[0].state,
          country: res[0].country,
        },
      };
    }

    return profile;
  }

  async getStudent(username: string): Promise<Student> {
    const studentId = await this.getStudentId(username);
    const studentProfile = await this.getStudentProfile(username, studentId);
    if (!studentProfile) return null;

    const [majorsRes] = await this.db.execute(SQL.getStudentMajors, [studentId]);
    const [skillsRes] = await this.db.execute(SQL.getStudentSkills, [studentId]);

    const student = {
      profile: studentProfile,
      majors: (majorsRes as RowDataPacket[]).map(row => row.major),
      skills: (skillsRes as RowDataPacket[]).map(row => row.skill),
    };

    return student;
  }

  async updateStudent(username: string, student: Student): Promise<void> {
    const { profile, majors, skills } = student;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const studentId = await this.getStudentId(username);

      const profileParams = [
        profile.school,
        profile.standing,
        profile.location.city,
        profile.location.state,
        profile.location.country,
      ].filter(Boolean);

      await conn.execute(SQL.updateStudentProfile(profile), [...profileParams, studentId]);
      await conn.execute(SQL.deleteOldStudentMajors(majors), [studentId, ...majors]);
      await conn.execute(SQL.insertNewStudentMajors(majors), [studentId, ...majors, studentId]);
      await conn.execute(SQL.deleteOldStudentSkills(skills), [studentId, ...skills]);
      await conn.execute(SQL.insertNewStudentSkills(skills), [studentId, ...skills, studentId]);

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async deleteStudent(username: string): Promise<void> {
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const studentId = await this.getStudentId(username);
      await conn.execute(SQL.deleteStudentMajors, [studentId]);
      await conn.execute(SQL.deleteStudentSkills, [studentId]);
      await conn.execute(SQL.deleteStudent, [studentId]);
      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }
}
