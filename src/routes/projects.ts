import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import ProjectService from '../services/project';
import { User, Project, ProjectDetails } from '../types';

const createProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const details = req.body as ProjectDetails;
  const { username } = req.user as User;

  try {
    const projectId = await srv.createProject(username, details);
    res.json({ projectId });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getProjectsOwned = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { username } = req.user as User;

  try {
    const projects = await srv.getProjectsOwned(username);
    res.json(projects);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getProjectById = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  try {
    const project = await srv.getProject(projectId);
    res.json(project);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getProjectContracts = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { username } = req.user as User;

  try {
    const contracts = await srv.getProjectContracts(username, projectId);
    res.json(contracts);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const updateProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const project = req.body as Project;
  const { username } = req.user as User;

  try {
    await srv.updateProject(username, projectId, project);
    res.json({ success: `Project id: ${projectId} updated.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const deleteProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { username } = req.user as User;

  try {
    await srv.deleteProject(username, projectId);
    res.json({ success: `Project id: ${projectId} deleted from database.` });
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const searchProjects = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { filters, offset, count } = req.body;

  filters.details = filters.details || {};
  filters.fields = filters.fields || [];
  filters.skills = filters.skills || [];
  filters.locations = filters.locations || [];

  try {
    const projects = await srv.searchProjects(filters, offset, count);
    res.json(projects);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const projectService = new ProjectService(db);

  router.post('/', createProject(projectService));
  router.get('/owned', getProjectsOwned(projectService));
  router.get('/:projectId', getProjectById(projectService));
  router.get('/:projectId/contracts', getProjectContracts(projectService));
  router.patch('/:projectId', updateProject(projectService));
  router.delete('/:projectId', deleteProject(projectService));
  router.post('/search', searchProjects(projectService));

  return router;
};
