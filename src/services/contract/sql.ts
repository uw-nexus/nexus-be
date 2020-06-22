// [projectId]
export const getOwnerUsername = `
  SELECT U.username
  FROM user U
  JOIN project P ON P.owner_id = U.user_id
  WHERE P.project_id = ?;
`;

// [projectId, studentUsername]
export const insertStudentContract = `
  INSERT INTO contract
  VALUES (
    null, ?,
    (
      SELECT S.student_id 
      FROM student S
      JOIN user U ON U.user_id = S.user_id
      WHERE U.username = ?
    ),
    (SELECT status_id FROM status WHERE name = 'Active'),
    CURDATE(), CURDATE()
  );
`;

// [username]
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
    PSTAT.name AS projectStatus,
    P.postal AS projectPostal,
    CSTAT.name AS contractStatus
  FROM contract C
  JOIN student STU ON STU.student_id = C.student_id
  JOIN user ME ON ME.user_id = STU.user_id
  JOIN project P ON P.project_id = C.project_id
  JOIN user OWNU ON OWNU.user_id = P.owner_id
  JOIN student OWNS ON OWNS.user_id = OWNU.user_id
  JOIN status CSTAT ON CSTAT.status_id = C.status_id
  JOIN status PSTAT ON PSTAT.status_id = C.status_id
  JOIN team_size SZ ON SZ.size_id = P.size_id
  JOIN duration D ON D.duration_id = P.duration_id
  WHERE ME.username = ?;
`;

// [status, contractId]
export const updateContractStatus = `
  UPDATE contract
  SET status_id = (SELECT status_id FROM status WHERE name = ?)
  WHERE contract_id = ?;
`;

// [sender, recipient]
export const insertInvite = `
  INSERT INTO invite
  VALUES (
    (SELECT user_id FROM user WHERE username = ?),
    (SELECT user_id FROM user WHERE username = ?),
    (SELECT status_id FROM status WHERE name = 'Active')
  );
`;

// [status, sender, recipient]
export const updateInviteStatus = `
  UPDATE invite INV
  JOIN user U1 ON U1.user_id = INV.sender_id
  JOIN user U2 ON U2.user_id = INV.recipient_id
  SET INV.status_id = (SELECT status_id FROM status WHERE name = ?)
  WHERE U1.username = ? AND U2.username = ?;
`;

// [username]
export const getInvites = `
  SELECT
    U1.username AS senderUsername,
    STU.first_name AS senderFirstName,
    STU.last_name AS senderLastName,
    STU.email AS senderEmail 
  FROM invite INV
  JOIN user U1 ON U1.user_id = INV.sender_id
  JOIN student STU ON STU.user_id = U1.user_id
  JOIN user U2 ON U2.user_id = INV.recipient_id
  JOIN status STA ON STA.status_id = INV.status_id
  WHERE STA.name = 'Active'
  AND U2.username = ?;
`;

// [username]
export const getRequests = `
  SELECT
    C.contract_id AS contractId,
    U2.username AS studentUsername,
    STU.first_name AS studentFirstName,
    STU.last_name AS studentLastName,
    STU.email AS studentEmail,
    P.title AS projectTitle
  FROM user U1
  JOIN project P ON P.owner_id = U1.user_id
  JOIN contract C ON C.project_id = P.project_id
  JOIN student STU ON STU.student_id = C.student_id
  JOIN user U2 ON U2.user_id = STU.user_id
  JOIN status STA ON STA.status_id = C.status_id
  WHERE STA.name = 'Active'
  AND U1.username = ?;
`;
