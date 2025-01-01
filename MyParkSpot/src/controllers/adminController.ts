import { Request, Response } from 'express';
import { MysqlDataSource } from '../config/data-source';
import { Zone } from '../models/Zone';
import { ParkingSpot } from '../models/ParkingSpot';
import { ParkingRental } from '../models/ParkingRental';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import moment from 'moment-timezone';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { plainToInstance } from 'class-transformer';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';

const getAdminDashboard = async (
  req: Request<{}, {}, {}, AdminDashboardDto>,
  res: Response
): Promise<void> => {
  const currentMonth =
    req.query.month ?? moment().utc().tz(moment.tz.guess()).format('YYYY-MM');

  const totalZones = await MysqlDataSource.getRepository(Zone).count({
    where: { isDeleted: false },
  });
  const totalSpots = await MysqlDataSource.getRepository(ParkingSpot).count({
    where: { isDeleted: false },
  });
  const occupiedSpots = await MysqlDataSource.getRepository(ParkingSpot).count({
    where: { isOccupied: true, isDeleted: false },
  });
  const freeSpots = totalSpots - occupiedSpots;

  const dailyRentals = await MysqlDataSource.getRepository(ParkingRental).find({
    where: {
      startTime: MoreThanOrEqual(moment().utc().startOf('day').toDate()),
      endTime: LessThanOrEqual(moment().utc().endOf('day').toDate()),
    },
  });

  const dailyRentalsCount = dailyRentals.length;
  const dailyRentalsRevenue = dailyRentals.reduce((acc, rental) => {
    return acc + rental.totalCost;
  }, 0);

  const rentalsByHour: { [key: string]: number } = {};

  dailyRentals.forEach(rental => {
    const rentalHour = moment(rental.startTime)
      .tz(moment.tz.guess())
      .format('HH:00');
    if (rentalsByHour[rentalHour]) {
      rentalsByHour[rentalHour]++;
    } else {
      rentalsByHour[rentalHour] = 1;
    }
  });

  let peakHour = '';
  let maxRentals = 0;

  for (const hour in rentalsByHour) {
    if (rentalsByHour[hour] > maxRentals) {
      maxRentals = rentalsByHour[hour];
      peakHour = hour;
    }
  }

  const peakRentalHour = peakHour
    ? `${peakHour} - ${parseInt(peakHour) + 1}:00`
    : 'N/A';

  const monthlyRentals = await MysqlDataSource.getRepository(
    ParkingRental
  ).find({
    where: {
      startTime: MoreThanOrEqual(
        moment.utc(currentMonth, 'YYYY-MM').startOf('month').toDate()
      ),
      endTime: LessThanOrEqual(
        moment.utc(currentMonth, 'YYYY-MM').endOf('month').toDate()
      ),
    },
    relations: ['parkingSpot', 'parkingSpot.zone'],
  });

  const monthlyRentalsCount = monthlyRentals.length;
  const monthlyRentalsRevenue = monthlyRentals.reduce((acc, rental) => {
    return acc + rental.totalCost;
  }, 0);

  const revenueAndRentalsPerZone: {
    [zoneId: string]: {
      zoneName: string;
      totalRevenue: number;
      rentalCount: number;
    };
  } = {};

  monthlyRentals.forEach(rental => {
    const zone = rental.parkingSpot.zone;

    const zoneId = zone.id;
    const zoneName = zone.name; // testing purposes
    // zone.name + ' (' + zone.type[0].toUpperCase() + zone.type.slice(1) + ')';

    if (!revenueAndRentalsPerZone[zoneId]) {
      revenueAndRentalsPerZone[zoneId] = {
        zoneName,
        totalRevenue: 0,
        rentalCount: 0,
      };
    }

    revenueAndRentalsPerZone[zoneId].totalRevenue += rental.totalCost;
    revenueAndRentalsPerZone[zoneId].rentalCount += 1;
  });

  const revenueByZone = Object.values(revenueAndRentalsPerZone).map(
    zoneData => ({
      zoneName: zoneData.zoneName,
      totalRevenue: zoneData.totalRevenue.toFixed(2),
      rentalCount: zoneData.rentalCount,
    })
  );

  return res.status(200).render('pages/admin/dashboard', {
    totalZones,
    totalSpots,
    occupiedSpots,
    freeSpots,
    dailyRentalsCount,
    dailyRentalsRevenue,
    peakRentalHour,
    monthlyRentalsCount,
    monthlyRentalsRevenue,
    revenueByZone,
    currentMonth,
  });
};

const getManageZones = async (req: Request, res: Response): Promise<void> => {
  const zones = await MysqlDataSource.getRepository(Zone).find({
    relations: ['parkingSpots'],
    order: { name: 'ASC' },
    where: { isDeleted: false },
  });

  return res.status(200).render('pages/admin/manage-zones', { zones });
};

const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const zone = await MysqlDataSource.getRepository(Zone).findOne({
        where: { id, isDeleted: false },
        relations: ['parkingSpots', 'parkingSpots.parkingRentals'],
      });

      if (!zone) {
        req.flash('error', 'Zone not found');
        return res.status(404).redirect('/admin/manage/zones');
      }

      const hasActiveRentals = zone.parkingSpots.some(spot => {
        return spot.parkingRentals.some(rental => {
          return rental.endTime > moment().utc().toDate();
        });
      });

      for (const spot of zone.parkingSpots) {
        await MysqlDataSource.getRepository(ParkingSpot).update(spot.id, {
          isDeleted: true,
        });
      }

      if (hasActiveRentals) {
        req.flash('error', 'Cannot delete zone with active parking rentals');
        return res.status(400).redirect('/admin/manage/zones');
      }

      await MysqlDataSource.getRepository(Zone).update(zone.id, {
        isDeleted: true,
      });

      req.flash('success', 'Zone deleted successfully');
      return res.status(200).redirect('/admin/manage/zones');
    });
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while deleting the zone');
    return res.status(404).redirect('/admin/manage/zones');
  }
};

const getCreateZone = async (req: Request, res: Response): Promise<void> => {
  return res.status(200).render('pages/admin/create-zone');
};

const postCreateZone = async (
  req: Request<{}, {}, CreateZoneDto>,
  res: Response
): Promise<void> => {
  try {
    const zone: Zone = plainToInstance(CreateZoneDto, req.body) as Zone;

    console.log(zone);

    await MysqlDataSource.getRepository(Zone).save(zone);

    req.flash('success', 'Zone created successfully');
    return res.status(200).redirect('/admin/manage/zones');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while creating the zone');
    return res.status(404).redirect('/admin/zones/add');
  }
};

export default {
  getAdminDashboard,
  getManageZones,
  deleteZone,
  getCreateZone,
  postCreateZone,
};
