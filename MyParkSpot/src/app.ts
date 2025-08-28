import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { RedisStore } from 'connect-redis';
import { Server } from 'socket.io';
import http from 'http';
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
import redisClient, { publisherClient, subscriberClient } from './config/redis';
import homeRoutes from './routes/homeRoutes';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import adminRoutes from './routes/adminRoutes';
import parkingInspectorRoutes from './routes/parkingInspectorRoutes';
import sendRentalExpirationNotifications from './jobs/sendRentalExpirationNotifications';
import clientController from './controllers/clientController';
import newCarsSynchronization from './jobs/newCarsSynchronization';
import authenticatedGuard from './middlewares/authenticatedGuard';
import { UserRole } from './enums/user-role.enum';
import roleGuard from './middlewares/roleGuard';
import compression from 'compression';
import utils from './utils/utils';

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

    // Pub/Sub Redis
    await subscriberClient.connect();
    await publisherClient.connect();

    // Sync all parking spots with Redis
    await utils.syncParkingSpotsToRedis();

    // Cron Jobs
    releaseParkingSpots();
    sendRentalExpirationNotifications();
    newCarsSynchronization();

    // App Initialization
    const app = express();
    const port = process.env.PORT || 3000;

    // Compression
    app.use(compression());

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
              'https://cdnjs.cloudflare.com',
              "'unsafe-inline'",
              'https://checkout.stripe.com',
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
              'https://*.stripe.com',
            ],
            frameSrc: ["'self'", 'https://checkout.stripe.com'],
            connectSrc: ["'self'", 'https://checkout.stripe.com'],
            formAction: ["'self'", 'https://checkout.stripe.com'],
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
          sameSite: 'none',
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

        next();
      }
    );

    app.use(clientController.getNotifications);
    app.use(clientController.getActiveCars);

    // Initialization of Routes
    app.use('/', homeRoutes);
    app.use('/auth', authRoutes);
    app.use('/client', [authenticatedGuard], clientRoutes);
    app.use(
      '/admin',
      [authenticatedGuard, roleGuard([UserRole.FOUNDER, UserRole.ADMIN])],
      adminRoutes
    );
    app.use(
      '/parking-inspector',
      [authenticatedGuard, roleGuard([UserRole.PARKING_INSPECTOR])],
      parkingInspectorRoutes
    );

    // Run the application
    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });

    // Run the socket
    const io = new Server(server);

    // RealTime Connections with Redis Pub/Sub
    await subscriberClient.subscribe('notification', (message, _channel) => {
      io.emit('NEW_NOTIFICATION', message);
    });
  } catch (error: unknown) {
    console.error('Database connection error:', error);
    process.exit();
  }
};

main();
