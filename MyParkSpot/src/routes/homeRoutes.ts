import express from 'express';

import homeController from '../controllers/homeController';

const router = express.Router();

// Get methods
router.get('/', homeController.getHome);
router.get('/map', homeController.getMap);

// Post methods
router.post('/reserve-parking', homeController.reserveParking);

export default router;
