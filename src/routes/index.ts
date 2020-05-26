import { Application } from 'express';
import { Pool } from 'mysql2/promise';
import passport from 'passport';

import auth from './auth';
import students from './students';
import projects from './projects';
import contracts from './contracts';
import saved from './saved';
import options from './options';

const authenticateJwt = passport.authenticate('jwt', { session: false });

export default (app: Application, db: Pool): void => {
  app.use('/auth', auth(db));
  app.use('/students', authenticateJwt, students(db));
  app.use('/projects', authenticateJwt, projects(db));
  app.use('/contracts', authenticateJwt, contracts(db));
  app.use('/saved', authenticateJwt, saved(db));
  app.use('/options', options(db));
};
