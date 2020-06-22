import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../../types';
import * as SQL from './sql';

import algoliasearch, { SearchIndex } from 'algoliasearch';
import { ALGOLIA_APP_ID, ALGOLIA_API_KEY } from '../../config';

export default class ContractService {
  db: Pool;
  projectIndex: SearchIndex;
  studentIndex: SearchIndex;

  constructor(promisePool: Pool) {
    this.db = promisePool;
    const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    this.projectIndex = searchClient.initIndex('projects');
    this.studentIndex = searchClient.initIndex('students');
  }

  async validateContract(actorUsername: string, projectId: string, studentUsername: string): Promise<void> {
    const [res] = await this.db.execute(SQL.getOwnerUsername, [projectId]);
    if (!res[0] || (actorUsername !== res[0].username && actorUsername !== studentUsername)) {
      throw new Error('Unauthorized operation on project.');
    }
  }

  async createStudentContract(actorUsername: string, projectId: string, studentUsername: string): Promise<string> {
    await this.validateContract(actorUsername, projectId, studentUsername);

    try {
      const [res] = await this.db.execute(SQL.insertStudentContract, [projectId, studentUsername]);
      return res['insertId'];
    } catch (err) {
      throw err;
    }
  }

  async getStudentContracts(studentUsername: string): Promise<Contract[]> {
    try {
      const [res] = await this.db.execute(SQL.getStudentContracts, [studentUsername]);
      const contracts: Contract[] = (res as RowDataPacket[]).map(row => {
        const c: Contract = {
          contractId: row.contractId,
          project: {
            projectId: row.projectId,
            owner: {
              user: { username: row.ownerUsername },
              firstName: row.ownerFirstName,
              lastName: row.ownerLastName,
            },
            title: row.projectTitle,
            status: row.projectStatus,
            duration: row.projectDuration,
            size: row.projectSize,
            postal: row.projectPostal,
          },
          status: row.contractStatus,
        };

        return c;
      });

      return contracts;
    } catch (err) {
      throw err;
    }
  }

  async updateContractStatus(contractId: string, status: string): Promise<void> {
    try {
      await this.db.execute(SQL.updateContractStatus, [status, contractId]);
    } catch (err) {
      throw err;
    }
  }

  async createInvite(sender: string, recipient: string): Promise<string> {
    try {
      const [res] = await this.db.execute(SQL.insertInvite, [sender, recipient]);
      return res['insertId'];
    } catch (err) {
      throw err;
    }
  }

  async updateInviteStatus(sender: string, recipient, status: string): Promise<void> {
    try {
      await this.db.execute(SQL.updateInviteStatus, [status, sender, recipient]);
    } catch (err) {
      throw err;
    }
  }

  async getStudentNotifications(username: string): Promise<unknown> {
    const res = {
      invites: [],
      requests: [],
    };

    try {
      const [invitesRes] = await this.db.execute(SQL.getInvites, [username]);
      const invites = (invitesRes as RowDataPacket[]).map(row => ({
        username: row.senderUsername,
        firstName: row.senderFirstName,
        lastName: row.senderLastName,
        email: row.senderEmail,
        roles: [],
        projects: [],
      }));

      if (invites.length > 0) {
        const mappings = invites.reduce((curr, inv) => {
          curr.set(inv.username, { roles: [], projects: [] });
          return curr;
        }, new Map<string, { roles: string[]; projects: unknown[] }>());

        const projectFilters = invites.map((inv): string => `owner:"${inv.username}"`).join(' OR ');
        const projectsRes = await this.projectIndex.search('', { filters: projectFilters });
        projectsRes.hits.forEach(proj => {
          const { owner, title, objectID } = (proj as unknown) as { owner: string; title: string; objectID: string };
          mappings.get(owner).projects.push({
            title,
            projectId: objectID,
          });
        });

        const rolesRes = await this.studentIndex.getObjects(invites.map((inv): string => inv.username));
        rolesRes.results.forEach(user => {
          const { objectID, roles } = (user as unknown) as { objectID: string; roles: string[] };
          mappings.get(objectID).roles = roles;
        });

        invites.forEach(inv => {
          inv.roles = mappings.get(inv.username).roles || [];
          inv.projects = mappings.get(inv.username).projects || [];
        });

        res.invites = invites;
      }

      const [requestsRes] = await this.db.execute(SQL.getRequests, [username]);
      const requests = (requestsRes as RowDataPacket[]).map(row => ({
        contractId: row.contractId,
        student: {
          username: row.studentUsername,
          firstName: row.studentFirstName,
          lastName: row.studentLastName,
          email: row.studentEmail,
          roles: [],
        },
        project: row.projectTitle,
      }));

      if (requests.length > 0) {
        const roleMappings = new Map<string, string[]>();

        const rolesRes = await this.studentIndex.getObjects(requests.map((req): string => req.student.username));
        rolesRes.results.forEach(student => {
          const { username, roles } = (student as unknown) as { username: string; roles: string[] };
          roleMappings.set(username, roles);
        });

        requests.forEach(req => {
          req.student.roles = roleMappings.get(req.student.username) || [];
        });

        res.requests = requests;
      }

      return res;
    } catch (err) {
      throw err;
    }
  }
}
