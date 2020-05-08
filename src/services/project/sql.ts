import { ProjectDetails } from '../../types';

const repeatStatement = (statement: string, items: string[]): string =>
  items.length
    ? Array(items.length)
        .fill(statement)
        .join(', ')
    : `''`;

// [projectId]
export const getOwnerUsername = `
  SELECT U.username
  FROM user U
  JOIN project P ON P.owner_id = U.user_id
  WHERE P.project_id = ?;
`;

// [username, title, description, size, duration, postal]
export const insertProject = (): string => `
  INSERT INTO project
  VALUES (
    null,
    (SELECT U.user_id
      FROM user U
      JOIN student S ON S.user_id = U.user_id
      WHERE username = ?), 
    ?, ?, 
    (SELECT size_id FROM team_size WHERE name = ?),
    (SELECT duration_id FROM duration WHERE name = ?),
    (SELECT status_id FROM status WHERE name = 'Active'),    
    ?, CURDATE(), CURDATE()
  );
`;

// [username]
export const getProjectsOwned = `
  SELECT
    P.project_id as projectId,
    P.title as title,
    ST.name as status,
    D.name as duration,
    SZ.name as size,
    P.postal as postal
  FROM project P
  JOIN status ST ON ST.status_id = P.status_id
  JOIN duration D ON D.duration_id = P.duration_id
  JOIN team_size SZ ON SZ.size_id = P.size_id
  JOIN user U ON U.user_id = P.owner_id WHERE U.username = ?;
`;

// [projectId]
export const getProjectDetailsById = `
  SELECT
    U.username AS ownerUsername,
    SNC.user_id AS ownerUserId,
    SNC.first_name AS ownerFirstName,
    SNC.last_name AS ownerLastName,
    NPO.npo_id AS npoId,
    NPO.name AS npoName,
    P.project_id AS projectId,
    P.title AS title,
    P.description AS description,
    ST.name AS status,
    D.name as duration,
    SZ.name as size,
    P.postal as postal,
    P.created_at AS createdAt,
    P.updated_at AS updatedAt
  FROM project P
  JOIN status ST ON ST.status_id = P.status_id
  JOIN duration D ON D.duration_id = P.duration_id
  JOIN team_size SZ ON SZ.size_id = P.size_id
  JOIN user U ON U.user_id = P.owner_id
  JOIN (
    (SELECT user_id, null AS npo_id, first_name, last_name, email FROM student)
    UNION
    (SELECT user_id, npo_id, first_name, last_name, email FROM client)
  ) SNC ON SNC.user_id = U.user_id
  LEFT JOIN npo NPO ON NPO.npo_id = SNC.npo_id
  WHERE P.project_id = ?;
`;

// [projectId]
export const getProjectSkills = `
  SELECT SK.name AS skill
  FROM project P
  JOIN project_skill PS ON PS.project_id = P.project_id
  JOIN skill SK ON SK.skill_id = PS.skill_id
  WHERE P.project_id = ?;
`;

// [projectId]
export const getProjectRoles = `
  SELECT R.name AS role
  FROM project P
  JOIN project_role PI ON PI.project_id = P.project_id
  JOIN role R ON R.role_id = PI.role_id
  WHERE P.project_id = ?;
`;

// [projectId]
export const getProjectInterests = `
  SELECT I.name AS interest
  FROM project P
  JOIN project_interest PI ON PI.project_id = P.project_id
  JOIN interest I ON I.interest_id = PI.interest_id
  WHERE P.project_id = ?;
`;

// [projectId]
export const getProjectContracts = `
  SELECT
    CTR.contract_id AS contractId,
    CTR.start_date AS startDate,
    CTR.end_date AS endDate,
    STA.name AS status,
    STU.first_name AS firstName,
    STU.last_name AS lastName,
    USR.username AS username
  FROM contract CTR
  JOIN status STA ON STA.status_id = CTR.status_id
  JOIN student STU ON STU.student_id = CTR.student_id
  JOIN user USR ON USR.user_id = STU.user_id
  WHERE project_id = ?;
`;

// [title, description, size, duration, status, postal, projectId]
export const updateProjectDetails = (details: ProjectDetails): string => `
  UPDATE project
  SET
    ${[
      details.title ? 'title = ?' : '',
      details.description ? 'description = ?' : '',
      details.size ? 'size_id = (SELECT size_id FROM team_size WHERE name = ?)' : '',
      details.duration ? 'duration_id = (SELECT duration_id FROM duration WHERE name = ?)' : '',
      details.status ? 'status_id = (SELECT status_id FROM status WHERE name = ?)' : '',
      details.postal ? 'postal = ?' : '',
      'updated_at = CURDATE()',
    ]
      .filter(Boolean)
      .join(', ')}
  WHERE project_id = ?;
`;

export const addToArrayCatalog = (table: string, items: string[]): string => `
  INSERT IGNORE INTO ${table}(name)
  VALUES ${repeatStatement('(?)', items)};
`;

// [projectId, item1, item2, ...]
export const deleteOldProjectArrayItems = (table: string, items: string[]): string => `
  DELETE PT
  FROM project_${table} PT
  JOIN ${table} T ON T.${table}_id = PT.${table}_id
  WHERE PT.project_id = ?
  AND T.name NOT IN(${repeatStatement('?', items)});
`;

// [projectId, item1, ..., itemN]
export const insertNewProjectArrayItems = (table: string, items: string[]): string => `
  INSERT IGNORE INTO project_${table}
  SELECT project_id, ${table}_id
  FROM (
    SELECT ? AS project_id, ${table}_id
    FROM ${table}
    WHERE name IN(${repeatStatement('?', items)})
  ) T;
`;

// [projectId]
export const deleteProjectInterests = `DELETE FROM project_interest WHERE project_id = ?;`;
export const deleteProjectSkills = `DELETE FROM project_skill WHERE project_id = ?;`;
export const deleteProjectRoles = `DELETE FROM project_role WHERE project_id = ?;`;
export const deleteProject = `DELETE FROM project WHERE project_id = ?;`;
