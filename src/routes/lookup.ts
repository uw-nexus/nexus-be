import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import LookupService from '../services/lookup';

const getArrayChoices = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const choices = await srv.getArrayChoices();
    res.json(choices);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getProjectChoices = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const choices = await srv.getProjectChoices();
    res.json(choices);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getStudentChoices = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const choices = await srv.getStudentChoices();
    res.json(choices);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const lookupService = new LookupService(db);
  router.get('/', getArrayChoices(lookupService));
  router.get('/projects', getProjectChoices(lookupService));
  router.get('/students', getStudentChoices(lookupService));
  return router;
};
