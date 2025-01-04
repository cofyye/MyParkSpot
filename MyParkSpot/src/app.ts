import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { RedisStore } from 'connect-redis';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import releaseParkingSpots from './jobs/releaseParkingSpots';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import flash from 'express-flash';
import expressSession from 'express-session';
import initPassport from './config/passport';
import passport from 'passport';
import moment from 'moment-timezone';
import { MysqlDataSource } from './config/data-source';
import redisClient from './config/redis';

import homeRoutes from './routes/homeRoutes';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import adminRoutes from './routes/adminRoutes';
import parkingInspectorRoutes from './routes/parkingInspectorRoutes';
import { read } from 'fs';

const main = async (): Promise<void> => {
  try {
    // Test MySQL Connection
    await MysqlDataSource.initialize();
    console.log('MySQL Database connection established!');

    // Test Redis Connection
    await redisClient.connect();
    await redisClient.set('TEST_CONNECTION', 1);
    console.log('Redis Database connection established!');
    await redisClient.del('TEST_CONNECTION');

    // Cron Jobs
    releaseParkingSpots();

    // App Initialization
    const app = express();
    const port = process.env.PORT || 3000;

    // Security
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              'https://unpkg.com',
              'https://cdn.jsdelivr.net',
              "'unsafe-inline'",
            ],
            styleSrc: [
              "'self'",
              'https://unpkg.com',
              'https://fonts.googleapis.com',
              'https://site-assets.fontawesome.com',
              "'unsafe-inline'",
            ],
            fontSrc: [
              "'self'",
              'https://fonts.gstatic.com',
              'https://site-assets.fontawesome.com',
            ],
            imgSrc: [
              "'self'",
              'data:',
              'https://site-assets.fontawesome.com',
              'https://a.basemaps.cartocdn.com',
              'https://b.basemaps.cartocdn.com',
              'https://c.basemaps.cartocdn.com',
              'https://d.basemaps.cartocdn.com',
              'https://unpkg.com',
            ],
          },
        },
      })
    );
    app.use(hpp());
    app.use(cors());
    app.use(cookieParser());

    // Template Engine & Assets Settings
    app.set('view engine', 'ejs');
    app.set('trust proxy', 1);
    app.set('views', join(__dirname, 'views'));
    app.use(express.static(join(__dirname, 'public')));

    // Body settings & flush messages & sessions
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(flash());
    app.use(
      expressSession({
        store: new RedisStore({
          client: redisClient,
        }),
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: true,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true,
        },
      })
    );

    // Initialization of Passport
    initPassport(passport);
    app.use(passport.initialize());
    app.use(passport.session());

    // Rest middlewares
    app.use(
      async (
        req: Request,
        res: Response,
        next: NextFunction
      ): Promise<void> => {
        res.locals.session = req.session;
        res.locals.user = req.user;
        res.locals.moment = moment;
        res.locals.notifications = [
          {
            message:
              'A fine has been issued to your vehicle PK054RM. Tap here to pay it.',
            createdAt: moment().subtract(1, 'day').toDate(),
            isRead: false,
            type: 'fine_issued',
          },
          {
            message: 'Your parking rental expires at 12:31 PM.',
            createdAt: moment().subtract(2, 'hours').toDate(),
            isRead: true,
            type: 'rental_ending',
          },
          {
            message:
              'Your parking rental expires at 12:31 PM. Tap here to extend it.',
            createdAt: moment().subtract(25, 'minutes').toDate(),
            isRead: false,
            type: 'rental_ending',
          },
        ];

        next();
      }
    );

    // Initialization of Routes
    app.use('/', homeRoutes);
    app.use('/auth', authRoutes);
    app.use('/client', clientRoutes);
    app.use('/admin', adminRoutes);
    app.use('/parking-inspector', parkingInspectorRoutes);

    // Run the application
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error: unknown) {
    console.error('Database connection error:', error);
    process.exit();
  }
};

main();
