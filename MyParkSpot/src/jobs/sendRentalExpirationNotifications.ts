import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { ParkingRental } from '../models/ParkingRental';
import { Notification } from '../models/Notification';
import { NotificationType } from '../enums/notification-type.enum';
import moment from 'moment-timezone';
import { Between } from 'typeorm';
import { publisherClient } from '../config/redis';

const sendRentalExpirationNotifications = async () => {
  const targetMinuteStart = moment()
    .utc()
    .add(5, 'minutes')
    .startOf('minute')
    .toDate();

  const targetMinuteEnd = moment()
    .utc()
    .add(5, 'minutes')
    .endOf('minute')
    .toDate();

  const expiringRentals = await MysqlDataSource.getRepository(
    ParkingRental
  ).find({
    where: {
      endTime: Between(targetMinuteStart, targetMinuteEnd),
      expired: false,
    },
    relations: {
      car: true,
    },
    select: {
      id: true,
      userId: true,
      parkingSpotId: true,
      endTime: true,
      car: {
        id: true,
        licensePlate: true,
      },
    },
  });

  console.log('x');
  await publisherClient.publish('notification', 'notify from cronjob');

  for (const rental of expiringRentals) {
    const expirationTime = moment(rental.endTime).format('LT');

    const notification = new Notification();
    notification.userId = rental.userId;
    notification.message = `Your parking rental expires at ${expirationTime} for ${rental.car.licensePlate}. Tap here to extend it.`;
    notification.type = NotificationType.RENTAL_ENDING;
    notification.createdAt = moment().utc().toDate();
    notification.isRead = false;
    notification.parkingSpotId = rental.parkingSpotId;

    await MysqlDataSource.getRepository(Notification).save(notification);
  }
};

cron.schedule('* * * * *', sendRentalExpirationNotifications);

export default sendRentalExpirationNotifications;
