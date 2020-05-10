import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import SaveService from '../services/save';
import { User } from '../types';

const getSavedEntityIds = (srv: SaveService) => async (req: Request, res: Response): Promise<void> => {
  const { username } = req.user as User;

  try {
    const saved = await srv.getSavedEntityIds(username);
    res.json(saved);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const saveProject = (srv: SaveService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { username } = req.user as User;

  try {
    await srv.saveProject(username, projectId);
    res.json({ success: `Project: ${projectId} is marked as saved.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const unsaveProject = (srv: SaveService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { username } = req.user as User;

  try {
    await srv.unsaveProject(username, projectId);
    res.json({ success: `Project: ${projectId} no longer saved.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const saveStudent = (srv: SaveService) => async (req: Request, res: Response): Promise<void> => {
  const { targetUsername } = req.params;
  const { username } = req.user as User;

  try {
    await srv.saveStudent(username, targetUsername);
    res.json({ success: `Student: ${targetUsername} is marked as saved.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const unsaveStudent = (srv: SaveService) => async (req: Request, res: Response): Promise<void> => {
  const { targetUsername } = req.params;
  const { username } = req.user as User;

  try {
    await srv.unsaveStudent(username, targetUsername);
    res.json({ success: `Student: ${targetUsername} no longer saved.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const saveService = new SaveService(db);

  router.get('/', getSavedEntityIds(saveService));
  router.post('/projects/:projectId', saveProject(saveService));
  router.delete('/projects/:projectId', unsaveProject(saveService));
  router.post('/students/:targetUsername', saveStudent(saveService));
  router.delete('/students/:targetUsername', unsaveStudent(saveService));

  return router;
};
