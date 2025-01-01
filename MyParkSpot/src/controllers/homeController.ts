import { Request, Response } from 'express';
import redisClient from '../config/redis';
import { MysqlDataSource } from '../config/data-source';
import { ParkingSpot } from '../models/ParkingSpot';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { ParkingRental } from '../models/ParkingRental';
import { GeoReplyWith } from 'redis';
import { In, LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction } from '../models/Transaction';
import { TransactionType } from '../enums/transaction-type.enum';
import moment from 'moment-timezone';
import { NearbyParkingSpotsDto } from '../dtos/client/nearby-parking-spots.dto';
import { RentParkingSpotDto } from '../dtos/client/rent-parking-spot.dto';

const getHome = async (req: Request, res: Response): Promise<void> => {
  res.render('home');
};

async function syncParkingSpotsToRedis(parkingSpots: ParkingSpot[]) {
  for (const spot of parkingSpots) {
    await redisClient.geoAdd('parkingSpots', {
      longitude: spot.longitude,
      latitude: spot.latitude,
      member: spot.id,
    });
  }
}

const getMap = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as User;

  const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find({
    where: { isDeleted: false },
    relations: ['zone'],
  });

  syncParkingSpotsToRedis(parkingSpots);

  let cars: Car[] = [];
  let userRentals: ParkingRental[] = [];

  if (user) {
    cars = await MysqlDataSource.getRepository(Car).find({
      where: { user: { id: user.id } },
    });

    userRentals = await MysqlDataSource.getRepository(ParkingRental).find({
      where: {
        user: { id: user.id },
        startTime: LessThanOrEqual(moment.utc().toDate()),
        endTime: MoreThanOrEqual(moment.utc().toDate()),
      },
      select: ['parkingSpotId'],
    });
  }

  return res.render('map', {
    parkingSpots: JSON.stringify(parkingSpots),
    userRentals: JSON.stringify(userRentals),
    cars,
  });
};

const getNearbyParkingSpots = async (
  req: Request<{}, {}, {}, NearbyParkingSpotsDto>,
  res: Response
): Promise<void> => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const radius = req.query.radius;

  const spots = await redisClient.geoSearchWith(
    'parkingSpots',
    { longitude: lng, latitude: lat },
    { radius: radius, unit: 'km' },
    [GeoReplyWith.COORDINATES]
  );

  const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find({
    where: {
      id: In(spots.map(spot => spot.member)),
      isDeleted: false,
    },
    relations: ['zone'],
  });
  res.json(parkingSpots);
};

const rentParkingSpot = async (
  req: Request<{}, {}, RentParkingSpotDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as User).id;
    const user = await MysqlDataSource.getRepository(User).findOne({
      where: { id: userId },
    });

    Object.entries(user).forEach(([key, value]) => {
      console.log(`Property: ${key}, Value: ${value}, Type: ${typeof value}`);
    });

    const { parkingDuration, carId, parkingSpotId } = req.body;

    const parkingHours = parkingDuration / 60;
    const parkingMinutes = parkingDuration;

    if (!parkingSpotId) {
      req.flash('error', 'Parking spot not found.');
      return res.status(400).redirect('/map');
    }

    if (!carId) {
      req.flash('error', 'Car not found.');
      return res.status(400).redirect('/map');
    }

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const car = await transactionalEntityManager.findOne(Car, {
        where: { id: carId, userId: userId },
      });
      console.log('Car:', car);

      if (!car) {
        throw new Error('Car not found.');
      }

      await transactionalEntityManager.update(Car, car.id, { isParked: true });

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

      let amount;
      if (parkingMinutes === -1) {
        amount = parkingSpot.zone.dailyPassCost;
      } else {
        amount = parkingHours * parkingSpot.zone.baseCost;
      }
      if (user.credit < amount) {
        throw new Error('Insufficient credit.');
      }

      user.credit -= amount;
      await transactionalEntityManager.update(User, user.id, {
        credit: user.credit - amount,
      });

      const rental = new ParkingRental();
      rental.user = user;
      rental.car = car;
      rental.parkingSpot = parkingSpot;
      rental.minutes = parkingMinutes;
      rental.totalCost = amount;
      rental.startTime = moment().utc().toDate();
      rental.endTime = moment().utc().add(rental.minutes, 'minutes').toDate();

      await transactionalEntityManager.save(ParkingRental, rental);

      await transactionalEntityManager.update(ParkingSpot, parkingSpot.id, {
        isOccupied: true,
      });

      const newTransaction = new Transaction();
      newTransaction.user = user;
      newTransaction.transactionType = TransactionType.PARKING_RENTAL;
      newTransaction.amount = amount;
      await transactionalEntityManager.save(Transaction, newTransaction);
    });

    // Sync with redis
    await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(user));

    req.flash('success', 'Parking spot rented successfully.');
    return res.status(201).redirect('/map');
  } catch (error: unknown) {
    const err = error as Error;

    if (err.message === 'Insufficient credit.') {
      req.flash('error', err.message);
      return res.status(200).redirect('/client/payments');
    }

    req.flash('error', 'An error occurred while renting parking spot.');
    return res.status(500).redirect('/map');
  }
};

export default {
  getHome,
  getMap,
  rentParkingSpot,
  getNearbyParkingSpots,
};
