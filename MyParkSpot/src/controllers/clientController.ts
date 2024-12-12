import { Request, Response } from 'express';
import { UpdateAccountDto } from '../../src/dtos/client/update-account.dto';
import { MysqlDataSource } from '../../src/config/data-source';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

const getAccount = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/account');
};

const postAccount = async (
  req: Request<{}, {}, UpdateAccountDto>,
  res: Response
): Promise<void> => {
  try {
    const user = await MysqlDataSource.getRepository(User).findOne({
      where: {
        id: req.body.userId,
      },
    });

    if (!user) {
      req.flash('error', 'This user does not exist.');
      return res.status(404).redirect('/client/account');
    }

    await MysqlDataSource.getRepository(User).update(
      {
        id: user.id,
      },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        ...(req.body.password
          ? {
              password: await bcrypt.hash(
                user.password,
                await bcrypt.genSalt(10)
              ),
            }
          : {}),
      }
    );

    req.flash('success', 'You have successfully updated your account.');
    return res.status(200).redirect('/client/account');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while updating your account.');
    return res.status(500).redirect('/client/account');
  }
};

const getPayments = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/payments');
};

const getSettings = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/settings');
};

export default { getAccount, postAccount, getPayments, getSettings };
