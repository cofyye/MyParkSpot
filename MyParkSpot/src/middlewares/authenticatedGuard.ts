import { NextFunction, Request, Response } from 'express';

const authenticatedGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    req.flash('error', 'You must be logged in to access this page.');
    return res.status(401).redirect('/');
  }

  return next();
};

export default authenticatedGuard;
