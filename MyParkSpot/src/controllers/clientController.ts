import { NextFunction, Request, Response } from 'express';
import { UpdateAccountDto } from '../../src/dtos/client/update-account.dto';
import { MysqlDataSource } from '../../src/config/data-source';
import { User } from '../models/User';
import { Car } from '../models/Car';
import bcrypt from 'bcrypt';
import { RegisterCarDto } from '../dtos/client/register-car.dto';
import redisClient from '../config/redis';
import { Stripe } from 'stripe';
import { AddFundsDto } from '../dtos/client/add-funds.dto';
import { PaymentMethod } from '../enums/payment-method.enum';
import { CompletePaymentDto } from '../dtos/client/complete-payment.dto';
import { Transaction } from '../models/Transaction';
import { TransactionType } from '../enums/transaction-type.enum';
import { Fine } from '../models/Fine';
import { FineStatus } from '../enums/fine-status.enum';
import moment from 'moment';
import { Notification } from '../models/Notification';

// Init stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getAccount = async (_req: Request, res: Response): Promise<void> => {
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
  try {
    const user = req.user as User;

    const transactions = await MysqlDataSource.getRepository(Transaction).find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    return res
      .status(200)
      .render('pages/client/payments/payments', { transactions });
  } catch (error) {
    req.flash('error', 'An error occurred while fetching your transactions.');
    return res.status(500).redirect('/client/payments');
  }
};

const getAddFunds = async (_req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/payments/add-funds');
};

const getCompletePayments = async (
  req: Request<{}, {}, {}, CompletePaymentDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as User;

    if (req.query.payment_method === PaymentMethod.PAYPAL) {
      req.flash('error', 'PayPal is currently unavailable for payments.');
      return res.status(503).redirect('/client/payments/funds/add');
    } else {
      const session = await stripe.checkout.sessions.retrieve(
        req.query.session_id
      );

      await MysqlDataSource.transaction(async transaction => {
        await transaction.getRepository(Transaction).save({
          userId: user.id,
          transactionType: TransactionType.FUNDS_ADDED,
          amount: Number(session.amount_total) / 100,
        });

        await transaction.getRepository(User).update(
          {
            id: user.id,
          },
          {
            credit: Number(user.credit) + Number(session.amount_total) / 100,
          }
        );
      });

      // Sync with redis
      const userData = await redisClient.get(`user:${user.id}`);
      if (userData) {
        const tmpUser = JSON.parse(userData) as User;

        tmpUser.credit =
          Number(tmpUser.credit) + Number(session.amount_total) / 100;

        await redisClient.setEx(
          `user:${user.id}`,
          3600,
          JSON.stringify(tmpUser)
        );
      }
    }

    req.flash('success', 'Funds successfully added.');
    return res.status(200).redirect('/client/payments');
  } catch (err: unknown) {
    console.log(err);
    req.flash('error', 'An error occurred while completing the payment.');
    return res.status(500).redirect('/client/payments/funds/add');
  }
};

const getCancelPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  req.flash('error', 'Payment canceled.');
  return res.redirect('/client/payments');
};

const postAddFunds = async (
  req: Request<{}, {}, AddFundsDto>,
  res: Response
): Promise<void> => {
  try {
    if (req.body.paymentMethod === PaymentMethod.PAYPAL) {
      req.flash('error', 'PayPal is currently unavailable for payments.');
      return res.status(503).redirect('/client/payments/funds/add');
    } else {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'EUR',
              product_data: {
                name: `MyParkSpot - Add ${req.body.amount} €`,
                description:
                  'Easily add funds to your MyParkSpot account to ensure uninterrupted access to parking reservations and exclusive features. This secure payment will be instantly credited to your account balance, allowing you to enjoy seamless parking services whenever you need them.',
              },
              unit_amount: req.body.amount * 100,
            },
          },
        ],
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/client/payments/complete?payment_method=${req.body.paymentMethod}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/client/payments/cancel`,
      });

      return res.status(200).redirect(session.url);
    }
  } catch (err: unknown) {
    req.flash('error', 'An error occurred while adding funds.');
    return res.status(500).redirect('/client/payments/funds/add');
  }
};

const getSettings = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/client/settings');
};

const getMyCars = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;

    const cars = await MysqlDataSource.getRepository(Car).find({
      where: { userId: user.id, isDeleted: false },
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
    const existingCar = await MysqlDataSource.getRepository(Car).findOne({
      where: { licensePlate: req.body.licensePlate, isDeleted: false },
    });

    if (existingCar) {
      req.flash('error', 'A car with this license plate already exists.');
      return res.status(400).redirect('/client/cars/register');
    }

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
      where: { id: carId, userId: user.id },
    });

    if (!car) {
      req.flash('error', 'Car not found.');
      return res.status(404).redirect('/client/my-cars');
    }

    await carRepository.update(car.id, { isDeleted: true });

    req.flash('success', 'Car deleted successfully.');
    return res.status(200).redirect('/client/my-cars');
  } catch (error) {
    req.flash('error', 'An error occurred while deleting the car.');
    return res.status(500).redirect('/client/my-cars');
  }
};

const getFines = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    const fines = await MysqlDataSource.getRepository(Fine).find({
      where: {
        userId: user.id,
        status: FineStatus.ISSUED,
      },
      take: 20,
    });

    return res.status(200).render('pages/client/fines', { fines });
  } catch (error: unknown) {
    return res.status(500).render('pages/client/fines', { fines: [] });
  }
};

const postPayFine = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as User;

    const fine = await MysqlDataSource.getRepository(Fine).findOne({
      where: {
        id: req.params.id,
        status: FineStatus.ISSUED,
      },
    });

    if (!fine) {
      req.flash('error', 'The fine does not exist.');
      return res.status(404).redirect('/client/fines');
    }

    if (fine.status !== FineStatus.ISSUED) {
      req.flash('error', 'Fine must have issued status for proceed.');
      return res.status(409).redirect('/client/fines');
    }

    if (fine.userId !== user.id) {
      req.flash('error', 'You are not a owner of this fine.');
      return res.status(403).redirect('/client/fines');
    }

    if (Number(user.credit) < Number(fine.amount)) {
      req.flash('error', 'Insufficient credit.');
      return res.status(402).redirect('/client/fines');
    }

    await MysqlDataSource.transaction(async transaction => {
      await transaction.getRepository(User).update(
        {
          id: user.id,
        },
        {
          credit: Number(user.credit) - Number(fine.amount),
        }
      );

      await transaction.getRepository(Fine).update(
        {
          id: fine.id,
        },
        {
          status: FineStatus.PAID,
        }
      );

      const newTransaction = new Transaction();
      newTransaction.userId = user.id;
      newTransaction.transactionType = TransactionType.FINE_PAID;
      newTransaction.amount = Number(fine.amount);
      newTransaction.createdAt = moment().utc().toDate();
      await transaction.getRepository(Transaction).save(newTransaction);
    });

    // Sync with redis
    const userData = await redisClient.get(`user:${user.id}`);
    if (userData) {
      const tmpUser = JSON.parse(userData) as User;

      tmpUser.credit = Number(tmpUser.credit) - Number(fine.amount);

      await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(tmpUser));
    }

    req.flash('success', 'You are successfully paid a fine.');
    return res.status(403).redirect('/client/fines');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while getting the fines.');
    return res.status(500).redirect('/client/my-cars');
  }
};

const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as User;

    const notifications = await MysqlDataSource.getRepository(
      Notification
    ).find({
      where: {
        userId: user.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 5,
    });

    res.locals.notifications = notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.locals.notifications = [];
  }

  next();
};

const checkFines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user as User;

  const finesCount = await MysqlDataSource.getRepository(Fine).count({
    where: {
      userId: user.id,
      status: FineStatus.ISSUED,
    },
  });

  res.locals.finesCount = finesCount;

  next();
};

export default {
  getAccount,
  getPayments,
  getCompletePayments,
  getCancelPayments,
  getAddFunds,
  getSettings,
  getMyCars,
  getRegisterCar,
  postAddFunds,
  postAccount,
  postRegisterCar,
  postDeleteCar,
  getFines,
  postPayFine,
  getNotifications,
  checkFines,
};
