import express from 'express';

import clientController from '../controllers/clientController';

const router = express.Router();

router.get('/profile', clientController.getProfile);

export default router;
