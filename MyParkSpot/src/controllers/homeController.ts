import { Request, Response } from 'express';
import redisClient from '../config/redis';
import { MysqlDataSource } from '../config/data-source';
import { ParkingSpot } from '../models/ParkingSpot';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { ParkingRental } from '../models/ParkingRental';
import { GeoReplyWith } from 'redis';
import { EntityManager, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction } from '../models/Transaction';
import { TransactionType } from '../enums/transaction-type.enum';
import moment from 'moment-timezone';
import { NearbyParkingSpotsDto } from '../dtos/client/nearby-parking-spots.dto';
import { RentParkingSpotDto } from '../dtos/client/rent-parking-spot.dto';
import { Fine } from '../models/Fine';
import { FineStatus } from '../enums/fine-status.enum';
import { SpotIdOptionalDto } from '../dtos/client/spot-id-optional.dto';
import { ZoneIdDto } from '../dtos/client/zone-id.dto';
import { Zone } from '../models/Zone';

const getHome = async (_req: Request, res: Response): Promise<void> => {
  res.render('home');
};

const getMap = async (
  req: Request<{}, {}, {}, SpotIdOptionalDto>,
  res: Response
): Promise<void> => {
  const user = req.user as User;
  const spotId = req.query.spotId ?? null;

  let cars: Car[] = [];
  let userRentals: ParkingRental[] = [];

  if (user) {
    cars = await MysqlDataSource.getRepository(Car).find({
      where: { userId: user.id, isDeleted: false },
    });

    userRentals = await MysqlDataSource.getRepository(ParkingRental).find({
      where: {
        user: { id: user.id },
        startTime: LessThanOrEqual(moment.utc().toDate()),
        endTime: MoreThanOrEqual(moment.utc().toDate()),
        expired: false,
      },
      select: ['parkingSpotId'],
    });
  }

  const parkingSpots = await redisClient.get(`parkingSpots`);

  return res.render('map', {
    parkingSpots: JSON.stringify(JSON.parse(parkingSpots || '[]')),
    userRentals: JSON.stringify(userRentals),
    cars,
    spotId,
  });
};

const getNearbyParkingSpots = async (
  req: Request<{}, {}, {}, NearbyParkingSpotsDto>,
  res: Response
): Promise<void> => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const radius = req.query.radius;

    const spots = await redisClient.geoSearchWith(
      'geo:parkingSpots',
      { longitude: lng, latitude: lat },
      { radius: radius, unit: 'km' },
      [GeoReplyWith.COORDINATES]
    );

    const parkingSpotsData = await redisClient.get('parkingSpots');
    const parkingSpots = JSON.parse(parkingSpotsData);
    const filteredSpots = parkingSpots.filter(
      (spot: ParkingSpot) =>
        spots.map(s => s.member).includes(spot.id) && !spot.isDeleted
    );

    res.json(filteredSpots);
  } catch (error: unknown) {
    res.json([]);
  }
};

async function getTodaysParkingDuration(
  userId: string,
  zoneId: string,
  transactionalEntityManager: EntityManager
) {
  const today = moment().startOf('day').utc();
  const tomorrow = moment().endOf('day').utc();

  const todaysRentals = await transactionalEntityManager.find(ParkingRental, {
    where: {
      userId: userId,
      parkingSpot: {
        zoneId,
      },
      startTime: MoreThanOrEqual(today.toDate()),
      endTime: LessThanOrEqual(tomorrow.toDate()),
    },
  });

  return todaysRentals.reduce(
    (total: number, rental: ParkingRental) => total + rental.minutes,
    0
  );
}

const rentParkingSpot = async (
  req: Request<{}, {}, RentParkingSpotDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as User).id;
    const user = await MysqlDataSource.getRepository(User).findOne({
      where: { id: userId },
    });

    const { parkingDuration, carId, parkingSpotId } = req.body;

    if (!parkingSpotId || !carId) {
      req.flash(
        'error',
        parkingSpotId ? 'Car not found.' : 'Parking spot not found.'
      );
      return res.status(400).redirect('/map');
    }

    let licensePlate: string;
    let rentalEndTime: string;
    let parkingAmount: number;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const car = await transactionalEntityManager.findOne(Car, {
        where: { id: carId, userId: userId, isParked: false },
      });

      if (!car) {
        throw new Error('Car not found.');
      }

      const parkingSpot = await transactionalEntityManager.findOne(
        ParkingSpot,
        {
          where: { id: parkingSpotId, isOccupied: false },
          relations: ['zone'],
        }
      );

      if (!parkingSpot) {
        throw new Error('Parking spot not available.');
      }

      const activeFine = await transactionalEntityManager.findOne(Fine, {
        where: {
          parkingSpotId: parkingSpotId,
          carId: carId,
          status: In([FineStatus.ISSUED, FineStatus.PAID]),
          issuedAt: MoreThanOrEqual(moment().subtract(24, 'hours').toDate()),
        },
      });

      if (activeFine) {
        throw new Error(
          `A parking ticket has been issued for this parking spot and is valid until ${moment(activeFine.issuedAt).add(24, 'hours').format('llll')}.`
        );
      }

      const todaysDuration = await getTodaysParkingDuration(
        userId,
        parkingSpot.zoneId,
        transactionalEntityManager
      );

      if (parkingDuration === -1) {
        if (!parkingSpot.zone.dailyPassCost) {
          throw new Error('Daily parking is not available in this zone.');
        }
        parkingAmount = parkingSpot.zone.dailyPassCost;
      } else {
        const isExtension =
          todaysDuration >= (parkingSpot.zone.maxParkingDuration || 24 * 60);

        if (isExtension) {
          if (!parkingSpot.zone.maxExtensionDuration) {
            throw new Error('Parking extension is not available in this zone.');
          }

          if (
            todaysDuration + parkingDuration >
            (parkingSpot.zone.maxParkingDuration || 0) +
              parkingSpot.zone.maxExtensionDuration
          ) {
            throw new Error(
              `Maximum parking duration exceeded. You can extend for up to ${parkingSpot.zone.maxExtensionDuration} minutes.`
            );
          }

          parkingAmount =
            (parkingDuration / 60) * (parkingSpot.zone.extensionCost || 0);
        } else {
          if (
            parkingSpot.zone.maxParkingDuration &&
            todaysDuration + parkingDuration >
              parkingSpot.zone.maxParkingDuration
          ) {
            throw new Error(
              `Maximum parking duration exceeded. You can park for up to ${parkingSpot.zone.maxParkingDuration - todaysDuration} more minutes.`
            );
          }

          parkingAmount = (parkingDuration / 60) * parkingSpot.zone.baseCost;
        }
      }

      if (user.credit < parkingAmount) {
        throw new Error('Insufficient credit.');
      }

      await transactionalEntityManager.update(User, user.id, {
        credit: user.credit - parkingAmount,
      });

      const rental = new ParkingRental();
      rental.user = user;
      rental.car = car;
      rental.parkingSpot = parkingSpot;
      rental.minutes = parkingDuration === -1 ? 24 * 60 : parkingDuration;
      rental.totalCost = parkingAmount;
      rental.startTime = moment().utc().toDate();
      rental.endTime = moment().utc().add(rental.minutes, 'minutes').toDate();

      await transactionalEntityManager.save(ParkingRental, rental);
      await transactionalEntityManager.update(ParkingSpot, parkingSpot.id, {
        isOccupied: true,
      });
      await transactionalEntityManager.update(Car, car.id, { isParked: true });

      const newTransaction = new Transaction();
      newTransaction.user = user;
      newTransaction.transactionType = TransactionType.PARKING_RENTAL;
      newTransaction.amount = parkingAmount;
      await transactionalEntityManager.save(Transaction, newTransaction);

      licensePlate = car.licensePlate;
      rentalEndTime = moment(rental.endTime).format('lll');
    });

    // Sync with redis
    await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(user));
    const parkingSpotsData = await redisClient.get('parkingSpots');
    const parkingSpots = JSON.parse(parkingSpotsData) as ParkingSpot[];
    const updatedParkingSpots = parkingSpots.map(s =>
      s.id === req.body.parkingSpotId ? { ...s, isOccupied: true } : s
    );
    await redisClient.set('parkingSpots', JSON.stringify(updatedParkingSpots));

    req.flash(
      'success',
      `Parking ticket purchased for ${licensePlate}. Cost: €${parkingAmount.toFixed(2)}. Valid until ${rentalEndTime}.`
    );
    return res.status(201).redirect('/map');
  } catch (error: unknown) {
    const err = error as Error;
    req.flash(
      'error',
      err.message || 'An error occurred while renting parking spot.'
    );

    if (err.message === 'Insufficient credit.') {
      return res.status(200).redirect('/client/payments');
    }

    return res.redirect('/map');
  }
};

const unparkSpot = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as User).id;
    const { spotId } = req.params;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const rental = await transactionalEntityManager.findOne(ParkingRental, {
        where: {
          parkingSpotId: spotId,
          userId: userId,
          expired: false,
          endTime: MoreThanOrEqual(moment().utc().toDate()),
        },
        relations: ['car', 'parkingSpot'],
      });

      if (!rental) {
        throw new Error('Active parking rental not found.');
      }

      await transactionalEntityManager.update(ParkingRental, rental.id, {
        expired: true,
        endTime: moment().utc().toDate(),
      });

      await transactionalEntityManager.update(
        ParkingSpot,
        rental.parkingSpot.id,
        {
          isOccupied: false,
        }
      );

      await transactionalEntityManager.update(Car, rental.car.id, {
        isParked: false,
      });
    });

    // Sync with Redis
    const parkingSpotsData = await redisClient.get('parkingSpots');
    const parkingSpots = JSON.parse(parkingSpotsData) as ParkingSpot[];
    const updatedParkingSpots = parkingSpots.map(s =>
      s.id === req.body.parkingSpotId ? { ...s, isOccupied: false } : s
    );
    await redisClient.set('parkingSpots', JSON.stringify(updatedParkingSpots));

    req.flash('success', 'Parking session ended successfully.');
    return res.status(200).redirect('/map');
  } catch (error: unknown) {
    const err = error as Error;
    req.flash(
      'error',
      err.message || 'An error occurred while ending parking session.'
    );
    return res.redirect('/map');
  }
};

const getRemainingTime = async (
  req: Request<{}, {}, {}, ZoneIdDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as User).id;
    const { zoneId } = req.query;

    const zone = await MysqlDataSource.getRepository(Zone).findOne({
      where: { id: zoneId },
    });

    if (!zone) {
      res.status(404).json({ error: 'Zone not found' });
      return;
    }

    const todaysDuration = await getTodaysParkingDuration(
      userId,
      zoneId,
      MysqlDataSource.manager
    );

    const maxRegularDuration = zone.maxParkingDuration || 24 * 60;
    const maxExtensionDuration = zone.maxExtensionDuration || 0;

    const remainingRegularTime = Math.max(
      0,
      maxRegularDuration - todaysDuration
    );
    const remainingExtensionTime =
      maxExtensionDuration > 0
        ? Math.max(
            0,
            maxRegularDuration + maxExtensionDuration - todaysDuration
          )
        : 0;

    const isInExtensionPeriod = todaysDuration >= maxRegularDuration;

    res.json({
      remainingRegularTime,
      remainingExtensionTime,
      isInExtensionPeriod,
      hasExtensionAvailable: maxExtensionDuration > 0,
      hasDailyPass: !isNaN(zone.dailyPassCost),
      dailyPassCost: zone.dailyPassCost,
      baseCost: zone.baseCost,
      extensionCost: zone.extensionCost,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get remaining time' });
  }
};

export default {
  getHome,
  getMap,
  rentParkingSpot,
  getNearbyParkingSpots,
  unparkSpot,
  getRemainingTime,
};
