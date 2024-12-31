import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { Car } from '../models/Car';
import { ParkingSpot } from '../models/ParkingSpot';
import { LessThanOrEqual } from 'typeorm';
import { ParkingRental } from '../models/ParkingRental';
import moment from 'moment-timezone';

const releaseParkingSpots = async () => {
  const expiredRentals = await MysqlDataSource.getRepository(
    ParkingRental
  ).find({
    where: {
      endTime: LessThanOrEqual(moment().utc().toDate()),
    },
    relations: ['car', 'parkingSpot'],
  });

  for (const rental of expiredRentals) {
    const car = rental.car;
    const parkingSpot = rental.parkingSpot;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.update(Car, car.id, { isParked: false });
      await transactionalEntityManager.update(ParkingSpot, parkingSpot.id, {
        isOccupied: false,
      });
    });
  }
};

cron.schedule('* * * * *', releaseParkingSpots);

export default releaseParkingSpots;
