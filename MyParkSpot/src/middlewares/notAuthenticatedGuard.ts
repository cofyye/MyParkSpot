import { NextFunction, Request, Response } from 'express';

const notAuthenticatedGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user) {
    req.flash('error', 'You must be logged out to access this page.');
    return res.status(401).redirect('/');
  }

  return next();
};

export default notAuthenticatedGuard;
