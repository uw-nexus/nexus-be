import { Pool, RowDataPacket } from 'mysql2/promise';
import { Project, ProjectDetails } from '../types';

export default class ProjectService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createProject(project: Project): Promise<string> {
    const { details, fields, skills, locations } = project;

    const insertProject = `
      INSERT INTO project
      VALUES (
        null,
        (SELECT U.user_id
          FROM user U
          JOIN student S ON S.user_id = U.user_id
          WHERE email = ?), 
        ?, ?, ?, 
        (SELECT status_id FROM status WHERE name = 'Active'), 
        CURDATE(), CURDATE()
      );
    `;

    const repeatStatement = (statement: string, count: number): string => {
      return Array(count)
        .fill(statement)
        .join(', ');
    };

    const insertProjectFields = (projectId: string): string => `
      INSERT INTO project_field
      VALUES ${repeatStatement(`(null, ${projectId}, (SELECT field_id FROM field WHERE name = ?))`, fields.length)};
    `;

    const insertProjectSkills = (projectId: string): string => `
      INSERT INTO project_skill
      VALUES ${repeatStatement(`(null, ${projectId}, (SELECT skill_id FROM skill WHERE name = ?))`, skills.length)};
    `;

    const insertProjectCities = `
      INSERT INTO project_city
      SELECT null, project_id, city_id
      FROM (
        SELECT ? AS project_id, CI.city_id
        FROM city CI
          LEFT JOIN state ST ON ST.state_id = CI.state_id
          JOIN country CO ON CO.country_id = CI.country_id
        WHERE
          CONCAT(CI.name, ', ', COALESCE(ST.name, ''), ', ', CO.name) IN(${repeatStatement('?', locations.length)})
      ) T;
    `;

    const projectParams = [details.owner.email, details.description, details.startDate, details.endDate];
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const [projectRes] = await conn.execute(insertProject, projectParams);
      const projectId = projectRes['insertId'];
      await conn.execute(insertProjectFields(projectId), fields);
      await conn.execute(insertProjectSkills(projectId), skills);

      const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
      await conn.execute(insertProjectCities, [projectId, ...locParams]);

      await conn.commit();
      conn.release();
      return projectId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error creating new project: ${err}`);
    }
  }

  async getProjectDetails(projectId: string): Promise<ProjectDetails> {
    const statement = `
      SELECT
        SNC.user_id AS ownerUserId,
        SNC.first_name AS ownerFirstName,
        SNC.last_name AS ownerLastName,
        SNC.email AS ownerEmail,
        NPO.npo_id AS npoId,
        NPO.name AS npoName,
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
      WHERE project_id = ?;
    `;

    try {
      const [res] = await this.db.execute(statement, [projectId]);

      let projectDetails: ProjectDetails;

      if (res[0]) {
        projectDetails = {
          owner: {
            _id: res[0]['ownerUserId'],
            firstName: res[0]['ownerFirstName'],
            lastName: res[0]['ownerLastName'],
            email: res[0]['ownerEmail'],
          },
          description: res[0]['description'],
          startDate: res[0]['startDate'],
          endDate: res[0]['endDate'],
          status: res[0]['status'],
          createdAt: res[0]['createdAt'],
          updatedAt: res[0]['updatedAt'],
        };
      }

      return projectDetails;
    } catch (err) {
      throw new Error(`error fetching project details: ${err}`);
    }
  }

  async getProject(projectId: string): Promise<Project> {
    const getProjectFields = `
      SELECT F.name AS field
      FROM project P
      JOIN project_field PF ON PF.project_id = P.project_id
      JOIN field F ON F.field_id = PF.field_id;
    `;

    const getProjectSkills = `
      SELECT SK.name AS skill
      FROM project P
      JOIN project_skill PS ON PS.project_id = P.project_id
      JOIN skill SK ON SK.skill_id = PS.skill_id;
    `;

    const getProjectCities = `
      SELECT CI.name AS city, ST.name AS state, CO.name AS country
      FROM project P
      JOIN project_city PC ON PC.project_id = P.project_id
      JOIN city CI ON CI.city_id = PC.city_id
      LEFT JOIN state ST ON ST.state_id = CI.state_id
      JOIN country CO ON CO.country_id = CI.country_id;
    `;

    try {
      const projectDetails = await this.getProjectDetails(projectId);
      if (!projectDetails) return null;

      const [fieldsRes] = await this.db.execute(getProjectFields, [projectId]);
      const [skillsRes] = await this.db.execute(getProjectSkills, [projectId]);
      const [citiesRes] = await this.db.execute(getProjectCities, [projectId]);

      const project = {
        details: projectDetails,
        fields: (fieldsRes as RowDataPacket[]).map(row => row['field']),
        skills: (skillsRes as RowDataPacket[]).map(row => row['skill']),
        locations: (citiesRes as RowDataPacket[]).map(row => {
          return {
            city: row['city'],
            state: row['state'],
            country: row['country'],
          };
        }),
      };

      return project;
    } catch (err) {
      throw new Error(`error fetching project: ${err}`);
    }
  }

  async updateProject(projectId: string, project: Project): Promise<void> {
    const { details, fields, skills, locations } = project;

    const repeatStatement = (statement: string, count: number): string => {
      return Array(count)
        .fill(statement)
        .join(', ');
    };

    const updateProjectDetails = `
      UPDATE project
      SET
        ${[
          details.description ? 'description = ?' : '',
          details.startDate ? 'start_date = ?' : '',
          details.endDate ? 'end_date = ?' : '',
          details.status ? 'status_id = (SELECT status_id FROM status WHERE name = ?)' : '',
        ]
          .filter(Boolean)
          .join(', ')}
      WHERE project_id = ?;
    `;

    const deleteOldProjectFields = `
      DELETE PF
      FROM project_field PF
      JOIN field F ON F.field_id = PF.field_id
      WHERE PF.project_id = ?
      AND F.name NOT IN(${repeatStatement('?', fields.length)});
    `;

    const insertNewProjectFields = `
      INSERT INTO project_field
      SELECT null, project_id, field_id
      FROM (
        SELECT ? AS project_id, F1.field_id
        FROM field F1
        WHERE F1.name IN(${repeatStatement('?', fields.length)})
        AND NOT EXISTS (
          SELECT *
          FROM project_field PF
          JOIN field F2 ON F2.field_id = PF.field_id
          WHERE project_id = ?
          AND F2.name = F1.name
        )
      ) T;
    `;

    const deleteOldProjectSkills = `
      DELETE PS
      FROM project_skill PS
      JOIN skill S ON S.skill_id = PS.skill_id
      WHERE PS.project_id = ?
      AND S.name NOT IN(${repeatStatement('?', skills.length)});
    `;

    const insertNewProjectSkills = `
      INSERT INTO project_skill
      SELECT null, project_id, skill_id
      FROM (
        SELECT ? AS project_id, S1.skill_id
        FROM skill S1
        WHERE S1.name IN(${repeatStatement('?', skills.length)})
        AND NOT EXISTS (
          SELECT *
          FROM project_skill PS
          JOIN skill S2 ON S2.skill_id = PS.skill_id
          WHERE project_id = ?
          AND S2.name = S1.name
        )
      ) T;
    `;

    const deleteOldProjectCities = `
      DELETE PC
      FROM project_city PC
        JOIN city CI ON CI.city_id = PC.city_id
        LEFT JOIN state ST ON ST.state_id = CI.state_id
        JOIN country CO ON CO.country_id = CI.country_id
      WHERE PC.project_id = ?
      AND CONCAT(CI.name, ', ', COALESCE(ST.name, ''), ', ', CO.name) NOT IN(${repeatStatement('?', locations.length)});
    `;

    const insertNewProjectCities = `
      INSERT INTO project_city
      SELECT null, project_id, city_id
      FROM (
        SELECT ? AS project_id, CI1.city_id
        FROM city CI1
          LEFT JOIN state ST1 ON ST1.state_id = CI1.state_id
          JOIN country CO1 ON CO1.country_id = CI1.country_id
        WHERE
          CONCAT(CI1.name, ', ', COALESCE(ST1.name, ''), ', ', CO1.name) IN(${repeatStatement('?', locations.length)})
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

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      const { description, startDate, endDate, status } = details;
      const projectParams = [description, startDate, endDate, status].filter(Boolean);
      await conn.execute(updateProjectDetails, [...projectParams, projectId]);

      await conn.execute(deleteOldProjectFields, [projectId, ...fields]);
      await conn.execute(insertNewProjectFields, [projectId, ...fields, projectId]);

      await conn.execute(deleteOldProjectSkills, [projectId, ...skills]);
      await conn.execute(insertNewProjectSkills, [projectId, ...skills, projectId]);

      const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
      await conn.execute(deleteOldProjectCities, [projectId, ...locParams]);
      await conn.execute(insertNewProjectCities, [projectId, ...locParams, projectId]);

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error updating project: ${err}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const deleteProjectFields = `DELETE FROM project_field WHERE project_id = ?;`;
    const deleteProjectSkills = `DELETE FROM project_skill WHERE project_id = ?;`;
    const deleteProjectCities = `DELETE FROM project_city WHERE project_id = ?;`;
    const deleteProject = `DELETE FROM project WHERE project_id = ?;`;

    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      await conn.execute(deleteProjectFields, [projectId]);
      await conn.execute(deleteProjectSkills, [projectId]);
      await conn.execute(deleteProjectCities, [projectId]);
      await conn.execute(deleteProject, [projectId]);
      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error deleting project: ${err}`);
    }
  }
}
