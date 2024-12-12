import { Request, Response } from 'express';

const getAccount = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/account');
};

const getPayments = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/payments');
};

const getSettings = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/settings');
};

export default { getAccount, getPayments, getSettings };
