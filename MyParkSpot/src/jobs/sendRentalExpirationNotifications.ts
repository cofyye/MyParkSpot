import cron from 'node-cron';
import { MysqlDataSource } from '../config/data-source';
import { ParkingRental } from '../models/ParkingRental';
import { Notification } from '../models/Notification';
import { NotificationType } from '../enums/notification-type.enum';
import moment from 'moment-timezone';
import { Between } from 'typeorm';

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
    },
    relations: ['user'],
  });

  for (const rental of expiringRentals) {
    const user = rental.user;
    const expirationTime = moment(rental.endTime).format('LT');

    const notification = new Notification();
    notification.userId = user.id;
    notification.message = `Your parking rental expires at ${expirationTime}. Tap here to extend it.`;
    notification.type = NotificationType.RENTAL_ENDING;
    notification.createdAt = moment().utc().toDate();
    notification.isRead = false;
    notification.parkingSpotId = rental.parkingSpotId;

    await MysqlDataSource.getRepository(Notification).save(notification);
  }
};

cron.schedule('* * * * *', sendRentalExpirationNotifications);

export default sendRentalExpirationNotifications;
