import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { LoginUserDto } from '../dtos/auth/login-user.dto';
import notAuthenticatedGuard from '../middlewares/notAuthenticatedGuard';
import authenticatedGuard from '../middlewares/authenticatedGuard';

import authController from '../controllers/authController';

const router = express.Router();

// Get methods
router.get('/login', [notAuthenticatedGuard], authController.getLogin);
router.get('/register', [notAuthenticatedGuard], authController.getRegister);

// Post methods
router.post(
  '/login',
  [notAuthenticatedGuard, validateDto(LoginUserDto)],
  authController.postLogin
);
router.post('/logout', [authenticatedGuard], authController.postLogout);
router.post(
  '/register',
  [notAuthenticatedGuard, validateDto(CreateUserDto)],
  authController.postRegister
);

export default router;
