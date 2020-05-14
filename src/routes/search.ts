import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import SearchService from '../services/search';

const getProjectFilterChoices = (srv: SearchService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = await srv.getProjectFilterChoices();
    res.json(filters);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getStudentFilterChoices = (srv: SearchService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = await srv.getStudentFilterChoices();
    res.json(filters);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const searchProjects = (srv: SearchService) => async (req: Request, res: Response): Promise<void> => {
  let { filters } = req.body;
  const { lastScore, lastId } = req.body;

  if (!filters) filters = {};
  filters.details = filters.details || {};
  filters.skills = filters.skills || [];
  filters.roles = filters.roles || [];
  filters.interests = filters.interests || [];

  try {
    const projects = await srv.searchProjects(filters, lastScore, lastId);
    res.json(projects);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const searchStudents = (srv: SearchService) => async (req: Request, res: Response): Promise<void> => {
  let { filters } = req.body;
  const { lastScore, lastId } = req.body;

  if (!filters) filters = {};
  filters.profile = filters.profile || {};
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
  const searchService = new SearchService(db);

  router.get('/filters/projects', getProjectFilterChoices(searchService));
  router.get('/filters/students', getStudentFilterChoices(searchService));
  router.post('/projects', searchProjects(searchService));
  router.post('/students', searchStudents(searchService));

  return router;
};
