import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../types';
import SQL from './sql/contract';

export default class ContractService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudentContract(contract: Contract): Promise<string> {
    const { project, student, startDate, endDate, status } = contract;

    try {
      const params = [project._id, student.email, startDate, endDate, status].filter(Boolean);
      const [res] = await this.db.execute(SQL.insertStudentContract(contract), params);
      return res['insertId'];
    } catch (err) {
      throw new Error(`error registering student into project ${err}`);
    }
  }

  async getStudentContracts(studentId: string): Promise<Contract[]> {
    try {
      const [res] = await this.db.execute(SQL.getStudentContracts, [studentId]);
      const contracts: Contract[] = (res as RowDataPacket[]).map(row => {
        return {
          _id: row.contractId,
          project: {
            _id: row.projectId,
            owner: {
              firstName: row.ownerFirstName,
              lastName: row.ownerLastName,
              email: row.ownerEmail,
            },
            title: row.projectTitle,
            startDate: row.projStartDate,
            endDate: row.projEndDate,
          },
          startDate: row.contractStartDate,
          endDate: row.contractEndDate,
          status: row.contractStatus,
        };
      });

      return contracts;
    } catch (err) {
      throw new Error(`error fetching projects that student is part of: ${err}`);
    }
  }

  async updateStudentContract(contractId: string, contract: Contract): Promise<void> {
    try {
      const { startDate, endDate, status } = contract;
      const params = [startDate, endDate, status, contractId].filter(Boolean);
      await this.db.execute(SQL.updateStudentContract(contract), params);
    } catch (err) {
      throw new Error(`error updating student contract: ${err}`);
    }
  }
}
