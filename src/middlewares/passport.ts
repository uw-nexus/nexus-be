import config from '../config';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';

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
    secretOrKey: config.JWT_SECRET,
  };

  return new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const user = await srv.findUser(payload.userId);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export default (db: Pool): void => {
  const srv = new UserService(db);
  passport.use(local(srv));
  passport.use(jwt(srv));
};
