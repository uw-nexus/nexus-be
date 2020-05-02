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
        dob: res[0].dob ? new Date(res[0].dob) : null,
        school: res[0].school || '',
        degree: res[0].degree || '',
        major1: res[0].major1 || '',
        major2: res[0].major2 || '',
        resume: res[0].resume || '',
        linkedin: res[0].linkedin || '',
        website: res[0].website || '',
        postal: res[0].postal || '',
        photoUrl: res[0].photoUrl || '',
      };
    }

    return profile;
  }

  async getStudent(username: string): Promise<Student> {
    const studentId = await this.getStudentId(username);
    const studentProfile = await this.getStudentProfile(username, studentId);
    if (!studentProfile) return null;

    const [skillsRes] = await this.db.execute(SQL.getStudentSkills, [studentId]);
    const [rolesRes] = await this.db.execute(SQL.getStudentRoles, [studentId]);
    const [interestsRes] = await this.db.execute(SQL.getStudentInterests, [studentId]);

    const student = {
      profile: studentProfile,
      skills: (skillsRes as RowDataPacket[]).map(row => row.skill),
      roles: (rolesRes as RowDataPacket[]).map(row => row.role),
      interests: (interestsRes as RowDataPacket[]).map(row => row.interest),
    };

    return student;
  }

  async updateStudent(username: string, student: Student): Promise<void> {
    const { profile, skills, roles, interests } = student;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const studentId = await this.getStudentId(username);

      const profileParams = [
        profile.dob,
        profile.school,
        profile.degree,
        profile.major1,
        profile.major2,
        profile.resume,
        profile.linkedin,
        profile.website,
        profile.postal,
        profile.photoUrl,
      ].filter(Boolean);
      await conn.execute(SQL.updateStudentProfile(profile), [...profileParams, studentId]);

      if (skills.length) {
        await conn.execute(SQL.addToArrayCatalog('skill', skills), skills);
        await conn.execute(SQL.deleteOldStudentArrayItems('skill', skills), [studentId, ...skills]);
        await conn.execute(SQL.insertNewStudentArrayItem('skill', skills), [studentId, ...skills, studentId]);
      }

      if (roles.length) {
        await conn.execute(SQL.addToArrayCatalog('role', roles), roles);
        await conn.execute(SQL.deleteOldStudentArrayItems('role', roles), [studentId, ...roles]);
        await conn.execute(SQL.insertNewStudentArrayItem('role', roles), [studentId, ...roles, studentId]);
      }

      if (interests.length) {
        await conn.execute(SQL.addToArrayCatalog('interest', interests), interests);
        await conn.execute(SQL.deleteOldStudentArrayItems('interest', interests), [studentId, ...interests]);
        await conn.execute(SQL.insertNewStudentArrayItem('interest', interests), [studentId, ...interests, studentId]);
      }

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
      await conn.execute(SQL.deleteStudentSkills, [studentId]);
      await conn.execute(SQL.deleteStudentRoles, [studentId]);
      await conn.execute(SQL.deleteStudentInterests, [studentId]);
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
