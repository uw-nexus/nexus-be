import { Pool, RowDataPacket } from 'mysql2/promise';
import { Student, StudentProfile, User } from '../../types';
import * as SQL from './sql';

import algoliasearch, { SearchIndex } from 'algoliasearch';
import { ALGOLIA_APP_ID, ALGOLIA_API_KEY } from '../../config';

export default class StudentService {
  db: Pool;
  searchIndex: SearchIndex;
  SEARCH_INDEX_NAME = 'students';

  constructor(promisePool: Pool) {
    this.db = promisePool;
    const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    this.searchIndex = searchClient.initIndex(this.SEARCH_INDEX_NAME);
  }

  async createStudent(username: string, profile: StudentProfile): Promise<string> {
    const { firstName, lastName, email } = profile;
    const conn = await this.db.getConnection();

    this.searchIndex.saveObject({
      objectID: username,
      firstName,
      lastName,
    });

    try {
      conn.beginTransaction();
      const studentParams = [username, username, firstName, lastName, email];
      const [studentRes] = await conn.execute(SQL.insertStudent, studentParams);
      const studentId = studentRes['insertId'];
      await conn.commit();
      conn.release();
      return studentId;
    } catch (err) {
      await conn.rollback();
      conn.release();

      this.searchIndex.deleteObject(username);
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
        bio: res[0].bio || '',
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

      const params = [
        profile.dob || null,
        profile.bio || null,
        profile.school || null,
        profile.degree || null,
        profile.major1 || null,
        profile.major2 || null,
        profile.resume || null,
        profile.linkedin || null,
        profile.website || null,
        profile.postal || null,
        profile.photoUrl || null,
        studentId,
      ];
      await conn.execute(SQL.updateStudentProfile, params);

      if (skills.length) {
        await conn.execute(SQL.addToArrayCatalog('skill', skills), skills);
        await conn.execute(SQL.deleteOldStudentArrayItems('skill', skills), [studentId, ...skills]);
        await conn.execute(SQL.insertNewStudentArrayItems('skill', skills), [studentId, ...skills]);
      } else {
        await conn.execute(SQL.deleteStudentSkills, [studentId]);
      }

      if (roles.length) {
        await conn.execute(SQL.addToArrayCatalog('role', roles), roles);
        await conn.execute(SQL.deleteOldStudentArrayItems('role', roles), [studentId, ...roles]);
        await conn.execute(SQL.insertNewStudentArrayItems('role', roles), [studentId, ...roles]);
      } else {
        await conn.execute(SQL.deleteStudentRoles, [studentId]);
      }

      if (interests.length) {
        await conn.execute(SQL.addToArrayCatalog('interest', interests), interests);
        await conn.execute(SQL.deleteOldStudentArrayItems('interest', interests), [studentId, ...interests]);
        await conn.execute(SQL.insertNewStudentArrayItems('interest', interests), [studentId, ...interests]);
      } else {
        await conn.execute(SQL.deleteStudentInterests, [studentId]);
      }

      await conn.commit();
      conn.release();

      const { object } = await this.searchIndex.findObject(s => ((s as unknown) as User).username === username);

      this.searchIndex.partialUpdateObject({
        objectID: object.objectID,
        firstName: profile.firstName || object.firstName,
        lastName: profile.lastName || object.lastName,
        degree: profile.degree || object.degree,
        majors: [profile.major1, profile.major2, ...object.majors].filter(Boolean).splice(0, 2),
        postal: profile.postal || object.postal,
        skills,
        roles,
        interests,
      });
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

      this.searchIndex.deleteBy({ filters: `username:"${username}"` });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }
}
