import { StudentProfile, Student } from '../../types';

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

export const addToArrayCatalog = (table: string, items: string[]): string => `
  INSERT IGNORE INTO ${table}(name)
  VALUES ${repeatStatement('(?)', items)};
`;

// [studentId, item1, item2, ...]
export const deleteOldStudentArrayItems = (table: string, items: string[]): string => `
  DELETE ST
  FROM student_${table} ST
  JOIN ${table} T ON T.${table}_id = ST.${table}_id
  WHERE ST.student_id = ?
  AND T.name NOT IN(${repeatStatement('?', items)});
`;

// [studentId, item1, ..., itemN]
export const insertNewStudentArrayItems = (table: string, items: string[]): string => `
  INSERT IGNORE INTO student_${table}
  SELECT student_id, ${table}_id
  FROM (
    SELECT ? AS student_id, ${table}_id
    FROM ${table}
    WHERE name IN(${repeatStatement('?', items)})
  ) T;
`;

// [studentId]
export const deleteStudentSkills = `DELETE FROM student_skill WHERE student_id = ?;`;
export const deleteStudentRoles = `DELETE FROM student_role WHERE student_id = ?;`;
export const deleteStudentInterests = `DELETE FROM student_interest WHERE student_id = ?;`;
export const deleteStudent = `DELETE FROM student WHERE student_id = ?;`;

// [i1, i2, .., s1, s2, .., r1, r2, .., degree, major, lastScore, lastScore, lastId]
export const searchStudents = (filters: Student, lastScore: number = null, lastId: number = null): string => {
  const { degree, major1 } = filters.profile;
  const { interests, skills, roles } = filters;

  const m2mTable = interests.length ? 'INTERESTS' : skills.length ? 'SKILLS' : 'ROLES';
  const m2mFiltered = Boolean(interests.length || skills.length || roles.length);

  const scoreSQL = [
    interests.length ? '(INTERESTS.count + 1)' : '',
    skills.length ? '(SKILLS.count + 1)' : '',
    roles.length ? '(ROLES.count + 1)' : '',
  ]
    .filter(Boolean)
    .join(' * ');

  const m2mJoins = `
    ${
      skills.length
        ? `(
              SELECT student_id, COUNT(*) AS count
              FROM student_skill SS
              JOIN skill S ON S.skill_id = SS.skill_id
              WHERE S.name IN(${repeatStatement('?', skills)})
              GROUP BY student_id
            ) SKILLS 
            ${interests.length ? 'ON SKILLS.student_id = INTERESTS.student_id' : ''}
            ${roles.length ? 'JOIN' : ''}`
        : ''
    }
    ${
      roles.length
        ? `(
              SELECT student_id, COUNT(*) AS count
              FROM student_role SR
              JOIN role R ON R.role_id = SR.role_id
              WHERE R.name IN(${repeatStatement('?', roles)})
              GROUP BY student_id
            ) ROLES 
            ${
              interests.length || skills.length
                ? `ON ROLES.student_id = ${skills.length ? 'ROLES' : 'INTERESTS'}.student_id`
                : ''
            }`
        : ''
    }
    ${
      interests.length
        ? `(
              SELECT student_id, COUNT(*) AS count
              FROM student_interest SI
              JOIN interest I ON I.interest_id = SI.interest_id
              WHERE I.name IN(${repeatStatement('?', interests)})
              GROUP BY student_id
            ) INTERESTS 
            ${skills.length || roles.length ? 'JOIN' : ''}`
        : ''
    }
    ${m2mFiltered ? `JOIN student STU ON STU.student_id = ${m2mTable}.student_id` : ''}
  `;

  const whereSQL = [
    degree ? `D.name LIKE ?` : '',
    major1 ? `CONCAT(COALESCE(M1.name, ''), " ", COALESCE(M2.name, '')) LIKE CONCAT("%", ?, "%")` : '',
    m2mFiltered && lastScore && lastId
      ? `score < ? OR (score = ? AND STU.student_id > ?)`
      : lastId
      ? `STU.student_id > ?`
      : '',
  ]
    .filter(Boolean)
    .join(' AND ');

  return `
    SELECT
      T.studentId,
      T.firstName,
      T.lastName,
      T.degree,
      T.major1,
      T.major2,
      T.postal,
      group_concat(DISTINCT(S.name)) as skills,
      group_concat(DISTINCT(R.name)) as roles,
      group_concat(DISTINCT(I.name)) as interests,
      T.score
    FROM (
      SELECT 
        STU.student_id as studentId,
        STU.first_name as firstName,
        STU.last_name as lastName,
        D.name as degree,
        M1.name as major1,
        M2.name as major2,
        STU.postal as postal,
        ${m2mFiltered ? scoreSQL : '0'} AS score
      
      FROM ${m2mFiltered ? '' : 'student STU'}
      ${m2mJoins}
      LEFT JOIN degree D ON D.degree_id = STU.degree_id
      LEFT JOIN major M1 ON M1.major_id = STU.major1_id
      LEFT JOIN major M2 ON M2.major_id = STU.major2_id

      ${whereSQL ? 'WHERE ' + whereSQL : ''}
      ORDER BY score DESC, STU.student_id
      LIMIT 20
    ) T
    LEFT JOIN student_skill SS ON SS.student_id = T.studentId
    LEFT JOIN skill S ON S.skill_id = SS.skill_id
    LEFT JOIN student_role SR ON SR.student_id = T.studentId
    LEFT JOIN role R ON R.role_id = SR.role_id
    LEFT JOIN student_interest SI ON SI.student_id = T.studentId
    LEFT JOIN interest I ON I.interest_id = SI.interest_id
    GROUP BY T.studentId
  `;
};
