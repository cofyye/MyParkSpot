import { Request, Response } from 'express';

const getProfile = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/profile');
};

export default { getProfile };
