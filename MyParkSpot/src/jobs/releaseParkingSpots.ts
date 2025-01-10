import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { Car } from '../models/Car';
import { ParkingSpot } from '../models/ParkingSpot';
import { LessThanOrEqual } from 'typeorm';
import { ParkingRental } from '../models/ParkingRental';
import moment from 'moment-timezone';
import redisClient from '../config/redis';

const releaseParkingSpots = async () => {
  const expiredRentals = await MysqlDataSource.getRepository(
    ParkingRental
  ).find({
    where: {
      endTime: LessThanOrEqual(moment().utc().toDate()),
      expired: false,
    },
    select: {
      id: true,
      carId: true,
      parkingSpotId: true,
    },
  });

  for (const rental of expiredRentals) {
    await MysqlDataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.getRepository(Car).update(
        {
          id: rental.carId,
        },
        { isParked: false }
      );

      await transactionalEntityManager.getRepository(ParkingSpot).update(
        {
          id: rental.parkingSpotId,
        },
        {
          isOccupied: false,
        }
      );

      await transactionalEntityManager.getRepository(ParkingRental).update(
        {
          id: rental.id,
        },
        {
          expired: true,
        }
      );
    });

    // Sync with Redis
    const parkingSpotsData = await redisClient.get('parkingSpots');
    const parkingSpots = JSON.parse(parkingSpotsData) as ParkingSpot[];
    const updatedParkingSpots = parkingSpots.map(s =>
      s.id === rental.parkingSpotId ? { ...s, isOccupied: false } : s
    );
    await redisClient.set('parkingSpots', JSON.stringify(updatedParkingSpots));
  }
};

cron.schedule('* * * * *', releaseParkingSpots);

export default releaseParkingSpots;
