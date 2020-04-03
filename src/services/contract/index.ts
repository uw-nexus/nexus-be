import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../../types';
import * as SQL from './sql';

export default class ContractService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudentContract(contract: Contract): Promise<string> {
    const { project, student, startDate, endDate } = contract;

    try {
      const params = [project.projectId, student.user.username, startDate, endDate].filter(Boolean);
      const [res] = await this.db.execute(SQL.insertStudentContract(contract), params);
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
            title: row.projectTitle,
            owner: {
              user: { username: row.ownerUsername },
              firstName: row.ownerFirstName,
              lastName: row.ownerLastName,
            },
          },
          startDate: row.contractStartDate,
          endDate: row.contractEndDate,
          status: row.contractStatus,
        };

        return c;
      });

      return contracts;
    } catch (err) {
      throw err;
    }
  }

  async updateStudentContract(contractId: string, contract: Contract): Promise<void> {
    try {
      const { startDate, endDate, status } = contract;
      const params = [startDate, endDate, status, contractId].filter(Boolean);
      await this.db.execute(SQL.updateStudentContract(contract), params);
    } catch (err) {
      throw err;
    }
  }
}
