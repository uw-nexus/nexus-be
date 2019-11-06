import { Pool, RowDataPacket } from 'mysql2/promise';
import { Project, ProjectDetails, Location } from '../types';
import SQL from './sql/project';

export default class ProjectService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createProject(project: Project): Promise<string> {
    const { details, fields, skills, locations } = project;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const projectParams = [
        details.owner.email,
        details.title,
        details.description,
        details.startDate,
        details.endDate,
      ];
      const [projectRes] = await conn.execute(SQL.insertProject(details), projectParams);

      const projectId = projectRes['insertId'];
      await conn.execute(SQL.insertProjectFields(projectId), fields);
      await conn.execute(SQL.insertProjectSkills(projectId), skills);

      const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
      await conn.execute(SQL.insertProjectCities(locParams), [projectId, ...locParams]);

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
    try {
      const [res] = await this.db.execute(SQL.getProjectDetails, [projectId]);
      let projectDetails: ProjectDetails;

      if (res[0]) {
        projectDetails = {
          owner: {
            _id: res[0].ownerUserId,
            firstName: res[0].ownerFirstName,
            lastName: res[0].ownerLastName,
            email: res[0].ownerEmail,
          },
          title: res[0].title,
          description: res[0].description,
          startDate: res[0].startDate,
          endDate: res[0].endDate,
          status: res[0].status,
          createdAt: res[0].createdAt,
          updatedAt: res[0].updatedAt,
        };
      }

      return projectDetails;
    } catch (err) {
      throw new Error(`error fetching project details: ${err}`);
    }
  }

  async getProject(projectId: string): Promise<Project> {
    try {
      const projectDetails = await this.getProjectDetails(projectId);
      if (!projectDetails) return null;

      const [fieldsRes] = await this.db.execute(SQL.getProjectFields, [projectId]);
      const [skillsRes] = await this.db.execute(SQL.getProjectSkills, [projectId]);
      const [citiesRes] = await this.db.execute(SQL.getProjectCities, [projectId]);

      const project = {
        details: projectDetails,
        fields: (fieldsRes as RowDataPacket[]).map(row => row.field),
        skills: (skillsRes as RowDataPacket[]).map(row => row.skill),
        locations: citiesRes as Location[],
      };

      return project;
    } catch (err) {
      throw new Error(`error fetching project: ${err}`);
    }
  }

  async updateProject(projectId: string, project: Project): Promise<void> {
    const { details, fields, skills, locations } = project;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      const projectParams = [
        details.title,
        details.description,
        details.startDate,
        details.endDate,
        details.status,
      ].filter(Boolean);

      await conn.execute(SQL.updateProjectDetails(details), [...projectParams, projectId]);
      await conn.execute(SQL.deleteOldProjectFields(fields), [projectId, ...fields]);
      await conn.execute(SQL.insertNewProjectFields(fields), [projectId, ...fields, projectId]);
      await conn.execute(SQL.deleteOldProjectSkills(skills), [projectId, ...skills]);
      await conn.execute(SQL.insertNewProjectSkills(skills), [projectId, ...skills, projectId]);

      const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
      await conn.execute(SQL.deleteOldProjectCities(locParams), [projectId, ...locParams]);
      await conn.execute(SQL.insertNewProjectCities(locParams), [projectId, ...locParams, projectId]);

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error updating project: ${err}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      await conn.execute(SQL.deleteProjectFields, [projectId]);
      await conn.execute(SQL.deleteProjectSkills, [projectId]);
      await conn.execute(SQL.deleteProjectCities, [projectId]);
      await conn.execute(SQL.deleteProject, [projectId]);
      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw new Error(`error deleting project: ${err}`);
    }
  }
}
