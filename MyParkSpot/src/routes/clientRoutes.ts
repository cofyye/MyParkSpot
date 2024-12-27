import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { UpdateAccountDto } from '../dtos/client/update-account.dto';

import clientController from '../controllers/clientController';
import { RegisterCarDto } from '../dtos/client/register-car.dto';

const router = express.Router();

// Get methods
router.get('/account', clientController.getAccount);
router.get('/payments', clientController.getPayments);
router.get('/payments/funds/add', clientController.getAddFunds);
router.get('/settings', clientController.getSettings);
router.get('/my-cars', clientController.getMyCars);
router.get('/cars/register', clientController.getRegisterCar);
router.post('/cars/delete/:id', clientController.postDeleteCar);

// Post methods
router.post(
  '/account',
  validateDto(UpdateAccountDto),
  clientController.postAccount
);
router.post(
  '/cars/register',
  validateDto(RegisterCarDto),
  clientController.postRegisterCar
);

export default router;
