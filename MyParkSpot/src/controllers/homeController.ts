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
  const cars = await MysqlDataSource.getRepository(Car).find({
    where: { user: { id: user.id } },
  });

  res.render('map', { parkingSpots: JSON.stringify(parkingSpots), cars });
};

const getMap = async (req: Request, res: Response): Promise<void> => {
  await renderMap(req, res);
};

const getMysqlData = async (req: Request, res: Response): Promise<void> => {};

const getRedisData = async (req: Request, res: Response): Promise<void> => {
  try {
    const value = await redisClient.get('kljuc');
    res.send(value);
  } catch (error) {
    console.error('Error getting data from Redis:', error);
    res.status(500).send('Error getting data from Redis');
  }
};

const payParking = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as User;
  console.log(user);

  if (!user) {
    return res.status(200).render('pages/auth/login');
  }

  const amount = req.body.amount;
  console.log(amount);

  if (user.credit < amount) {
    return res.status(200).render('pages/client/payments');
  }

  user.credit -= amount;
  console.log(user.credit);

  const userRepository = await MysqlDataSource.getRepository(User);
  await userRepository.save(user);

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

    const hoursNumber = parseInt(parkingDuration);
    if (isNaN(hoursNumber) || hoursNumber < 1) {
      req.flash('error', 'Please enter a valid number of hours.');
      return res.status(400).redirect('/map');
    }

    const car = await MysqlDataSource.getRepository(Car).findOne({
      where: { id: carId, user: { id: user.id } },
    });

    if (!car) {
      req.flash('error', 'Car not found.');
      return res.status(404).redirect('/map');
    }

    const parkingSpot = await MysqlDataSource.getRepository(
      ParkingSpot
    ).findOne({
      where: { id: parkingSpotId, isOccupied: false },
    });

    if (!parkingSpot) {
      req.flash('error', 'Parking spot not available.');
      return res.status(400).redirect('/map');
    }

    const reservationRepo = MysqlDataSource.getRepository(ParkingReservation);
    const reservation = new ParkingReservation();
    reservation.user = user;
    reservation.car = car;
    reservation.parkingSpot = parkingSpot;
    reservation.hours = hoursNumber;
    reservation.startTime = new Date();
    reservation.endTime = new Date(Date.now() + hoursNumber * 60 * 60 * 1000);

    await reservationRepo.save(reservation);

    parkingSpot.isOccupied = true;
    await MysqlDataSource.getRepository(ParkingSpot).save(parkingSpot);

    req.flash('success', 'Parking reserved successfully.');
    return res.status(201).redirect('/map');
  } catch (error) {
    console.error('Error reserving parking:', error);
    req.flash('error', 'An error occurred while reserving parking.');
    return res.status(500).redirect('/map');
  }
};

export default {
  getHome,
  getMap,
  getMysqlData,
  getRedisData,
  payParking,
  reserveParking,
};
