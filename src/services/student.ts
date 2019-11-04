import { Pool, RowDataPacket } from 'mysql2/promise';
import { Student, StudentProfile } from '../types';

export default class StudentService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudent(student: Student): Promise<void> {
    const { profile, majors, skills } = student;

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
        (
          SELECT CI.city_id
          FROM city CI
          LEFT JOIN state ST ON ST.state_id = CI.state_id
          JOIN country CO ON CO.country_id = CI.country_id
          WHERE CI.name = ?
          ${profile.location.state ? 'AND (ST.name IS NULL OR ST.name = ?)' : ''}
          AND CO.name = ?
        ),
        CURDATE()
      );
    `;

    const repeatStatement = (statement: string, count: number): string => {
      return Array(count)
        .fill(statement)
        .join(', ');
    };

    const insertStudentMajors = (studentId: string): string => `
      INSERT INTO student_major
      VALUES ${repeatStatement(`(null, ${studentId}, (SELECT major_id FROM major WHERE name = ?))`, majors.length)};
    `;

    const insertStudentSkills = (studentId: string): string => `
      INSERT INTO student_skill
      VALUES ${repeatStatement(`(null, ${studentId}, (SELECT skill_id FROM skill WHERE name = ?))`, skills.length)};
    `;

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      const userParams = [profile.username, profile.password];
      const userDOB = profile.dob.toISOString().split('T')[0];
      const [userRes] = await conn.execute(insertUser, userParams);

      const { firstName, lastName, email, school, standing, location } = profile;
      const { city, state, country } = location;
      const params = [firstName, lastName, email, userDOB, school, standing, city, state, country].filter(Boolean);
      const [studentRes] = await conn.execute(insertStudent, [userRes['insertId'], ...params]);

      const studentId = studentRes['insertId'];
      await conn.execute(insertStudentMajors(studentId), majors);
      await conn.execute(insertStudentSkills(studentId), skills);

      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error creating student user: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }

  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    const statement = `
      SELECT 
        USR.username AS username,
        STU.first_name AS firstName,
        STU.last_name AS lastName,
        STU.email AS email,
        STU.dob AS dob,
        SCH.name AS school,
        STA.name AS standing,
        CI.name AS city,
        ST.name AS state,
        CO.name AS country
      FROM student STU
      JOIN user USR ON USR.user_id = STU.user_id
      JOIN school SCH ON SCH.school_id = STU.school_id
      JOIN standing STA ON STA.standing_id = STU.standing_id
      JOIN city CI ON CI.city_id = STU.city_id
      LEFT JOIN state ST ON ST.state_id = CI.state_id
      JOIN country CO ON CO.country_id = CI.country_id
      WHERE student_id = ?;
    `;

    try {
      const [res] = await this.db.execute(statement, [studentId]);
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
      console.log(`error fetching student profile: ${err}`);
      return null;
    }
  }

  async getStudent(studentId: string): Promise<Student> {
    const getStudentMajors = `
      SELECT M.name AS major
      FROM student STU
      JOIN student_major SM ON SM.student_id = STU.student_id
      JOIN major M ON M.major_id = SM.major_id
      WHERE STU.student_id = ?;
    `;

    const getStudentSkills = `
      SELECT SK.name AS skill
      FROM student STU
      JOIN student_skill SS ON SS.student_id = STU.student_id
      JOIN skill SK ON SK.skill_id = SS.skill_id
      WHERE STU.student_id = ?;
    `;

    try {
      const studentProfile = await this.getStudentProfile(studentId);
      const [majorsRes] = await this.db.execute(getStudentMajors, [studentId]);
      const [skillsRes] = await this.db.execute(getStudentSkills, [studentId]);

      const student = {
        profile: studentProfile,
        majors: (majorsRes as RowDataPacket[]).map(row => row['major']),
        skills: (skillsRes as RowDataPacket[]).map(row => row['skill']),
      };

      return student;
    } catch (err) {
      console.log(`error fetching student: ${err}`);
      return null;
    }
  }

  async updateStudent(studentId: string, student: Student): Promise<void> {
    const { profile, majors, skills } = student;

    const repeatStatement = (statement: string, count: number): string => {
      return Array(count)
        .fill(statement)
        .join(', ');
    };

    const subs = [
      profile.school ? `school_id = (SELECT school_id FROM school WHERE name = ?)` : '',
      profile.standing ? `standing_id = (SELECT standing_id FROM standing WHERE name = ?)` : '',
      profile.location
        ? `city_id = (
        SELECT CI.city_id
        FROM city CI
        LEFT JOIN state ST ON ST.state_id = CI.state_id
        JOIN country CO ON CO.country_id = CI.country_id
        WHERE CI.name = ?
        ${profile.location.state ? 'AND (ST.name IS NULL OR ST.name = ?)' : ''}
        AND CO.name = ?
      )`
        : '',
    ];

    const updateStudentProfile = `UPDATE student SET ${subs.filter(Boolean).join(', ')} WHERE student_id = ?;`;

    const deleteOldStudentMajors = `
      DELETE SM
      FROM student_major SM
      JOIN major M ON M.major_id = SM.major_id
      WHERE SM.student_id = ?
      AND M.name NOT IN(${repeatStatement('?', majors.length)});
    `;

    const insertNewStudentMajors = `
      INSERT INTO student_major
      SELECT null, student_id, major_id
      FROM (
        SELECT ? AS student_id, M1.major_id
        FROM major M1
        WHERE M1.name IN(${repeatStatement('?', majors.length)})
        AND NOT EXISTS (
          SELECT *
          FROM student_major SM
          JOIN major M2 ON M2.major_id = SM.major_id
          WHERE student_id = ?
          AND M2.name = M1.name
        )
      ) T;
    `;

    const deleteOldStudentSkills = `
      DELETE SS
      FROM student_skill SS
      JOIN skill SK ON SK.skill_id = SS.skill_id
      WHERE SS.student_id = ?
      AND SK.name NOT IN(${repeatStatement('?', skills.length)});
    `;

    const insertNewStudentSkills = `
      INSERT INTO student_skill
      SELECT null, student_id, skill_id
      FROM (
        SELECT ? AS student_id, SK1.skill_id
        FROM skill SK1
        WHERE SK1.name IN(${repeatStatement('?', skills.length)})
        AND NOT EXISTS (
          SELECT *
          FROM student_skill SS
          JOIN skill SK2 ON SK2.skill_id = SS.skill_id
          WHERE student_id = ?
          AND SK2.name = SK1.name
        )
      ) T;
    `;

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      const { school, standing } = profile;
      const { city, state, country } = profile.location;
      const profileParams = [school, standing, ...[city, state, country].filter(Boolean), studentId];
      await this.db.execute(updateStudentProfile, profileParams);

      await conn.execute(deleteOldStudentMajors, [studentId, ...majors]);
      await conn.execute(insertNewStudentMajors, [studentId, ...majors, studentId]);

      await conn.execute(deleteOldStudentSkills, [studentId, ...skills]);
      await conn.execute(insertNewStudentSkills, [studentId, ...skills, studentId]);

      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error updating student profile: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    const deleteStudentMajors = `DELETE FROM student_major WHERE student_id = ?;`;
    const deleteStudentSkills = `DELETE FROM student_skill WHERE student_id = ?;`;
    const findUserId = `SELECT user_id FROM student WHERE student_id = ?;`;
    const deleteStudent = `DELETE FROM student WHERE student_id = ?;`;
    const deleteUser = `DELETE FROM user WHERE user_id = ?;`;

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      await conn.execute(deleteStudentMajors, [studentId]);
      await conn.execute(deleteStudentSkills, [studentId]);

      const [student] = await conn.execute(findUserId, [studentId]);
      await conn.execute(deleteStudent, [studentId]);
      await conn.execute(deleteUser, [student[0]['user_id']]);

      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error deleting student: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }
}
