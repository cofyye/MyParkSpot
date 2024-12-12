import express from 'express';
import { validateDto } from '../middlewares/validateDto';
import { UpdateAccountDto } from '../dtos/client/update-account.dto';

import clientController from '../controllers/clientController';

const router = express.Router();

// Get methods
router.get('/account', clientController.getAccount);
router.get('/payments', clientController.getPayments);
router.get('/settings', clientController.getSettings);

// Post methods
router.post(
  '/account',
  validateDto(UpdateAccountDto),
  clientController.postAccount
);

export default router;
