import { Request, Response } from 'express';
import { MysqlDataSource } from '../config/data-source';
import { CreateUserDto } from '../dtos/auth/create-user.dto';

const getLogin = async (req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/login');
};

const getRegister = async (req: Request, res: Response): Promise<void> => {
  res.render('pages/auth/register');
};

const postRegister = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response
): Promise<void> => {
  console.log(req.user);
  console.log(req.body);
  res.redirect('/');
};

export default { getLogin, getRegister, postRegister };
