// [username]
export const getSavedProjects = `
  SELECT SP.project_id AS projectId
  FROM saved_project SP
  JOIN student S ON S.student_id = SP.student_id
  JOIN user U ON U.user_id = S.user_id
  WHERE U.username = ?
`;

// [username]
export const getSavedStudents = `
  SELECT U2.username
  FROM saved_student SS
  JOIN student S1 ON S1.student_id = SS.student_id
  JOIN user U1 ON U1.user_id = S1.user_id
  JOIN student S2 ON S2.student_id = SS.target_student_id
  JOIN user U2 ON U2.user_id = S2.user_id
  WHERE U1.username = ?
`;

// [username, projectId]
export const saveProject = `
  INSERT INTO saved_project
  VALUES ((
    SELECT S.student_id
    FROM student S
    JOIN user U ON U.user_id = S.user_id
    WHERE U.username = ?
  ), ?);
`;

// [username, projectId]
export const unsaveProject = `
  DELETE SP
  FROM saved_project SP
  JOIN student S ON S.student_id = SP.student_id
  JOIN user U ON U.user_id = S.user_id
  WHERE U.username = ?
  AND SP.project_id = ?;
`;

// [username, targetStudentUsername]
export const saveStudent = `
  INSERT INTO saved_student
  VALUES (
    (
      SELECT S.student_id
      FROM student S
      JOIN user U ON U.user_id = S.user_id
      WHERE U.username = ?
    ), (
      SELECT S.student_id
      FROM student S
      JOIN user U ON U.user_id = S.user_id
      WHERE U.username = ?
    )
  );
`;

// [username, targetStudentUsername]
export const unsaveStudent = `
  DELETE SS
  FROM saved_student SS
  JOIN student S1 ON S1.student_id = SS.student_id
  JOIN user U1 ON U1.user_id = S1.user_id
  JOIN student S2 ON S2.student_id = SS.target_student_id
  JOIN user U2 ON U2.user_id = S2.user_id
  WHERE U1.username = ?
  AND U2.username = ?;
`;
