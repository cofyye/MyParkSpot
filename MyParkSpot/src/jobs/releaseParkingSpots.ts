import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { ParkingReservation } from '../models/ParkingReservation';
import { Car } from '../models/Car';
import { ParkingSpot } from '../models/ParkingSpot';
import { LessThanOrEqual } from 'typeorm';

const releaseParkingSpots = async () => {
  const now = new Date();

  const expiredReservations = await MysqlDataSource.getRepository(
    ParkingReservation
  ).find({
    where: {
      endTime: LessThanOrEqual(now),
    },
    relations: ['car', 'parkingSpot'],
  });

  for (const reservation of expiredReservations) {
    const car = reservation.car;
    const parkingSpot = reservation.parkingSpot;

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
