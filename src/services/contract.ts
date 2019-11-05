import { Pool, RowDataPacket } from 'mysql2/promise';
import { Contract } from '../types';

export default class ContractService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async createStudentContract(contract: Contract): Promise<string> {
    const { project, student, startDate, endDate, status } = contract;

    const statement = `
      INSERT INTO contract
      VALUES (
        null, ?,
        (SELECT student_id FROM student WHERE email = ?),
        ${startDate ? '?,' : ''}
        ${endDate ? '?,' : ''}
        (SELECT status_id FROM status WHERE name = ?),
        CURDATE(), CURDATE()
      );
    `;

    try {
      const params = [project._id, student.email, startDate, endDate, status].filter(Boolean);
      const [res] = await this.db.execute(statement, params);
      return res['insertId'];
    } catch (err) {
      console.log(`error registering student into project ${err}`);
      return null;
    }
  }

  async getStudentContracts(studentId: string): Promise<Contract[]> {
    const statement = `
      SELECT 
        C.start_date AS contractStartDate,
        C.end_date AS contractEndDate, 
        O.first_name AS ownerFirstName, 
        O.last_name AS ownerLastName,
        O.email AS ownerEmail,
        P.project_id AS projectId,
        P.description AS projDescription,
        P.start_date AS projStartDate, 
        P.end_date AS projEndDate,
        S.name AS contractStatus
      FROM contract C
      JOIN project P ON P.project_id = C.project_id
      JOIN student O ON O.user_id = P.owner_id
      JOIN status S ON S.status_id = C.status_id
      WHERE C.student_id = ?;
    `;

    try {
      const [res] = await this.db.execute(statement, [studentId]);
      const contracts: Contract[] = (res as RowDataPacket[]).map(row => {
        return {
          project: {
            _id: row['projectId'],
            owner: {
              firstName: row['ownerFirstName'],
              lastName: row['ownerLastName'],
              email: row['ownerEmail'],
            },
            description: row['projDescription'],
            startDate: row['projStartDate'],
            endDate: row['projEndDate'],
          },
          startDate: row['contractStartDate'],
          endDate: row['contractEndDate'],
          status: row['contractStatus'],
        };
      });

      return contracts;
    } catch (err) {
      console.log(`error fetching projects that student is part of: ${err}`);
      return null;
    }
  }

  async updateStudentContract(contractId: string, contract: Contract): Promise<void> {
    const statement = `
      UPDATE contract
      SET 
        ${[
          contract.startDate ? 'start_date = ?' : '',
          contract.endDate ? 'end_date = ?' : '',
          contract.status ? 'status_id = (SELECT status_id FROM status WHERE name = ?)' : '',
        ]
          .filter(Boolean)
          .join(', ')}
      WHERE contract_id = ?;
    `;

    try {
      const { startDate, endDate, status } = contract;
      const params = [startDate, endDate, status].filter(Boolean);
      await this.db.execute(statement, [...params, contractId]);
    } catch (err) {
      console.log(`error updating student contract: ${err}`);
    }
  }
}
