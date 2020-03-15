import { Pool, RowDataPacket } from 'mysql2/promise';
import { Project, ProjectDetails, Location, Contract } from '../../types';
import * as SQL from './sql';

export default class ProjectService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async validateOwner(projectId: string, username: string): Promise<void> {
    const [res] = await this.db.execute(SQL.getOwnerUsername, [projectId]);
    if (!res[0] || username != res[0].username) {
      throw new Error('Unauthorized operation on project.');
    }
  }

  async createProject(username: string, details: ProjectDetails): Promise<string> {
    const { title, description, startDate, endDate } = details;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();
      const projectParams = [username, title, description, startDate, endDate];
      const [projectRes] = await conn.execute(SQL.insertProject(details), projectParams);
      const projectId = projectRes['insertId'];

      await conn.commit();
      conn.release();

      return projectId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async getProjectDetails(projectId: string): Promise<ProjectDetails> {
    try {
      const [res] = await this.db.execute(SQL.getProjectDetailsById, [projectId]);
      let projectDetails: ProjectDetails;

      if (res[0]) {
        projectDetails = {
          owner: {
            user: { username: res[0].ownerUsername },
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
      throw err;
    }
  }

  async getProjectsOwned(username: string): Promise<ProjectDetails[]> {
    try {
      const [res] = await this.db.execute(SQL.getProjectsOwned, [username]);
      return res as ProjectDetails[];
    } catch (err) {
      throw err;
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
      throw err;
    }
  }

  async getProjectContracts(username: string, projectId: string): Promise<Contract[]> {
    await this.validateOwner(projectId, username);

    try {
      const [contractsRes] = await this.db.execute(SQL.getProjectContracts, [projectId]);

      const contracts: Contract[] = (contractsRes as RowDataPacket[]).map(c => ({
        contractId: c.contractId,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        student: {
          firstName: c.firstName,
          lastName: c.lastName,
          user: {
            username: c.username,
          },
        },
      }));

      return contracts;
    } catch (err) {
      throw err;
    }
  }

  async updateProject(username: string, projectId: string, project: Project): Promise<void> {
    await this.validateOwner(projectId, username);
    const { details, fields, skills, locations } = project;
    const conn = await this.db.getConnection();

    try {
      conn.beginTransaction();

      if (details) {
        const projectParams = [
          details.title,
          details.description,
          details.startDate,
          details.endDate,
          details.status,
        ].filter(Boolean);
        await conn.execute(SQL.updateProjectDetails(details), [...projectParams, projectId]);
      }

      if (fields) {
        await conn.execute(SQL.addToFieldsCatalog(fields), fields);
        await conn.execute(SQL.deleteOldProjectFields(fields), [projectId, ...fields]);
        await conn.execute(SQL.insertNewProjectFields(fields), [projectId, ...fields, projectId]);
      }

      if (skills) {
        await conn.execute(SQL.addToSkillsCatalog(skills), skills);
        await conn.execute(SQL.deleteOldProjectSkills(skills), [projectId, ...skills]);
        await conn.execute(SQL.insertNewProjectSkills(skills), [projectId, ...skills, projectId]);
      }

      if (locations) {
        const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
        await conn.execute(SQL.deleteOldProjectCities(locParams), [projectId, ...locParams]);
        await conn.execute(SQL.insertNewProjectCities(locParams), [projectId, ...locParams, projectId]);
      }

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async deleteProject(username: string, projectId: string): Promise<void> {
    await this.validateOwner(projectId, username);
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
      throw err;
    }
  }

  async searchProjects(filters: Project, offset = 0, count = 10): Promise<ProjectDetails[]> {
    const { title, startDate, endDate, status } = filters.details;
    const { fields, skills, locations } = filters;

    const locParams = locations.map(l => [l.city, l.state, l.country].join(', '));
    const m2mParams = [...fields, ...skills, ...locParams];
    const detailsParams = [title ? `%${title}%` : '', startDate, endDate, status];
    let finalParams = [];

    if (m2mParams.length) {
      finalParams = [...m2mParams, offset, count, ...detailsParams];
    } else {
      finalParams = [...detailsParams, offset, count];
    }

    finalParams = finalParams.filter(p => p || p === 0);

    const [res] = await this.db.execute(SQL.searchProjects(filters), finalParams);
    const projects: ProjectDetails[] = (res as RowDataPacket[]).map(row => {
      return {
        id: row.projectId,
        owner: {
          user: { username: row.ownerUsername },
          firstName: row.ownerFirstName,
          lastName: row.ownerLastName,
        },
        title: row.title,
        status: row.status,
        createdAt: row.createdAt,
      };
    });

    return projects;
  }
}
