import express from 'express';

import clientController from '../controllers/clientController';

const router = express.Router();

router.get('/account', clientController.getAccount);
router.get('/payments', clientController.getPayments);
router.get('/settings', clientController.getSettings);

export default router;
