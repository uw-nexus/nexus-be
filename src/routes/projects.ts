import { Application, Router, Request, Response } from 'express';
import ProjectService from '../services/project';
import { Pool } from 'mysql2/promise';
import { ProjectDetails } from '../types';

const createProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const project = {
    details: req.body.details as ProjectDetails,
    fields: req.body.fields,
    skills: req.body.skills,
    locations: req.body.locations,
  };

  try {
    const projectId = await srv.createProject(project);
    res.json({ projectId });
  } catch (error) {
    res.json({ error });
  }
};

const getProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  try {
    const project = await srv.getProject(projectId);
    res.json({ project });
  } catch (error) {
    res.json({ error });
  }
};

const updateProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  const project = {
    details: req.body.details as ProjectDetails,
    fields: req.body.fields,
    skills: req.body.skills,
    locations: req.body.locations,
  };

  try {
    await srv.updateProject(projectId, project);
    res.json({ success: `Project id: ${projectId} updated.` });
  } catch (error) {
    res.json({ error });
  }
};

const deleteProject = (srv: ProjectService) => async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  try {
    await srv.deleteProject(projectId);
    res.json({ success: `Project id: ${projectId} deleted from database.` });
  } catch (error) {
    res.json({ error });
  }
};

export default (app: Application, db: Pool): void => {
  const router = Router();
  const projectService = new ProjectService(db);

  router.post('/', createProject(projectService));
  router.get('/:projectId', getProject(projectService));
  router.patch('/:projectId', updateProject(projectService));
  router.delete('/:projectId', deleteProject(projectService));

  app.use('/projects', router);
};
