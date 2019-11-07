import { Contract } from '../../types';

// [projectid, st./contractrtDate, endDate, status]
const insertStudentContract = (contract: Contract): string => `
  INSERT INTO contract
  VALUES (
    null, ?,
    (SELECT student_id FROM student WHERE email = ?),
    ${contract.startDate ? '?,' : ''}
    ${contract.endDate ? '?,' : ''}
    (SELECT status_id FROM status WHERE name = ?),
    CURDATE(), CURDATE()
  );
`;

// [studentId]
const getStudentContracts = `
  SELECT
    C.contract_id AS contractId,
    C.start_date AS contractStartDate,
    C.end_date AS contractEndDate, 
    O.first_name AS ownerFirstName, 
    O.last_name AS ownerLastName,
    O.email AS ownerEmail,
    P.project_id AS projectId,
    P.title AS projectTitle,
    P.start_date AS projStartDate, 
    P.end_date AS projEndDate,
    S.name AS contractStatus
  FROM contract C
  JOIN project P ON P.project_id = C.project_id
  JOIN student O ON O.user_id = P.owner_id
  JOIN status S ON S.status_id = C.status_id
  WHERE C.student_id = ?;
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
