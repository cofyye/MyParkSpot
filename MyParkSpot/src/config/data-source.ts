import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { Zone } from '../models/Zone';
import { ParkingSpot } from '../models/ParkingSpot';
import { ParkingRental } from '../models/ParkingRental';
import { Transaction } from '../models/Transaction';

export const MysqlDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: true,
  timezone: 'Z',
  logging: false,
  entities: [User, Car, ParkingSpot, ParkingRental, Zone, Transaction],
});
