import { Pool, RowDataPacket } from 'mysql2/promise';
import { Student, StudentProfile } from '../../types';
import SQL from './sql';

export default class StudentService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudent(student: Student): Promise<string> {
    const { profile, majors, skills } = student;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const userParams = [profile.username, profile.password];
      const [userRes] = await conn.execute(SQL.insertUser, userParams);

      const studentParams = [
        userRes['insertId'],
        profile.firstName,
        profile.lastName,
        profile.email,
        profile.dob.toISOString().split('T')[0],
        profile.school,
        profile.standing,
        profile.location.city,
        profile.location.state,
        profile.location.country,
      ].filter(Boolean);

      const [studentRes] = await conn.execute(SQL.insertStudent(profile), studentParams);
      const studentId = studentRes['insertId'];

      const majorsParams = majors.reduce((acc, cur) => acc.concat(studentId, cur), []);
      const skillsParams = skills.reduce((acc, cur) => acc.concat(studentId, cur), []);
      await conn.execute(SQL.insertStudentMajors(majors), majorsParams);
      await conn.execute(SQL.insertStudentSkills(skills), skillsParams);

      await conn.commit();
      conn.release();
      return studentId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error creating student user: ${err}`);
    }
  }

  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    try {
      const [res] = await this.db.execute(SQL.getStudentProfile, [studentId]);
      let profile: StudentProfile;

      if (res[0]) {
        profile = {
          username: res[0].username,
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
    } catch (err) {
      throw new Error(`error fetching student profile: ${err}`);
    }
  }

  async getStudent(studentId: string): Promise<Student> {
    try {
      const studentProfile = await this.getStudentProfile(studentId);
      if (!studentProfile) return null;

      const [majorsRes] = await this.db.execute(SQL.getStudentMajors, [studentId]);
      const [skillsRes] = await this.db.execute(SQL.getStudentSkills, [studentId]);

      const student = {
        profile: studentProfile,
        majors: (majorsRes as RowDataPacket[]).map(row => row.major),
        skills: (skillsRes as RowDataPacket[]).map(row => row.skill),
      };

      return student;
    } catch (err) {
      throw new Error(`error fetching student: ${err}`);
    }
  }

  async updateStudent(studentId: string, student: Student): Promise<void> {
    const { profile, majors, skills } = student;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

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
      throw new Error(`error updating student profile: ${err}`);
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      await conn.execute(SQL.deleteStudentMajors, [studentId]);
      await conn.execute(SQL.deleteStudentSkills, [studentId]);

      const [student] = await conn.execute(SQL.findUserId, [studentId]);
      await conn.execute(SQL.deleteStudent, [studentId]);
      await conn.execute(SQL.deleteUser, [student[0]['user_id']]);

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error deleting student: ${err}`);
    }
  }
}
