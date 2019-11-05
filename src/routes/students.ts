import { Application, Router, Request, Response } from 'express';
import StudentService from '../services/student';
import { Pool } from 'mysql2/promise';
import { StudentProfile } from '../types';
import registerContractRoutes from './contracts';

const createStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const student = {
    profile: req.body.profile as StudentProfile,
    majors: req.body.majors,
    skills: req.body.skills,
  };

  try {
    const studentId = await srv.createStudent(student);
    res.json({ studentId });
  } catch (error) {
    res.json({ error });
  }
};

const getStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  try {
    const student = await srv.getStudent(studentId);
    res.json({ student });
  } catch (error) {
    res.json({ error });
  }
};

const updateStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const student = {
    profile: req.body.profile as StudentProfile,
    majors: req.body.majors,
    skills: req.body.skills,
  };

  try {
    await srv.updateStudent(studentId, student);
    res.json({ success: `Student id: ${studentId} updated.` });
  } catch (error) {
    res.json({ error });
  }
};

const deleteStudent = (srv: StudentService) => async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  try {
    await srv.getStudent(studentId);
    res.json({ success: `Student id: ${studentId} deleted from database.` });
  } catch (error) {
    res.json({ error });
  }
};

export default (app: Application, db: Pool): void => {
  const router = Router();
  const studentService = new StudentService(db);

  router.post('/', createStudent(studentService));
  router.get('/:studentId', getStudent(studentService));
  router.patch('/:studentId', updateStudent(studentService));
  router.delete('/:studentId', deleteStudent(studentService));

  registerContractRoutes(router, db);
  app.use('/students', router);
};
