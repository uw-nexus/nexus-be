import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../../types';
import * as SQL from './sql';

export default class ContractService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
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
}
