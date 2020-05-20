import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import SearchService from '../services/search';

/**
 * @apiDefine SearchGroup Search API
 *
 * Handles all Search operations.
 */

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

  /**
   * @api {post} /search/projects Search Projects
   * @apiDescription Returns an array of Projects, each in the response format shown below
   * @apiGroup SearchGroup
   * @apiName SearchProjects
   *
   * @apiUse JwtHeader
   *
   * @apiParam {Object}       filters                      Filters
   * @apiParam {Object}       filters.details              Project details
   * @apiParam {String}       [filters.details.title]      Project title
   * @apiParam {String}       [filters.details.duration]   Project duration
   * @apiParam {String}       [filters.details.size]       Project team size
   * @apiParam {String[]}     filters.skills               Project skills
   * @apiParam {String[]}     filters.roles                Project roles
   * @apiParam {String[]}     filters.interests            Project interests
   * @apiParam {Number}       [lastScore]                  Max search score (inclusive)
   * @apiParam {Number}       [lastId]                     Min project ID with lastScore (exclusive)
   *
   * @apiSuccess {Number}     score                        Search score
   * @apiSuccess {Object}     details                      Project details
   * @apiSuccess {String}     details.projectId            Project ID
   * @apiSuccess {String}     details.title                Project title
   * @apiSuccess {String}     details.status               Project status
   * @apiSuccess {String}     details.duration             Project duration
   * @apiSuccess {String}     details.size                 Project team size
   * @apiSuccess {String}     details.postal               Project postal code
   * @apiSuccess {String[]}   skills                       Project skills
   * @apiSuccess {String[]}   roles                        Project roles
   * @apiSuccess {String[]}   interests                    Project interests
   */
  router.post('/projects', searchProjects(searchService));

  /**
   * @api {post} /search/students Search Students
   * @apiDescription Returns an array of Students, each in the response format shown below
   * @apiGroup SearchGroup
   * @apiName SearchStudents
   *
   * @apiUse JwtHeader
   *
   * @apiParam {Object}       filters                        Filters
   * @apiParam {Object}       filters.profile                Student profile
   * @apiParam {String}       [filters.profile.firstName]    Student name, could be first, last, or full
   * @apiParam {String}       [filters.profile.degree]       Student degree
   * @apiParam {String}       [filters.profile.major1]       Student major (1st/2nd)
   * @apiParam {String[]}     filters.skills                 Student skills
   * @apiParam {String[]}     filters.roles                  Student roles
   * @apiParam {String[]}     filters.interests              Student interests
   * @apiParam {Number}       [lastScore]                    Max search score (inclusive)
   * @apiParam {Number}       [lastId]                       Min student ID with lastScore (exclusive)
   *
   * @apiSuccess {Number}     score                          Search score
   * @apiSuccess {Object}     profile                        Student profile
   * @apiSuccess {Number}     profile.studentId              Student ID
   * @apiSuccess {Object}     profile.user                   Student user
   * @apiSuccess {String}     profile.user.username          Student username
   * @apiSuccess {String}     profile.firstName              Student first name
   * @apiSuccess {String}     profile.lastName               Student last name
   * @apiSuccess {String}     profile.degree                 Student degree
   * @apiSuccess {String}     profile.major1                 Student major1
   * @apiSuccess {String}     profile.major2                 Student major2
   * @apiSuccess {String}     profile.postal                 Student postal code
   * @apiSuccess {String[]}   skills                         Student skills
   * @apiSuccess {String[]}   roles                          Student roles
   * @apiSuccess {String[]}   interests                      Student interests
   */
  router.post('/students', searchStudents(searchService));

  return router;
};
