import { Pool } from 'mysql2/promise';
import { Project } from '../types';

export default class ProjectService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createProject(project: Project): Promise<void> {
    const statement = `
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

    const params = [project.ownerEmail, project.description, project.startDate, project.endDate];

    try {
      await this.db.execute(statement, params);
    } catch (err) {
      console.log(`error creating new project: ${err}`);
    }
  }
}
