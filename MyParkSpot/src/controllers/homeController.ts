import { Request, Response } from 'express';
import redisClient from '../config/redis';
import { MysqlDataSource } from '../config/data-source';
import { ParkingSpot } from '../models/ParkingSpot';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { ParkingReservation } from '../models/ParkingReservation';

const getHome = async (req: Request, res: Response): Promise<void> => {
  res.render('home');
};

const renderMap = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as User;

  const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find();

  let cars: Car[] = [];

  if (user) {
    cars = await MysqlDataSource.getRepository(Car).find({
      where: { user: { id: user.id } },
    });
  }

  return res.render('map', {
    parkingSpots: JSON.stringify(parkingSpots),
    cars,
  });
};

const getMap = async (req: Request, res: Response): Promise<void> => {
  await renderMap(req, res);
};

const reserveParking = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    const { parkingDuration, carId, parkingSpotId } = req.body;
    console.log(user, parkingDuration, carId, parkingSpotId);

    if (!parkingSpotId) {
      req.flash('error', 'Parking spot not found.');
      return res.status(400).redirect('/map');
    }

    if (!carId) {
      req.flash('error', 'Car not found.');
      return res.status(400).redirect('/map');
    }

    const hoursNumber = parseInt(parkingDuration, 10);
    if (isNaN(hoursNumber) || hoursNumber < 1) {
      req.flash('error', 'Please enter a valid number of hours.');
      return res.status(400).redirect('/map');
    }

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const car = await transactionalEntityManager.findOne(Car, {
        where: { id: carId, user: { id: user.id } },
      });

      if (!car) {
        throw new Error('Car not found.');
      }

      car.isParked = true;
      await transactionalEntityManager.save(Car, car);

      const parkingSpot = await transactionalEntityManager.findOne(
        ParkingSpot,
        {
          where: { id: parkingSpotId, isOccupied: false },
        }
      );

      if (!parkingSpot) {
        throw new Error('Parking spot not available.');
      }

      const amount = parkingSpot.price * hoursNumber;

      if (user.credit < amount) {
        throw new Error('Insufficient credit.');
      }

      user.credit -= amount;
      await transactionalEntityManager.save(User, user);

      const reservation = new ParkingReservation();
      reservation.user = user;
      reservation.car = car;
      reservation.parkingSpot = parkingSpot;
      reservation.hours = hoursNumber;
      reservation.startTime = new Date();
      reservation.endTime = new Date(Date.now() + hoursNumber * 60 * 60 * 1000);

      await transactionalEntityManager.save(ParkingReservation, reservation);

      parkingSpot.isOccupied = true;
      await transactionalEntityManager.save(ParkingSpot, parkingSpot);
    });

    req.flash('success', 'Parking reserved successfully.');
    return res.status(201).redirect('/map');
  } catch (error) {
    if (error.message === 'Insufficient credit.') {
      return res.status(200).redirect('/client/payments');
    }

    req.flash('error', 'An error occurred while reserving parking.');
    return res.status(500).redirect('/map');
  }
};

export default {
  getHome,
  getMap,
  reserveParking,
};
