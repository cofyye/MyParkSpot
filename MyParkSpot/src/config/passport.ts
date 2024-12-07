import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { MysqlDataSource } from './data-source';
import { User } from '../models/User';

const init = (passport: passport.PassportStatic) => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (
        email: string,
        password: string,
        done: (error: unknown, user?: User, info?: { message: string }) => void
      ) => {
        try {
          const user = await MysqlDataSource.getRepository(User).findOne({
            where: {
              email,
            },
          });

          if (!user) {
            return done(null, null, { message: 'User not found!' });
          }

          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, null, {
              message: 'Email or password is incorrect!',
            });
          }

          delete user.password;

          return done(null, user, {
            message: 'You successfully logged in!',
          });
        } catch (err: unknown) {
          return done(null, null, { message: 'Database Error. Try Again!' });
        }
      }
    )
  );

  passport.serializeUser(
    (user: User, done: (err: unknown, id?: string) => void) => {
      done(null, user.id);
    }
  );

  passport.deserializeUser(
    async (id: string, done: (err: unknown, user?: User) => void) => {
      try {
        const user = await MysqlDataSource.getRepository(User).findOne({
          where: {
            id,
          },
        });
        done(null, user);
      } catch (err: unknown) {
        done(err);
      }
    }
  );
};

export default init;
