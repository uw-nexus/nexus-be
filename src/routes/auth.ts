import { Application, Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Pool } from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import UserService from '../services/user';
import config from '../config';
import { User } from '../types';

const register = (srv: UserService) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = req.body.user as User;

  try {
    user.id = await srv.createUser(user);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const generateToken = async (req: Request, res: Response): Promise<void> => {
  const { username, userType } = req.user as User;
  const token = jwt.sign({ username, userType }, config.JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
};

export default (app: Application, db: Pool): void => {
  const router = Router();
  const userService = new UserService(db);

  const authOpts = {
    session: false,
    scope: ['email'],
    failureRedirect: '/login',
  };

  router.post('/register', register(userService), generateToken);
  router.post('/login', passport.authenticate('local', authOpts), generateToken);

  router.get('/student/facebook', passport.authenticate('facebook-student', authOpts));
  router.get('/student/facebook/callback', passport.authenticate('facebook-student', authOpts), generateToken);

  app.use('/auth', router);
};
