import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import StudentService from '../services/student';
import { User, Student, StudentProfile } from '../types';

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

const searchStudents = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  let { filters } = req.body;
  const { lastScore, lastId } = req.body;

  if (!filters) filters = {};
  filters.details = filters.details || {};
  filters.skills = filters.skills || [];
  filters.roles = filters.roles || [];
  filters.interests = filters.interests || [];

  try {
    const projects = await srv.searchStudents(filters, lastScore, lastId);
    res.json(projects);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const studentService = new StudentService(db);

  router.get('/:username', getStudent(studentService));
  router.post('/', createStudent(studentService));
  router.patch('/', updateStudent(studentService));
  router.delete('/', deleteStudent(studentService));
  router.post('/search', searchStudents(studentService));

  return router;
};
