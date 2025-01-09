import express from 'express';
import homeController from '../controllers/homeController';
import { validateDto } from '../middlewares/validateDto';
import { NearbyParkingSpotsDto } from '../dtos/client/nearby-parking-spots.dto';
import { RentParkingSpotDto } from '../dtos/client/rent-parking-spot.dto';
import { SpotIdOptionalDto } from '../dtos/client/spot-id-optional.dto';
import authenticatedGuard from '../middlewares/authenticatedGuard';
import { ZoneIdDto } from '../dtos/client/zone-id.dto';
import roleGuard from '../middlewares/roleGuard';
import { UserRole } from '../enums/user-role.enum';

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
  [
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(ZoneIdDto, 'query'),
    authenticatedGuard,
  ],
  homeController.getRemainingTime
);

// Post methods
router.post(
  '/rent-parking-spot',
  [
    authenticatedGuard,
    roleGuard([UserRole.FOUNDER, UserRole.USER]),
    validateDto(RentParkingSpotDto),
  ],
  homeController.rentParkingSpot
);
router.post(
  '/unpark/:spotId',
  [authenticatedGuard, roleGuard([UserRole.FOUNDER, UserRole.USER])],
  homeController.unparkSpot
);

export default router;
