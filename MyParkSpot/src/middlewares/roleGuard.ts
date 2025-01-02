import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../models/User';

const roleGuard = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (!roles.includes(user.role)) {
      req.flash('error', 'You do not have permission to access this page.');
      return res.status(403).redirect('/');
    }

    return next();
  };
};

export default roleGuard;
