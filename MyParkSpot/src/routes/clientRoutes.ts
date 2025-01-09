import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { UpdateAccountDto } from '../dtos/client/update-account.dto';
import { RegisterCarDto } from '../dtos/client/register-car.dto';
import { AddFundsDto } from '../dtos/client/add-funds.dto';
import { CompletePaymentDto } from '../dtos/client/complete-payment.dto';
import clientController from '../controllers/clientController';
import { GetSpendingDataDto } from '../dtos/client/get-spending-data.dto';
import { UserRole } from '../enums/user-role.enum';
import roleGuard from '../middlewares/roleGuard';

const router = express.Router();

// Middlewares
router.use(clientController.checkFines);

// Get methods
router.get('/account', clientController.getAccount);
router.get(
  '/my-cars',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getMyCars
);
router.get(
  '/payments',
  [
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(GetSpendingDataDto, 'query'),
  ],
  clientController.getPayments
);
router.get(
  '/payments/complete',
  [
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(CompletePaymentDto, 'query'),
  ],
  clientController.getCompletePayments
);
router.get(
  '/payments/cancel',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getCancelPayments
);
router.get(
  '/payments/funds/add',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getAddFunds
);
router.get(
  '/cars/register',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getRegisterCar
);
router.get(
  '/fines',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getFines
);
router.get(
  '/payments/transactions',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.getAllTransactions
);

// Post methods
router.post(
  '/account',
  [validateDto(UpdateAccountDto, 'body')],
  clientController.postAccount
);
router.post(
  '/cars/register',
  [
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(RegisterCarDto, 'body'),
  ],
  clientController.postRegisterCar
);
router.post(
  '/payments/funds/add',
  [
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(AddFundsDto, 'body'),
  ],
  clientController.postAddFunds
);
router.post(
  '/cars/delete/:id',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.postDeleteCar
);
router.post(
  '/fines/pay/:id',
  [roleGuard([UserRole.FOUNDER, UserRole.USER])],
  clientController.postPayFine
);

export default router;
