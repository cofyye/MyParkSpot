import 'dotenv/config';
import express from 'express';
import { join } from 'path';
import { AppDataSource } from './config/data-source';
import redisClient from './config/redis';

import homeRoutes from './routes/homeRoutes';
import authRoutes from './routes/authRoutes';

const main = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established!');

    await redisClient.connect();
    console.log('Connected to Redis');

    const app = express();
    const port = 3000;

    app.set('view engine', 'ejs');
    app.set('views', join(__dirname, 'views'));

    app.use(express.static(join(__dirname, 'public')));

    app.use('/', homeRoutes);
    app.use('/auth', authRoutes);

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error: unknown) {
    console.error('Database connection error:', error);
  }
};

main();
