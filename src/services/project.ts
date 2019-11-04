import { Pool } from 'mysql2/promise';
import { Project } from '../types';

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

    const projectParams = [details.ownerEmail, details.description, details.startDate, details.endDate];
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
}
