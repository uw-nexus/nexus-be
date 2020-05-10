import { Pool, RowDataPacket } from 'mysql2/promise';
import * as SQL from './sql';

export default class SaveService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async getSavedEntityIds(username: string): Promise<{ projects: string[]; students: string[] }> {
    try {
      const [projectsRes] = await this.db.execute(SQL.getSavedProjects, [username]);
      const [studentsRes] = await this.db.execute(SQL.getSavedStudents, [username]);

      return {
        projects: (projectsRes as RowDataPacket[]).map(({ projectId }) => projectId),
        students: (studentsRes as RowDataPacket[]).map(({ username }) => username),
      };
    } catch (err) {
      throw err;
    }
  }

  async saveProject(username: string, projectId: string): Promise<void> {
    try {
      await this.db.execute(SQL.saveProject, [username, projectId]);
    } catch (err) {
      throw err;
    }
  }

  async unsaveProject(username: string, projectId: string): Promise<void> {
    try {
      await this.db.execute(SQL.unsaveProject, [username, projectId]);
    } catch (err) {
      throw err;
    }
  }

  async saveStudent(username: string, targetUsername: string): Promise<void> {
    try {
      await this.db.execute(SQL.saveStudent, [username, targetUsername]);
    } catch (err) {
      throw err;
    }
  }

  async unsaveStudent(username: string, targetUsername: string): Promise<void> {
    try {
      await this.db.execute(SQL.unsaveStudent, [username, targetUsername]);
    } catch (err) {
      throw err;
    }
  }
}
