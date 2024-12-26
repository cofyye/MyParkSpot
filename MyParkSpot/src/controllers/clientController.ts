import { Request, Response } from 'express';
import { UpdateAccountDto } from '../../src/dtos/client/update-account.dto';
import { MysqlDataSource } from '../../src/config/data-source';
import { User } from '../models/User';
import { Car } from '../models/Car';
import bcrypt from 'bcrypt';
import { RegisterCarDto } from '../dtos/client/register-car.dto';
import redisClient from '../config/redis';

const getAccount = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/account');
};

const postAccount = async (
  req: Request<{}, {}, UpdateAccountDto>,
  res: Response
): Promise<void> => {
  try {
    let user = await MysqlDataSource.getRepository(User).findOne({
      where: {
        id: (req.user as User).id,
      },
    });

    if (!user) {
      req.flash('error', 'This user does not exist.');
      return res.status(404).redirect('/client/account');
    }

    await MysqlDataSource.getRepository(User).update(
      {
        id: user.id,
      },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        ...(req.body.password
          ? {
              password: await bcrypt.hash(
                user.password,
                await bcrypt.genSalt(10)
              ),
            }
          : {}),
      }
    );

    // Sync with redis
    const userData = await redisClient.get(`user:${user.id}`);
    if (userData) {
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.email = req.body.email;
      user.username = req.body.username;

      await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(user));
    }

    req.flash('success', 'You have successfully updated your account.');
    return res.status(200).redirect('/client/account');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while updating your account.');
    return res.status(500).redirect('/client/account');
  }
};

const getPayments = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/payments');
};

const getSettings = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/settings');
};

const getMyCars = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;

    const cars = await MysqlDataSource.getRepository(Car).find({
      where: { user: { id: user.id } },
    });

    return res.status(200).render('pages/client/my-cars', { cars });
  } catch (error) {
    req.flash('error', 'An error occurred while fetching your cars.');
    return res.status(500).redirect('/client/my-cars');
  }
};

const getRegisterCar = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/register-car');
};

const postRegisterCar = async (
  req: Request<{}, {}, RegisterCarDto>,
  res: Response
): Promise<void> => {
  try {
    const newCar = new Car();
    const user = req.user as User;

    newCar.user = user;
    newCar.licensePlate = req.body.licensePlate;
    newCar.manufacturer = req.body.manufacturer;
    newCar.model = req.body.model;
    newCar.year = req.body.year;

    await MysqlDataSource.getRepository(Car).save(newCar);

    req.flash('success', 'Car registered successfully.');
    return res.status(201).redirect('/client/my-cars');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while registering the car.');
    return res.status(500).redirect('/client/cars/register');
  }
};

const postDeleteCar = async (req: Request, res: Response): Promise<void> => {
  try {
    const carId = req.params.id;
    const user = req.user as User;

    const carRepository = MysqlDataSource.getRepository(Car);

    const car = await carRepository.findOne({
      where: { id: carId, user: { id: user.id } },
    });

    if (!car) {
      req.flash('error', 'Car not found.');
      return res.status(404).redirect('/client/my-cars');
    }

    await carRepository.remove(car);

    req.flash('success', 'Car deleted successfully.');
    return res.status(200).redirect('/client/my-cars');
  } catch (error) {
    console.error('Error deleting car:', error);
    req.flash('error', 'An error occurred while deleting the car.');
    return res.status(500).redirect('/client/my-cars');
  }
};

export default {
  getAccount,
  getPayments,
  getSettings,
  getMyCars,
  postAccount,
  getRegisterCar,
  postRegisterCar,
  postDeleteCar,
};
