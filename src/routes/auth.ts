import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import UserService from '../services/user';
import { JWT_SECRET, FE_ADDR } from '../config';
import { Pool } from 'mysql2/promise';
import { User } from '../types';

const register = (srv: UserService) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = req.body as User;

  try {
    user.id = await srv.createUser(user);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const generateToken = async (req: Request, res: Response): Promise<void> => {
  const { username, userType, provider } = req.user as User;
  const token = jwt.sign({ username, userType }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('jwt', token, { httpOnly: true });
  res.redirect(provider ? FE_ADDR : '/');
};

export default (db: Pool): Router => {
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

  return router;
};
