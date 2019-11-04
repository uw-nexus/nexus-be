import { Pool, RowDataPacket } from 'mysql2/promise';
import { Project, ProjectDetails } from '../types';

export default class ProjectService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createProject(project: Project): Promise<void> {
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

    const insertProjectCities = (projectId: string): string => `
      INSERT INTO project_city
      VALUES ${repeatStatement(`(null, ${projectId}, (SELECT city_id FROM city WHERE name = ?))`, locations.length)};
    `;

    const projectParams = [details.owner.email, details.description, details.startDate, details.endDate];
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const [projectRes] = await conn.execute(insertProject, projectParams);
      const projectId = projectRes['insertId'];
      await conn.execute(insertProjectFields(projectId), fields);
      await conn.execute(insertProjectSkills(projectId), skills);
      await conn.execute(insertProjectCities(projectId), locations.map(l => l.city));
      await conn.commit();
      conn.release();
    } catch (err) {
      console.log(`error creating new project: ${err}`);
      await conn.rollback();
      conn.release();
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
      console.log(`error fetching project details: ${err}`);
      return null;
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
      console.log(`error fetching project: ${err}`);
      return null;
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
      console.log(`error deleting project: ${err}`);
      await conn.rollback();
      conn.release();
    }
  }
}
