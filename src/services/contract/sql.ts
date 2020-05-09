// [projectId, studentUsername]
export const insertStudentContract = (): string => `
  INSERT INTO contract
  VALUES (
    null, ?,
    (
      SELECT S.student_id 
      FROM student S
      JOIN user U ON U.user_id = S.user_id
      WHERE U.username = ?
    ),
    (SELECT status_id FROM status WHERE name = "Pending"),
    CURDATE(), CURDATE()
  );
`;

// [studentId]
export const getStudentContracts = `
  SELECT
    C.contract_id AS contractId,
    OWNU.username AS ownerUsername,
    OWNS.first_name AS ownerFirstName,
    OWNS.last_name AS ownerLastName,
    P.project_id AS projectId,
    P.title AS projectTitle,
    D.name AS projectDuration,
    SZ.name AS projectSize,
    P.status AS projectStatus,
    P.potal AS projectPostal,
    STA.name AS contractStatus,
  FROM contract C
  JOIN student STU ON STU.student_id = C.student_id
  JOIN user ME ON ME.user_id = STU.user_id
  JOIN project P ON P.project_id = C.project_id
  JOIN user OWNU ON OWNU.user_id = P.owner_id
  JOIN student OWNS ON OWNS.user_id = OWNU.user_id
  JOIN status STA ON STA.status_id = C.status_id
  JOIN team_size SZ ON SZ.size_id = P.size_id
  JOIN duration D ON D.duration_id = P.duration_id
  WHERE ME.username = ?;
`;

// [status, contractId]
export const updateContractStatus = (): string => `
  UPDATE contract
  SET status_id = (SELECT status_id FROM status WHERE name = ?)
  WHERE contract_id = ?;
`;
