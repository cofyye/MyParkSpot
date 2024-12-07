import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { LoginUserDto } from '../dtos/auth/login-user.dto';

import authController from '../controllers/authController';

const router = express.Router();

// Get methods
router.get('/login', authController.getLogin);
router.get('/register', authController.getRegister);

// Post methods
router.post('/login', validateDto(LoginUserDto), authController.postLogin);
router.post(
  '/register',
  validateDto(CreateUserDto),
  authController.postRegister
);

export default router;
