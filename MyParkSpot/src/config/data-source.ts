import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { ParkingSpot } from '../models/ParkingSpot';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: true,
  logging: false,
  entities: [User, Car, ParkingSpot],
});
