import { Request, Response } from 'express';
import redisClient from '../config/redis';
import { MysqlDataSource } from '../config/data-source';
import { ParkingSpot } from '../models/ParkingSpot';
import { User } from '../models/User';

const getHome = async (req: Request, res: Response): Promise<void> => {
  res.render('home');
};

const renderMap = async (req: Request, res: Response): Promise<void> => {
  const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find();
  res.render('map', { parkingSpots: JSON.stringify(parkingSpots) });
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
    return res.status(200).render('pages/auth/login');
  }

  user.credit -= amount;
  console.log(user.credit);

  const userRepository = await MysqlDataSource.getRepository(User);
  await userRepository.save(user);

  await renderMap(req, res);
};

export default { getHome, getMap, getMysqlData, getRedisData, payParking };
