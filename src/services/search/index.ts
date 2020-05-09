import { Pool, RowDataPacket } from 'mysql2/promise';
import { Project, Student } from '../../types';
import * as SQL from './sql';

export default class SearchService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async searchProjects(filters: Project, lastScore: number = null, lastId: number = null): Promise<Project[]> {
    const { title, size, duration, status } = filters.details;
    const { interests, skills, roles } = filters;

    const m2mParams = [...interests, ...skills, ...roles];
    const detailsParams = [title, size, duration, status];
    const finalParams = [...m2mParams, ...detailsParams, lastScore, lastScore, lastId].filter(Boolean);

    const [res] = await this.db.execute(SQL.searchProjects(filters, lastScore, lastId), finalParams);
    const projects: Project[] = (res as RowDataPacket[]).map(row => {
      return {
        details: {
          projectId: row.projectId,
          title: row.title,
          status: row.status,
          duration: row.duration,
          size: row.size,
          postal: row.postal,
        },
        skills: row.skills ? row.skills.split(',') : [],
        roles: row.roles ? row.roles.split(',') : [],
        interests: row.interests ? row.interests.split(',') : [],
        score: row.score,
      };
    });

    return projects;
  }

  async searchStudents(filters: Student, lastScore: number = null, lastId: number = null): Promise<Student[]> {
    const { degree, major1 } = filters.profile;
    const { interests, skills, roles } = filters;

    const m2mParams = [...interests, ...skills, ...roles];
    const finalParams = [...m2mParams, degree, major1, lastScore, lastScore, lastId].filter(Boolean);

    const [res] = await this.db.execute(SQL.searchStudents(filters, lastScore, lastId), finalParams);
    const students: Student[] = (res as RowDataPacket[]).map(row => {
      return {
        profile: {
          user: {
            username: row.username,
          },
          firstName: row.firstName,
          lastName: row.lastName,
          degree: row.degree,
          major1: row.major1,
          major2: row.major2,
          postal: row.postal,
        },
        skills: row.skills ? row.skills.split(',') : [],
        roles: row.roles ? row.roles.split(',') : [],
        interests: row.interests ? row.interests.split(',') : [],
        score: row.score,
      };
    });

    return students;
  }
}
