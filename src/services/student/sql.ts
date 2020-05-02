import { StudentProfile } from '../../types';

const repeatStatement = (statement: string, items: string[]): string =>
  items.length
    ? Array(items.length)
        .fill(statement)
        .join(', ')
    : `''`;

// [username, firstName, lastName, email]
export const insertStudent = `
  INSERT INTO student(user_id, first_name, last_name, email, joined_at)
  VALUES (
    (SELECT user_id FROM user WHERE username = ?), 
    ?, ?, ?, 
    CURDATE()
  );
`;

// [username]
export const getStudentId = `
  SELECT STU.student_id AS studentId
  FROM student STU
  JOIN user USR ON USR.user_id = STU.user_id
  WHERE USR.username = ?;
`;

// [studentId]
export const getStudentProfile = `
  SELECT 
    STU.first_name AS firstName,
    STU.last_name AS lastName,
    STU.email AS email,
    STU.dob AS dob,
    SCH.name AS school,
    D.name AS degree,
    M1.name AS major1,
    M2.name AS major2,
    STU.resume AS resume,
    STU.linkedin AS linkedin,
    STU.website AS website,
    STU.postal AS postal,
    STU.photo_url AS photoUrl
  FROM student STU
  JOIN user USR ON USR.user_id = STU.user_id
  LEFT JOIN school SCH ON SCH.school_id = STU.school_id
  LEFT JOIN degree D ON D.degree_id = STU.degree_id
  LEFT JOIN major M1 ON M1.major_id = STU.major1_id
  LEFT JOIN major M2 ON M2.major_id = STU.major2_id
  WHERE STU.student_id = ?;
`;

// [studentId]
export const getStudentSkills = `
  SELECT SK.name AS skill
  FROM student STU
  JOIN student_skill SS ON SS.student_id = STU.student_id
  JOIN skill SK ON SK.skill_id = SS.skill_id
  WHERE STU.student_id = ?;
`;

// [studentId]
export const getStudentRoles = `
  SELECT R.name AS role
  FROM student STU
  JOIN student_role SR ON SR.student_id = STU.student_id
  JOIN role R ON R.role_id = SR.role_id
  WHERE STU.student_id = ?;
`;

// [studentId]
export const getStudentInterests = `
  SELECT I.name AS interest
  FROM student STU
  JOIN student_interest SI ON SI.student_id = STU.student_id
  JOIN interest I ON I.interest_id = SI.interest_id
  WHERE STU.student_id = ?;
`;

// [dob, school, degree, major1, major2, resume, linkedin, website, postal, studentId]
export const updateStudentProfile = (profile: StudentProfile): string => `
  UPDATE student
  SET ${[
    profile.dob ? `dob = ?` : '',
    profile.school ? `school_id = (SELECT school_id FROM school WHERE name = ?)` : '',
    profile.degree ? `degree_id = (SELECT degree_id FROM degree WHERE name = ?)` : '',
    profile.major1 ? `major1_id = (SELECT major_id FROM major WHERE name = ?)` : '',
    profile.major2 ? `major2_id = (SELECT major_id FROM major WHERE name = ?)` : '',
    profile.resume ? `resume = ?` : '',
    profile.linkedin ? `linkedin = ?` : '',
    profile.website ? `website = ?` : '',
    profile.postal ? `postal = ?` : '',
    profile.photoUrl ? `photoUrl = ?` : '',
  ]
    .filter(Boolean)
    .join(', ')}
  WHERE student_id = ?;
`;

export const addToArrayCatalog = (table: string, skills: string[]): string => `
  INSERT IGNORE INTO ${table}(name)
  VALUES ${repeatStatement('(?)', skills)};
`;

// [studentId, item1, item2, ...]
export const deleteOldStudentArrayItems = (table: string, items: string[]): string => `
  DELETE ST
  FROM student_${table} ST
  JOIN ${table} T ON T.${table}_id = ST.${table}_id
  WHERE ST.student_id = ?
  AND T.name NOT IN(${repeatStatement('?', items)});
`;

// [studentId, item1, ..., itemN, studentId]
export const insertNewStudentArrayItem = (table: string, items: string[]): string => `
  INSERT INTO student_${table}
  SELECT null, student_id, ${table}_id
  FROM (
    SELECT ? AS student_id, T1.${table}_id
    FROM ${table} T1
    WHERE T1.name IN(${repeatStatement('?', items)})
    AND NOT EXISTS (
      SELECT *
      FROM student_${table} ST
      JOIN ${table} T2 ON T2.${table}_id = ST.${table}_id
      WHERE student_id = ?
      AND T2.name = T1.name
    )
  ) T;
`;

// [studentId]
export const deleteStudentSkills = `DELETE FROM student_skill WHERE student_id = ?;`;
export const deleteStudentRoles = `DELETE FROM student_role WHERE student_id = ?;`;
export const deleteStudentInterests = `DELETE FROM student_interest WHERE student_id = ?;`;
export const deleteStudent = `DELETE FROM student WHERE student_id = ?;`;
