import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { Fine } from '../models/Fine';
import { FineStatus } from '../enums/fine-status.enum';
import { IsNull } from 'typeorm';
import { Car } from '../models/Car';

const newCarsSynchronization = async () => {
  const activeFines = await MysqlDataSource.getRepository(Fine).find({
    where: {
      status: FineStatus.ISSUED,
      userId: IsNull(),
    },
  });

  activeFines.forEach(async fine => {
    const car = await MysqlDataSource.getRepository(Car).findOne({
      where: {
        licensePlate: fine.licensePlate,
        isDeleted: false,
      },
    });

    if (car) {
      fine.userId = car.userId;
      fine.carId = car.id;
      await MysqlDataSource.getRepository(Fine).save(fine);
    }
  });
};

cron.schedule('0 0 * * *', newCarsSynchronization);

export default newCarsSynchronization;
