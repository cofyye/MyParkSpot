import express from 'express';

import homeController from '../controllers/homeController';

const router = express.Router();

// Get methods
router.get('/', homeController.getHome);
router.get('/map', homeController.getMap);
router.get('/api/nearby-parking-spots', homeController.getNearbyParkingSpots);

// Post methods
router.post('/rent-parking-spot', homeController.rentParkingSpot);

export default router;
