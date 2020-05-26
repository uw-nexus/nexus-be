import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../../types';
import * as SQL from './sql';

export default class ContractService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudentContract(contract: Contract): Promise<string> {
    const { project, student } = contract;

    try {
      const params = [project.projectId, student.user.username];
      const [res] = await this.db.execute(SQL.insertStudentContract, params);
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
