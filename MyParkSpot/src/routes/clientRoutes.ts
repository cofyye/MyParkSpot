import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { UpdateAccountDto } from '../dtos/client/update-account.dto';

import clientController from '../controllers/clientController';
import { RegisterCarDto } from '../dtos/client/register-car.dto';
import { AddFundsDto } from '../dtos/client/add-funds.dto';
import { CompletePaymentDto } from '../dtos/client/complete-payment.dto';

const router = express.Router();

// Get methods
router.get('/account', clientController.getAccount);
router.get('/payments', clientController.getPayments);
router.get(
  '/payments/complete',
  // validateDto(CompletePaymentDto, 'query'),
  clientController.getCompletePayments
);
router.get('/payments/cancel', clientController.getCancelPayments);
router.get('/payments/funds/add', clientController.getAddFunds);
router.get('/settings', clientController.getSettings);
router.get('/my-cars', clientController.getMyCars);
router.get('/cars/register', clientController.getRegisterCar);
router.post('/cars/delete/:id', clientController.postDeleteCar);

// Post methods
router.post(
  '/account',
  validateDto(UpdateAccountDto, 'body'),
  clientController.postAccount
);
router.post(
  '/cars/register',
  validateDto(RegisterCarDto, 'body'),
  clientController.postRegisterCar
);
router.post(
  '/payments/funds/add',
  validateDto(AddFundsDto, 'body'),
  clientController.postAddFunds
);

export default router;
