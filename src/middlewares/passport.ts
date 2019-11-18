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

import UserService from '../services/user';
import { Pool } from 'mysql2/promise';

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
      done(error);
    }
  });
};

const jwt = (srv: UserService): JwtStrategy => {
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  };

  return new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const user = await srv.findUser(payload.username);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

const fb = (srv: UserService, userType: string): FacebookStrategy => {
  const fbOpts: FacebookOptionsWR = {
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `/auth/${userType.toLowerCase()}/facebook/callback`,
    profileFields: ['id', 'name', 'picture', 'email'],
    passReqToCallback: true,
  };

  const fbVerify: FacebookVerifyWR = async (req, accessToken, refreshToken, profile, done) => {
    try {
      const userData = profile._json;
      const user = await srv.findOrCreateFromProvider(userData.id, 'facebook', userType);
      done(null, user);
    } catch (error) {
      done(error);
    }
  };

  return new FacebookStrategy(fbOpts, fbVerify);
};

export default (db: Pool): void => {
  const srv = new UserService(db);
  passport.use(local(srv));
  passport.use(jwt(srv));
  passport.use('facebook-student', fb(srv, 'Student'));
};
