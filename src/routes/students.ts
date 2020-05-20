import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import StudentService from '../services/student';
import { User, Student, StudentProfile } from '../types';

/**
 * @apiDefine StudentGroup Student API
 *
 * Handles all Student operations.
 */

const createStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const profile = req.body as StudentProfile;
  const { username } = req.user as User;

  try {
    const studentId = await srv.createStudent(username, profile);
    res.json({ studentId });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  try {
    const student = await srv.getStudent(username);
    res.json(student);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const updateStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const student = req.body as Student;
  const { username } = req.user as User;

  try {
    await srv.updateStudent(username, student);
    res.json({ success: `Student: ${username} updated.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const deleteStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const { username } = req.user as User;

  try {
    await srv.deleteStudent(username);
    res.json({ success: `Student: ${username} deleted from database.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const studentService = new StudentService(db);

  /**
   * @api {get} /students/:username Get Student
   * @apiGroup StudentGroup
   * @apiName GetStudent
   *
   * @apiUse JwtHeader
   *
   * @apiParam {String} username Student username
   *
   * @apiSuccess {Object} profile                 Student profile
   * @apiSuccess {Object} profile.user            Student user
   * @apiSuccess {String} profile.user.username   Student username
   * @apiSuccess {String} profile.firstName       Student first name
   * @apiSuccess {String} profile.lastName        Student last name
   * @apiSuccess {String} profile.email           Student email
   * @apiSuccess {String} profile.bio             Student bio
   * @apiSuccess {String} profile.school          Student school
   * @apiSuccess {String} profile.degree          Student degree
   * @apiSuccess {String} profile.major1          Student major1
   * @apiSuccess {String} profile.major2          Student major2
   * @apiSuccess {String} profile.resume          Student resume URL
   * @apiSuccess {String} profile.linkedin        Student LinkedIn URL
   * @apiSuccess {String} profile.website         Student website URL
   * @apiSuccess {String} profile.postal          Student postal code
   * @apiSuccess {String} profile.photoUrl        Student photo URL
   * @apiSuccess {String[]} skills                Student skills
   * @apiSuccess {String[]} roles                 Student roles
   * @apiSuccess {String[]} interests             Student interests
   */
  router.get('/:username', getStudent(studentService));

  /**
   * @api {post} /students Create a new Student
   * @apiGroup StudentGroup
   * @apiName CreateStudent
   *
   * @apiUse JwtHeader
   *
   * @apiParam {String} firstName  Student first name
   * @apiParam {String} lastName   Student last name
   * @apiParam {String} email      Student email
   *
   * @apiSuccess {Number} studentId Student ID (not username)
   */
  router.post('/', createStudent(studentService));

  /**
   * @api {patch} /students Update Student
   * @apiGroup StudentGroup
   * @apiName UpdateStudent
   *
   * @apiUse JwtHeader
   *
   * @apiParam {Object} profile              Student profile
   * @apiParam {String} [profile.bio]        Student bio
   * @apiParam {String} [profile.school]     Student school
   * @apiParam {String} [profile.degree]     Student degree
   * @apiParam {String} [profile.major1]     Student major1
   * @apiParam {String} [profile.major2]     Student major2
   * @apiParam {String} [profile.resume]     Student resume URL
   * @apiParam {String} [profile.linkedin]   Student LinkedIn URL
   * @apiParam {String} [profile.website]    Student website URL
   * @apiParam {String} [profile.postal]     Student postal code
   * @apiParam {String} [profile.photoUrl]   Student photo URL
   * @apiParam {String[]} skills             Student skills
   * @apiParam {String[]} roles              Student roles
   * @apiParam {String[]} interests          Student interests
   */
  router.patch('/', updateStudent(studentService));

  /**
   * @api {delete} /students Delete Student
   * @apiGroup StudentGroup
   * @apiName DeleteStudent
   *
   * @apiUse JwtHeader
   */
  router.delete('/', deleteStudent(studentService));

  return router;
};
