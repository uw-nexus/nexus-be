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
  res.json({ token });
};

export default (app: Application, db: Pool): void => {
  const router = Router();
  const userService = new UserService(db);

  router.post('/register', register(userService), generateToken);
  router.post('/login', passport.authenticate('local', { session: false }), generateToken);

  app.use('/auth', router);
};
