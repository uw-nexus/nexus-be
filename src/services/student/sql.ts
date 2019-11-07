import { StudentProfile } from '../../types';

const repeatStatement = (statement: string, items: string[]): string => {
  return Array(items.length)
    .fill(statement)
    .join(', ');
};

// [username, password]
const insertUser = `
  INSERT INTO user
  VALUES (null, (SELECT user_type_id FROM user_type WHERE name = 'Student'), ?, ?);
`;

// [userId, firstName, lastName, email, dob, school, standing, city, state, location]
const insertStudent = (profile: StudentProfile): string => `
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

// [studentId, major1, studentId, major2, ...]
const insertStudentMajors = (majors: string[]): string => `
  INSERT INTO student_major
  VALUES ${repeatStatement(`(null, ?, (SELECT major_id FROM major WHERE name = ?))`, majors)};
`;

// [studentId, skill1, studentId, skill2, ...]
const insertStudentSkills = (skills: string[]): string => `
  INSERT INTO student_skill
  VALUES ${repeatStatement(`(null, ?, (SELECT skill_id FROM skill WHERE name = ?))`, skills)};
`;

// [studentId]
const getStudentProfile = `
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

// [studentId]
const getStudentMajors = `
  SELECT M.name AS major
  FROM student STU
  JOIN student_major SM ON SM.student_id = STU.student_id
  JOIN major M ON M.major_id = SM.major_id
  WHERE STU.student_id = ?;
`;

// [studentId]
const getStudentSkills = `
  SELECT SK.name AS skill
  FROM student STU
  JOIN student_skill SS ON SS.student_id = STU.student_id
  JOIN skill SK ON SK.skill_id = SS.skill_id
  WHERE STU.student_id = ?;
`;

// [school, standing, city, state, country, studentId]
const updateStudentProfile = (profile: StudentProfile): string => `
  UPDATE student
  SET ${[
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
  ]
    .filter(Boolean)
    .join(', ')}
  WHERE student_id = ?;
`;

// [studentId, major1, major2, ...]
const deleteOldStudentMajors = (majors: string[]): string => `
  DELETE SM
  FROM student_major SM
  JOIN major M ON M.major_id = SM.major_id
  WHERE SM.student_id = ?
  AND M.name NOT IN(${repeatStatement('?', majors)});
`;

// [studentId, major1, ..., majorN, studentId]
const insertNewStudentMajors = (majors: string[]): string => `
  INSERT INTO student_major
  SELECT null, student_id, major_id
  FROM (
    SELECT ? AS student_id, M1.major_id
    FROM major M1
    WHERE M1.name IN(${repeatStatement('?', majors)})
    AND NOT EXISTS (
      SELECT *
      FROM student_major SM
      JOIN major M2 ON M2.major_id = SM.major_id
      WHERE student_id = ?
      AND M2.name = M1.name
    )
  ) T;
`;

// [studentId, skill1, skill2, ...]
const deleteOldStudentSkills = (skills: string[]): string => `
  DELETE SS
  FROM student_skill SS
  JOIN skill SK ON SK.skill_id = SS.skill_id
  WHERE SS.student_id = ?
  AND SK.name NOT IN(${repeatStatement('?', skills)});
`;

// [studentId, skill1, ..., skillN, studentId]
const insertNewStudentSkills = (skills: string[]): string => `
  INSERT INTO student_skill
  SELECT null, student_id, skill_id
  FROM (
    SELECT ? AS student_id, SK1.skill_id
    FROM skill SK1
    WHERE SK1.name IN(${repeatStatement('?', skills)})
    AND NOT EXISTS (
      SELECT *
      FROM student_skill SS
      JOIN skill SK2 ON SK2.skill_id = SS.skill_id
      WHERE student_id = ?
      AND SK2.name = SK1.name
    )
  ) T;
`;

// [studentId]
const deleteStudentMajors = `DELETE FROM student_major WHERE student_id = ?;`;
const deleteStudentSkills = `DELETE FROM student_skill WHERE student_id = ?;`;
const findUserId = `SELECT user_id FROM student WHERE student_id = ?;`;
const deleteStudent = `DELETE FROM student WHERE student_id = ?;`;

// [userId]
const deleteUser = `DELETE FROM user WHERE user_id = ?;`;

export default {
  insertUser,
  insertStudent,
  insertStudentMajors,
  insertStudentSkills,
  getStudentProfile,
  getStudentMajors,
  getStudentSkills,
  updateStudentProfile,
  deleteOldStudentMajors,
  insertNewStudentMajors,
  deleteOldStudentSkills,
  insertNewStudentSkills,
  deleteStudentMajors,
  deleteStudentSkills,
  findUserId,
  deleteStudent,
  deleteUser,
};
