import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import UserService from '../services/user';
import * as mailer from '../services/mailer';
import { JWT_SECRET, FE_ADDR, DOMAIN } from '../config';
import { Pool } from 'mysql2/promise';
import { User } from '../types';

/**
 * @apiDefine AuthGroup Auth API
 *
 * Handles all authentication related features.
 */

/**
 * @apiDefine JwtHeader JwtHeader    Header params to include to pass all JWT-protected routes
 *
 * @apiHeader {String}  cookie       Includes jwt token in `jwt` field, e.g. `jwt={token}`
 * @apiHeader {Boolean} credentials  Must be set to `true`
 */

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
    const user = await srv.findUserByEmail(email);
    const jwtToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '12h' });
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

  /**
   * @api {get} /auth/verify Verify JWT token
   * @apiGroup AuthGroup
   * @apiName VerifyJWT
   *
   * @apiUse JwtHeader
   */
  router.get('/verify', passport.authenticate('jwt', { session: false }), generateToken);

  /**
   * @api {post} /auth/register Create a new User
   * @apiGroup AuthGroup
   * @apiName CreateUser
   *
   * @apiParam {String} username Username
   * @apiParam {String} password Password
   * @apiParam {String} [userType] Optional user type, defaults to 'Student'
   */
  router.post('/register', register(userService), generateToken);

  /**
   * @api {post} /auth/login Login with username & password
   * @apiGroup AuthGroup
   * @apiName LogInLocal
   *
   * @apiParam {String} username Username
   * @apiParam {String} password Password
   */
  router.post('/login', passport.authenticate('local', authOpts), generateToken);

  /**
   * @api {get} /auth/student/facebook Login with Facebook
   * @apiGroup AuthGroup
   * @apiName LogInFacebook
   */
  router.get('/student/facebook', passport.authenticate('facebook-student', authOpts));
  router.get('/student/facebook/callback', passport.authenticate('facebook-student', authOpts), generateToken);

  /**
   * @api {get} /auth/password-reset Request password reset token by email
   * @apiDescription An email with a password reset link will be sent, if a user is registered with the email.
   * @apiGroup AuthGroup
   * @apiName RequestPasswordReset
   *
   * @apiParam {String} email Email, as a query param (e.g. `/auth/password-reset?email=your@email.com`)
   */
  router.get('/password-reset', requestPasswordReset(userService));

  /**
   * @api {patch} /auth/password-reset Reset password
   * @apiGroup AuthGroup
   * @apiName ResetPassword
   *
   * @apiHeader {String}  Authorization  `Bearer {jwt}`
   */
  router.patch('/password-reset', passport.authenticate('jwt', { session: false }), resetPassword(userService));

  return router;
};
