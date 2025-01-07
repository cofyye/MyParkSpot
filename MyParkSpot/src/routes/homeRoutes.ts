import express from 'express';
import homeController from '../controllers/homeController';
import { validateDto } from '../middlewares/validateDto';
import { NearbyParkingSpotsDto } from '../dtos/client/nearby-parking-spots.dto';
import { RentParkingSpotDto } from '../dtos/client/rent-parking-spot.dto';
import { SpotIdOptionalDto } from '../dtos/client/spot-id-optional.dto';
import authenticatedGuard from '../middlewares/authenticatedGuard';
import { ZoneIdDto } from '../dtos/client/zone-id.dto';

const router = express.Router();

// Get methods
router.get('/', homeController.getHome);
router.get(
  '/map',
  validateDto(SpotIdOptionalDto, 'query'),
  homeController.getMap
);
router.get(
  '/api/nearby-parking-spots',
  validateDto(NearbyParkingSpotsDto, 'query'),
  homeController.getNearbyParkingSpots
);
router.get(
  '/api/remaining-time',
  [validateDto(ZoneIdDto, 'query'), authenticatedGuard],
  homeController.getRemainingTime
);

// Post methods
router.post(
  '/rent-parking-spot',
  validateDto(RentParkingSpotDto),
  homeController.rentParkingSpot
);
router.post('/unpark/:spotId', homeController.unparkSpot);

export default router;
