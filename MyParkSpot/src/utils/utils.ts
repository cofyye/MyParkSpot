import { ParkingSpot } from '../models/ParkingSpot';
import { MysqlDataSource } from '../config/data-source';
import redisClient from '../config/redis';

async function syncParkingSpotsToRedis() {
  const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find({
    where: { isDeleted: false },
    relations: ['zone'],
  });

  await redisClient.set('parkingSpots', JSON.stringify(parkingSpots));

  for (const spot of parkingSpots) {
    await redisClient.geoAdd('geo:parkingSpots', {
      longitude: spot.longitude,
      latitude: spot.latitude,
      member: spot.id,
    });
  }
}

export default { syncParkingSpotsToRedis };
