import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import UserService from '../services/user';
import * as mailer from '../services/mailer';
import { JWT_SECRET, FE_ADDR, DOMAIN } from '../config';
import { Pool } from 'mysql2/promise';
import { User } from '../types';

const register = (srv: UserService) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = req.body as User;

  try {
    user.userId = await srv.createUser(user);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = (srv: UserService) => async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;

  try {
    await srv.findUser(email);
    const jwtToken = jwt.sign({ username: email }, JWT_SECRET, { expiresIn: '12h' });
    await mailer.sendPasswordResetIntru(email, jwtToken);
    res.send('Email sent');
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const resetPassword = (srv: UserService) => async (req: Request, res: Response): Promise<void> => {
  const { username } = req.user as User;
  const { password } = req.body;

  try {
    await srv.resetUserPassword(username, password);
    res.send('Password reset successful');
  } catch (error) {
    res.json({
      error: (error as Error).message,
    });
  }
};

const generateToken = async (req: Request, res: Response): Promise<void> => {
  const { username, userType, provider } = req.user as User;
  const token = jwt.sign({ username, userType }, JWT_SECRET, { expiresIn: '7d' });
  const prodSettings = { httpOnly: true, secure: true, sameSite: 'None', domain: DOMAIN };
  res.cookie('jwt', token, process.env.NODE_ENV === 'production' ? prodSettings : {});

  if (provider) {
    res.redirect(FE_ADDR);
  } else {
    res.json({ authenticated: true });
  }
};

export default (db: Pool): Router => {
  const router = Router();
  const userService = new UserService(db);

  const authOpts = {
    session: false,
    scope: ['email'],
    failureRedirect: '/login',
  };

  router.get('/verify', passport.authenticate('jwt', { session: false }), generateToken);

  router.post('/register', register(userService), generateToken);
  router.post('/login', passport.authenticate('local', authOpts), generateToken);

  router.get('/student/facebook', passport.authenticate('facebook-student', authOpts));
  router.get('/student/facebook/callback', passport.authenticate('facebook-student', authOpts), generateToken);

  router.get('/password-reset', requestPasswordReset(userService));
  router.patch('/password-reset', passport.authenticate('jwt', { session: false }), resetPassword(userService));

  return router;
};
