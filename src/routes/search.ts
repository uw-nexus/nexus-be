import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import SearchService from '../services/search';

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
  const searchService = new SearchService(db);

  router.post('/projects', searchProjects(searchService));
  router.post('/students', searchStudents(searchService));

  return router;
};
