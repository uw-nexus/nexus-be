import { ProjectDetails, Project } from '../../types';

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

// [username, title, description, startDate, endDate]
export const insertProject = (details: ProjectDetails): string => `
  INSERT INTO project
  VALUES (
    null,
    (SELECT U.user_id
      FROM user U
      JOIN student S ON S.user_id = U.user_id
      WHERE username = ?), 
    ?, ?,
    ${details.startDate ? '?,' : ''}
    ${details.endDate ? '?,' : ''}
    (SELECT status_id FROM status WHERE name = 'Active'), 
    CURDATE(), CURDATE()
  );
`;

// [username]
export const getProjectsOwned = `
  SELECT
    P.project_id AS projectId,
    P.title AS title,
    P.start_date AS startDate,
    P.end_date AS endDate,
    S.name AS status
  FROM project P
  JOIN status S ON S.status_id = P.status_id
  JOIN user U ON U.user_id = P.owner_id
  WHERE U.username = ?;
`;

const getAllProjectDetails = `
  SELECT
    U.username AS ownerUsername,
    SNC.user_id AS ownerUserId,
    SNC.first_name AS ownerFirstName,
    SNC.last_name AS ownerLastName,
    SNC.email AS ownerEmail,
    NPO.npo_id AS npoId,
    NPO.name AS npoName,
    P.project_id AS projectId,
    P.title AS title,
    P.description AS description,
    P.start_date AS startDate,
    P.end_date AS endDate,
    S.name AS status,
    P.created_at AS createdAt,
    P.updated_at AS updatedAt
  FROM project P
  JOIN status S ON S.status_id = P.status_id
  JOIN user U ON U.user_id = P.owner_id
  JOIN (
    (SELECT user_id, null AS npo_id, first_name, last_name, email FROM student)
    UNION
    (SELECT user_id, npo_id, first_name, last_name, email FROM client)
  ) SNC ON SNC.user_id = U.user_id
  LEFT JOIN npo NPO ON NPO.npo_id = SNC.npo_id
`;

// [projectId]
export const getProjectDetailsById = `${getAllProjectDetails} WHERE P.project_id = ?;`;

// [projectId]
export const getProjectFields = `
  SELECT F.name AS field
  FROM project P
  JOIN project_field PF ON PF.project_id = P.project_id
  JOIN field F ON F.field_id = PF.field_id
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
export const getProjectCities = `
  SELECT CI.name AS city, ST.name AS state, CO.name AS country
  FROM project P
  JOIN project_city PC ON PC.project_id = P.project_id
  JOIN city CI ON CI.city_id = PC.city_id
  LEFT JOIN state ST ON ST.state_id = CI.state_id
  JOIN country CO ON CO.country_id = CI.country_id
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

// [f1, f2, .., s1, s2, .., l1, l2, .., offset, count, title, start, end, status]
// lN = 'city, state, country'
// example: [100,20] -> rows 101-120
export const searchProjects = (filters: Project): string => {
  const { title, startDate, endDate, status } = filters.details;
  const { fields, skills, locations } = filters;
  const locs = locations.map(l => [l.city, l.state, l.country].join(', '));

  const inner = fields.length ? 'FIELDS' : skills.length ? 'SKILLS' : 'LOCS';
  const countSQL = [
    fields.length ? 'FIELDS.count' : '',
    skills.length ? 'SKILLS.count' : '',
    locs.length ? 'LOCS.count' : '',
  ]
    .filter(Boolean)
    .join(' * ');

  const featuresSQL = `
    JOIN (
      SELECT ${inner}.project_id, ${countSQL} AS score
      FROM
      ${
        fields.length
          ? `(
                SELECT project_id, COUNT(*) AS count
                FROM project_field PF
                JOIN field F ON F.field_id = PF.field_id
                WHERE F.name IN(${repeatStatement('?', fields)})
                GROUP BY project_id
              ) FIELDS 
              ${skills.length || locations.length ? 'JOIN' : ''}`
          : ''
      }
      ${
        skills.length
          ? `(
                SELECT project_id, COUNT(*) AS count
                FROM project_skill PS
                JOIN skill S ON S.skill_id = PS.skill_id
                WHERE S.name IN(${repeatStatement('?', skills)})
                GROUP BY project_id
              ) SKILLS 
              ${fields.length ? 'ON SKILLS.project_id = FIELDS.project_id' : ''}
              ${locations.length ? 'JOIN' : ''}`
          : ''
      }
      ${
        locs.length
          ? `(
                SELECT project_id, COUNT(*) AS count
                FROM project_city PC
                JOIN city CI ON CI.city_id = PC.city_id
                LEFT JOIN state ST ON ST.state_id = CI.state_id
                JOIN country CO ON CO.country_id = CI.country_id
                WHERE CONCAT(CI.name, ', ', COALESCE(ST.name, ''), ', ', CO.name) IN(${repeatStatement('?', locs)})
                GROUP BY project_id
              ) LOCS 
              ${
                fields.length || skills.length
                  ? `ON LOCS.project_id = ${skills.length ? 'SKILLS' : 'FIELDS'}.project_id`
                  : ''
              }`
          : ''
      }
      ORDER BY score DESC
      LIMIT ?, ?
    ) T ON T.project_id = P.project_id
  `;

  const detailsSQL = [
    title ? `P.title LIKE ?` : '',
    startDate ? `P.start_date >= ?` : '',
    endDate ? `P.end_date <= ?` : '',
    status ? `S.name = ?` : '',
  ]
    .filter(Boolean)
    .join(' AND ');

  return `
    ${getAllProjectDetails}
    ${fields.length || skills.length || locs.length ? featuresSQL : ''}
    ${detailsSQL ? 'WHERE ' + detailsSQL : ''}
    ${fields.length || skills.length || locs.length ? '' : 'LIMIT ?, ?'};
  `;
};

// [title, description, startDate, endDate, status, projectId]
export const updateProjectDetails = (details: ProjectDetails): string => `
  UPDATE project
  SET
    ${[
      details.title ? 'title = ?' : '',
      details.description ? 'description = ?' : '',
      details.startDate ? 'start_date = ?' : '',
      details.endDate ? 'end_date = ?' : '',
      details.status ? 'status_id = (SELECT status_id FROM status WHERE name = ?)' : '',
    ]
      .filter(Boolean)
      .join(', ')}
  WHERE project_id = ?;
`;

export const addToFieldsCatalog = (fields: string[]): string => `
  INSERT IGNORE INTO field(name)
  VALUES ${repeatStatement('(?)', fields)};
`;

// [projectId, field1, field2, ...]
export const deleteOldProjectFields = (fields: string[]): string => `
  DELETE PF
  FROM project_field PF
  JOIN field F ON F.field_id = PF.field_id
  WHERE PF.project_id = ?
  AND F.name NOT IN(${repeatStatement('?', fields)});
`;

// [projectId, field1, ..., fieldN, projectId]
export const insertNewProjectFields = (fields: string[]): string => `
  INSERT INTO project_field
  SELECT null, project_id, field_id
  FROM (
    SELECT ? AS project_id, F1.field_id
    FROM field F1
    WHERE F1.name IN(${repeatStatement('?', fields)})
    AND NOT EXISTS (
      SELECT *
      FROM project_field PF
      JOIN field F2 ON F2.field_id = PF.field_id
      WHERE project_id = ?
      AND F2.name = F1.name
    )
  ) T;
`;

export const addToSkillsCatalog = (skills: string[]): string => `
  INSERT IGNORE INTO skill(name)
  VALUES ${repeatStatement('(?)', skills)};
`;

// [projectId, skill1, skill2, ...]
export const deleteOldProjectSkills = (skills: string[]): string => `
  DELETE PS
  FROM project_skill PS
  JOIN skill S ON S.skill_id = PS.skill_id
  WHERE PS.project_id = ?
  AND S.name NOT IN(${repeatStatement('?', skills)});
`;

// [projectId, skill1, ..., skillN, projectId]
export const insertNewProjectSkills = (skills: string[]): string => `
  INSERT INTO project_skill
  SELECT null, project_id, skill_id
  FROM (
    SELECT ? AS project_id, S1.skill_id
    FROM skill S1
    WHERE S1.name IN(${repeatStatement('?', skills)})
    AND NOT EXISTS (
      SELECT *
      FROM project_skill PS
      JOIN skill S2 ON S2.skill_id = PS.skill_id
      WHERE project_id = ?
      AND S2.name = S1.name
    )
  ) T;
`;

// [projectId, loc1, loc2, ...]
// locN = 'city, state, country'
export const deleteOldProjectCities = (locations: string[]): string => `
  DELETE PC
  FROM project_city PC
    JOIN city CI ON CI.city_id = PC.city_id
    LEFT JOIN state ST ON ST.state_id = CI.state_id
    JOIN country CO ON CO.country_id = CI.country_id
  WHERE PC.project_id = ?
  AND CONCAT(CI.name, ', ', COALESCE(ST.name, ''), ', ', CO.name) NOT IN(${repeatStatement('?', locations)});
`;

// [projectId, loc1, ..., locN, projectId]
// locN = 'city, state, country'
export const insertNewProjectCities = (locations: string[]): string => `
  INSERT INTO project_city
  SELECT null, project_id, city_id
  FROM (
    SELECT ? AS project_id, CI1.city_id
    FROM city CI1
      LEFT JOIN state ST1 ON ST1.state_id = CI1.state_id
      JOIN country CO1 ON CO1.country_id = CI1.country_id
    WHERE
      CONCAT(CI1.name, ', ', COALESCE(ST1.name, ''), ', ', CO1.name) IN(${repeatStatement('?', locations)})
    AND NOT EXISTS (
      SELECT *
      FROM project_city PC
      JOIN city CI2 ON CI2.city_id = PC.city_id
        LEFT JOIN state ST2 ON ST2.state_id = CI2.state_id
        JOIN country CO2 ON CO2.country_id = CI2.country_id
      WHERE project_id = ?
      AND CI2.name = CI1.name
      AND (ST1.name IS NULL OR ST2.name = ST1.name)
      AND CO2.name = CO2.name
    )
  ) T;
`;

// [projectId]
export const deleteProjectFields = `DELETE FROM project_field WHERE project_id = ?;`;
export const deleteProjectSkills = `DELETE FROM project_skill WHERE project_id = ?;`;
export const deleteProjectCities = `DELETE FROM project_city WHERE project_id = ?;`;
export const deleteProject = `DELETE FROM project WHERE project_id = ?;`;
