import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { Car } from '../models/Car';
import { ParkingSpot } from '../models/ParkingSpot';
import { LessThanOrEqual } from 'typeorm';
import { ParkingRental } from '../models/ParkingRental';

const releaseParkingSpots = async () => {
  const now = new Date();

  const expiredRentals = await MysqlDataSource.getRepository(
    ParkingRental
  ).find({
    where: {
      endTime: LessThanOrEqual(now),
    },
    relations: ['car', 'parkingSpot'],
  });

  for (const rental of expiredRentals) {
    const car = rental.car;
    const parkingSpot = rental.parkingSpot;

    car.isParked = false;
    parkingSpot.isOccupied = false;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(Car, car);
      await transactionalEntityManager.save(ParkingSpot, parkingSpot);
    });
  }
};

cron.schedule('* * * * *', releaseParkingSpots);

export default releaseParkingSpots;
