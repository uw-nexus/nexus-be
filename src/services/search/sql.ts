import { Project, Student } from '../../types';

const repeatStatement = (statement: string, items: string[]): string =>
  items.length
    ? Array(items.length)
        .fill(statement)
        .join(', ')
    : `''`;

// [i1, i2, .., s1, s2, .., r1, r2, .., title, size, duration, status, lastScore, lastScore, lastId]
export const searchProjects = (filters: Project, lastScore: number = null, lastId: number = null): string => {
  const { title, size, duration, status } = filters.details;
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
              SELECT project_id, COUNT(*) AS count
              FROM project_skill PS
              JOIN skill S ON S.skill_id = PS.skill_id
              WHERE S.name IN(${repeatStatement('?', skills)})
              GROUP BY project_id
            ) SKILLS 
            ${interests.length ? 'ON SKILLS.project_id = INTERESTS.project_id' : ''}
            ${roles.length ? 'JOIN' : ''}`
        : ''
    }
    ${
      roles.length
        ? `(
              SELECT project_id, COUNT(*) AS count
              FROM project_role PR
              JOIN role R ON R.role_id = PR.role_id
              WHERE R.name IN(${repeatStatement('?', roles)})
              GROUP BY project_id
            ) ROLES 
            ${
              interests.length || skills.length
                ? `ON ROLES.project_id = ${skills.length ? 'ROLES' : 'INTERESTS'}.project_id`
                : ''
            }`
        : ''
    }
    ${
      interests.length
        ? `(
              SELECT project_id, COUNT(*) AS count
              FROM project_interest PI
              JOIN interest I ON I.interest_id = PI.interest_id
              WHERE I.name IN(${repeatStatement('?', interests)})
              GROUP BY project_id
            ) INTERESTS 
            ${skills.length || roles.length ? 'JOIN' : ''}`
        : ''
    }
    ${m2mFiltered ? `JOIN project P ON P.project_id = ${m2mTable}.project_id` : ''}
  `;

  const whereSQL = [
    title ? `P.title LIKE CONCAT("%", ?, "%")` : '',
    size ? `SZ.name = ?` : '',
    duration ? `D.name = ?` : '',
    status ? `ST.name = ?` : '',
    m2mFiltered && lastScore && lastId
      ? `score < ? OR (score = ? AND P.project_id > ?)`
      : lastId
      ? `P.project_id > ?`
      : '',
  ]
    .filter(Boolean)
    .join(' AND ');

  return `
    SELECT
      T.projectId,
      T.title,
      T.status,
      T.duration,
      T.size,
      T.postal,
      group_concat(DISTINCT(S.name)) as skills,
      group_concat(DISTINCT(R.name)) as roles,
      group_concat(DISTINCT(I.name)) as interests,
      T.score
    FROM (
      SELECT 
        P.project_id as projectId,
        P.title as title,
        ST.name as status,
        D.name as duration,
        SZ.name as size,
        P.postal as postal,
        ${m2mFiltered ? scoreSQL : '0'} AS score
      
      FROM ${m2mFiltered ? '' : 'project P'}
      ${m2mJoins}
      JOIN status ST ON ST.status_id = P.status_id
      JOIN duration D ON D.duration_id = P.duration_id
      JOIN team_size SZ ON SZ.size_id = P.size_id

      ${whereSQL ? 'WHERE ' + whereSQL : ''}
      ORDER BY score DESC, P.project_id
      LIMIT 20
    ) T
    LEFT JOIN project_skill PS ON PS.project_id = T.projectId
    LEFT JOIN skill S ON S.skill_id = PS.skill_id
    LEFT JOIN project_role PR ON PR.project_id = T.projectId
    LEFT JOIN role R ON R.role_id = PR.role_id
    LEFT JOIN project_interest PI ON PI.project_id = T.projectId
    LEFT JOIN interest I ON I.interest_id = PI.interest_id
    GROUP BY T.projectId
  `;
};

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
