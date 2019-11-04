import { Pool } from 'mysql2/promise';
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
      console.log(`error fetching project: ${err}`);
      return null;
    }
  }
}
