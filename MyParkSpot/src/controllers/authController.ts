import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { MysqlDataSource } from '../config/data-source';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { LoginUserDto } from '../dtos/auth/login-user.dto';
import { User } from '../models/User';

const getLogin = async (_req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/auth/login');
};

const postLogin = async (
  req: Request<{}, {}, LoginUserDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await MysqlDataSource.getRepository(User).findOne({
      where: [{ email: req.body.email }],
    });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.status(403).redirect('/auth/login');
    }

    const isMatched = await bcrypt.compare(req.body.password, user.password);

    if (!isMatched) {
      req.flash('error', 'Invalid email or password.');
      return res.status(403).redirect('/auth/login');
    }

    passport.authenticate(
      'local',
      (
        err: Error | null,
        user: Express.User | null,
        info: { message: string }
      ) => {
        if (err) {
          req.flash('error', info?.message || 'An error occurred.');
          return res.status(500).redirect('/auth/login');
        }

        if (!user) {
          req.flash('error', info?.message || 'Invalid email or password.');
          return res.status(403).redirect('/auth/login');
        }

        req.logIn(user, (loginErr: unknown) => {
          if (loginErr) {
            req.flash('error', info?.message || 'Login failed.');
            return next(loginErr);
          }

          req.flash(
            'success',
            info?.message || 'You have successfully logged in.'
          );

          return res.status(200).redirect('/');
        });
      }
    )(req, res, next);
  } catch (error: unknown) {
    req.flash('error', 'Login failed. Please try again.');
    return res.status(500).redirect('/auth/login');
  }
};

const getRegister = async (_req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/auth/register');
};

const postRegister = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response
): Promise<void> => {
  try {
    let user = await MysqlDataSource.getRepository(User).findOne({
      where: [{ email: req.body.email }, { username: req.body.username }],
    });

    if (user?.email === req.body.email) {
      req.flash('error', 'A user with this email address already exists.');
      return res.status(409).redirect('/auth/register');
    }

    if (user?.username === req.body.username) {
      req.flash('error', 'A user with this username already exists.');
      return res.status(409).redirect('/auth/register');
    }

    user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(user.password, salt);

    user.password = password;

    await MysqlDataSource.getRepository(User).save(
      MysqlDataSource.getRepository(User).create(user)
    );

    req.flash('success', 'You have successfully registered.');
    return res.status(201).redirect('/auth/login');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred during registration.');
    return res.status(500).redirect('/auth/register');
  }
};

export default { getLogin, postLogin, getRegister, postRegister };
