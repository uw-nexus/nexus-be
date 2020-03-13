import { JWT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } from '../config';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';

import {
  Strategy as FacebookStrategy,
  StrategyOptionWithRequest as FacebookOptionsWR,
  VerifyFunctionWithRequest as FacebookVerifyWR,
} from 'passport-facebook';

import { BE_ADDR } from '../config';
import UserService from '../services/user';
import { Pool } from 'mysql2/promise';
import { Request } from 'express';
import StudentService from '../services/student';

const local = (srv: UserService): LocalStrategy => {
  return new LocalStrategy(async (username, password, done) => {
    try {
      const user = await srv.findUser(username);
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        return done(null, user);
      } else {
        return done('Incorrect username or password');
      }
    } catch (error) {
      done('Failed to login');
    }
  });
};

const jwt = (srv: UserService): JwtStrategy => {
  const getJwtCookie = (req: Request): string => (req.cookies ? req.cookies.jwt : null);

  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromExtractors([getJwtCookie]),
    secretOrKey: JWT_SECRET,
  };

  return new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const user = await srv.findUser(payload.username);
      done(null, user);
    } catch (error) {
      done('User not found');
    }
  });
};

const fb = (userSrv: UserService, profileSrv: StudentService, userType: string): FacebookStrategy => {
  const fbOpts: FacebookOptionsWR = {
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `${BE_ADDR}/auth/${userType.toLowerCase()}/facebook/callback`,
    profileFields: ['id', 'name', 'picture', 'email'],
    passReqToCallback: true,
  };

  const fbVerify: FacebookVerifyWR = async (req, accessToken, refreshToken, profile, done) => {
    const userData = profile._json;
    let user = null;

    try {
      user = await userSrv.findUser(`facebook-${userData.id}`);
      user.provider = 'facebook';
    } catch {
      user = {
        username: `facebook-${userData.id}`,
        password: userSrv.generateRandomPassword(),
        userType,
        provider: 'facebook',
      };
    }

    if (!user.id) {
      try {
        user.id = await userSrv.createUser(user);
        await profileSrv.createStudent(user.username, {
          firstName: userData['first_name'],
          lastName: userData['last_name'],
          email: userData['email'],
        });
      } catch (error) {
        done('Failed to create account');
      }
    }

    done(null, user);
  };

  return new FacebookStrategy(fbOpts, fbVerify);
};

export default (db: Pool): void => {
  const userSrv = new UserService(db);
  const studentSrv = new StudentService(db);
  passport.use(local(userSrv));
  passport.use(jwt(userSrv));
  passport.use('facebook-student', fb(userSrv, studentSrv, 'Student'));
};
