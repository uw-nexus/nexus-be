import { Contract } from '../../types';

// [projectid, st./contractrtDate, endDate, status]
export const insertStudentContract = (contract: Contract): string => `
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
    (SELECT status_id FROM status WHERE name = "Pending"),
    CURDATE(), CURDATE()
  );
`;

// [studentId]
export const getStudentContracts = `
  SELECT
    C.contract_id AS contractId,
    C.start_date AS contractStartDate,
    C.end_date AS contractEndDate,
    STA.name AS contractStatus,
    P.project_id AS projectId,
    P.title AS projectTitle
  FROM contract C
  JOIN student STU ON STU.student_id = C.student_id
  JOIN user US ON US.user_id = STU.user_id
  JOIN project P ON P.project_id = C.project_id
  JOIN status STA ON STA.status_id = C.status_id
  WHERE US.username = ?;
`;

// [startDate, endDate, status, contractId]
export const updateStudentContract = (contract: Contract): string => `
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
