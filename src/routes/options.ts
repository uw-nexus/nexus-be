import { Router, Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import LookupService from '../services/options';

/**
 * @apiDefine OptionsGroup Options API
 *
 * Provides data options, mostly for autosuggestions in setting up a new project or student profile.
 * Data provided includes project duration/team size, student school/degree/major, and many-to-many entries (skills, roles, interests)
 */

/**
 * @apiDefine M2MOptions
 *
 * @apiSuccess {String[]} skills    Known skills
 * @apiSuccess {String[]} roles     Known roles
 * @apiSuccess {String[]} interests Known interests
 */

const getArrayOptions = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const options = await srv.getArrayOptions();
    res.json(options);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getProjectDataOptions = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const options = await srv.getProjectDataOptions();
    res.json(options);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const getStudentDataOptions = (srv: LookupService) => async (req: Request, res: Response): Promise<void> => {
  try {
    const options = await srv.getStudentDataOptions();
    res.json(options);
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const lookupService = new LookupService(db);

  /**
   * @api {get} /options Get skill/role/interest options
   * @apiGroup OptionsGroup
   * @apiName GetArrayOptions
   *
   * @apiUse M2MOptions
   */
  router.get('/', getArrayOptions(lookupService));

  /**
   * @api {get} /options/projects Get Project options
   * @apiGroup OptionsGroup
   * @apiName GetProjectDataOptions
   *
   * @apiSuccess {String[]} durations Available project duration options
   * @apiSuccess {String[]} sizes     Available team size options
   * @apiUse M2MOptions
   */
  router.get('/projects', getProjectDataOptions(lookupService));

  /**
   * @api {get} /options/students Get Student options
   * @apiGroup OptionsGroup
   * @apiName GetStudentDataOptions
   *
   * @apiSuccess {String[]} degrees   Known degrees
   * @apiSuccess {String[]} schools   Known schools
   * @apiSuccess {String[]} majors    Known majors
   * @apiUse M2MOptions
   */
  router.get('/students', getStudentDataOptions(lookupService));
  return router;
};
