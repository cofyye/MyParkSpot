import express from 'express';
import homeController from '../controllers/homeController';
import { validateDto } from '../middlewares/validateDto';
import { NearbyParkingSpotsDto } from '../dtos/client/nearby-parking-spots.dto';
import { RentParkingSpotDto } from '../dtos/client/rent-parking-spot.dto';
import { SpotIdDto } from '../dtos/client/spot-id.dto';

const router = express.Router();

// Get methods
router.get('/', homeController.getHome);
router.get('/map', validateDto(SpotIdDto, 'query'), homeController.getMap);
router.get(
  '/api/nearby-parking-spots',
  validateDto(NearbyParkingSpotsDto, 'query'),
  homeController.getNearbyParkingSpots
);

// Post methods
router.post(
  '/rent-parking-spot',
  validateDto(RentParkingSpotDto),
  homeController.rentParkingSpot
);

export default router;
