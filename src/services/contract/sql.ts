import { Contract } from '../../types';

// [projectid, st./contractrtDate, endDate, status]
const insertStudentContract = (contract: Contract): string => `
  INSERT INTO contract
  VALUES (
    null, ?,
    (
      SELECT S.student_id 
      FROM student S
      JOIN user U ON U.user_id = S.user_id
      WHERE U.username = ?
    ),
    ${contract.startDate ? '?,' : ''}
    ${contract.endDate ? '?,' : ''}
    '(SELECT status_id FROM status WHERE name = "Pending")',
    CURDATE(), CURDATE()
  );
`;

// [studentId]
const getStudentContracts = `
  SELECT
    C.contract_id AS contractId,
    C.start_date AS contractStartDate,
    C.end_date AS contractEndDate,
    S.name AS contractStatus,
    P.project_id AS projectId,
    P.title AS projectTitle
  FROM contract C
  JOIN student S ON S.student_id = C.student_id
  JOIN user US ON US.user_id = S.user_id
  JOIN project P ON P.project_id = C.project_id
  JOIN status S ON S.status_id = C.status_id
  WHERE US.username = ?;
`;

// [startDate, endDate, status, contractId]
const updateStudentContract = (contract: Contract): string => `
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

export default {
  insertStudentContract,
  getStudentContracts,
  updateStudentContract,
};
