import { Request, Response } from 'express';
import { MysqlDataSource } from '../config/data-source';
import { Zone } from '../models/Zone';
import { ParkingSpot } from '../models/ParkingSpot';
import { ParkingRental } from '../models/ParkingRental';
import { LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import moment from 'moment-timezone';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { plainToInstance } from 'class-transformer';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';
import { User } from '../models/User';
import { UserRole } from '../enums/user-role.enum';
import { CreateUserDto } from '../dtos/admin/create-user.dto';
import bcrypt from 'bcrypt';
import redisClient from '../config/redis';
import { EditUserDto } from '../dtos/admin/edit-user.dto';
import { CreateSpotDto } from '../dtos/admin/create-spot.dto';
import { EditZoneDto } from '../dtos/admin/edit-zone.dto';

const getAdminDashboard = async (
  req: Request<{}, {}, {}, AdminDashboardDto>,
  res: Response
): Promise<void> => {
  const currentMonth = req.query.month ?? moment().utc().format('YYYY-MM');

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
    const rentalHour = moment(rental.startTime).format('HH:00');
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
      const zone = await transactionalEntityManager
        .getRepository(Zone)
        .findOne({
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
        await transactionalEntityManager
          .getRepository(ParkingSpot)
          .update(spot.id, {
            isDeleted: true,
          });
      }

      if (hasActiveRentals) {
        req.flash('error', 'Cannot delete zone with active parking rentals');
        return res.status(400).redirect('/admin/manage/zones');
      }

      await transactionalEntityManager.getRepository(Zone).update(zone.id, {
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

    await MysqlDataSource.getRepository(Zone).save(zone);

    req.flash('success', 'Zone created successfully');
    return res.status(200).redirect('/admin/manage/zones');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while creating the zone');
    return res.status(500).redirect('/admin/zones/add');
  }
};

const getEditZone = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const zone = await MysqlDataSource.getRepository(Zone).findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!zone) {
      req.flash('error', 'This zone does not exist.');
      return res.status(500).redirect('/admin/manage/zones');
    }

    return res.status(200).render('pages/admin/edit-zone', { zone });
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while getting the zone');
    return res.status(500).redirect('/admin/manage/zones');
  }
};

const postEditZone = async (
  req: Request<{ id: string }, {}, EditZoneDto>,
  res: Response
): Promise<void> => {
  try {
    const zone = await MysqlDataSource.getRepository(Zone).findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!zone) {
      req.flash('error', 'This zone does not exist.');
      return res.status(500).redirect('/admin/manage/zones');
    }

    await MysqlDataSource.getRepository(Zone).update(
      {
        id: zone.id,
      },
      {
        name: req.body.name,
        type: req.body.type,
        baseCost: req.body.baseCost,
        dailyPassCost: req.body.dailyPassCost,
        extensionCost: req.body.extensionCost,
        maxExtensionDuration: req.body.maxExtensionDuration,
        maxParkingDuration: req.body.maxParkingDuration,
      }
    );

    req.flash('success', 'Zone edited successfully');
    return res.status(200).redirect(`/admin/zones/edit/${req.params.id}`);
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while editing the zone');
    return res.status(500).redirect(`/admin/zones/edit/${req.params.id}`);
  }
};

const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await MysqlDataSource.getRepository(User).find({
    order: {
      registrationDate: 'DESC',
    },
    where: { isDeleted: false },
  });
  return res.status(200).render('pages/admin/users', { users });
};

const getCreateUser = async (_req: Request, res: Response): Promise<void> => {
  return res
    .status(200)
    .render('pages/admin/create-user', { roles: Object.values(UserRole) });
};

const postCreateUser = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response
): Promise<void> => {
  try {
    let user = await MysqlDataSource.getRepository(User).findOne({
      where: { email: req.body.email, username: req.body.username },
    });

    if (user?.email === req.body.email) {
      req.flash('error', 'A user with this email address already exists.');
      return res.status(409).redirect('/admin/users/create');
    }

    if (user?.username === req.body.username) {
      req.flash('error', 'A user with this username already exists.');
      return res.status(409).redirect('/admin/users/create');
    }

    user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    user.role = req.body.role;

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(user.password, salt);

    user.password = password;

    await MysqlDataSource.getRepository(User).save(user);

    req.flash('success', 'You have successfully created a user.');
    return res.status(201).redirect('/admin/users');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred during creating a user.');
    return res.status(500).redirect('/admin/users/create');
  }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await MysqlDataSource.transaction(async transactionalEntityManager => {
      const user = await transactionalEntityManager
        .getRepository(User)
        .findOne({
          where: { id, isDeleted: false },
        });

      if (!user) {
        req.flash('error', 'User not found');
        return res.status(404).redirect('/admin/users');
      }

      await transactionalEntityManager
        .getRepository(User)
        .update(user.id, { isDeleted: true });

      await redisClient.del(`user:${user.id}`);

      req.flash('success', 'User deleted successfully');
      return res.status(200).redirect('/admin/users');
    });
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while deleting the user');
    return res.status(404).redirect('/admin/users');
  }
};

const getEditUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await MysqlDataSource.getRepository(User).findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      req.flash('error', 'User not found');
      return res.status(404).redirect('/admin/users');
    }

    return res.status(200).render('pages/admin/edit-user', {
      user,
      roles: Object.values(UserRole),
    });
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while fetching the user');
    return res.status(404).redirect('/admin/users');
  }
};

const postEditUser = async (
  req: Request<{ id: string }, {}, EditUserDto>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, email, password, role } = req.body;

    const user = await MysqlDataSource.getRepository(User).findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      req.flash('error', 'User not found');
      return res.status(404).redirect('/admin/users');
    }

    const existingEmailUser = await MysqlDataSource.getRepository(User).findOne(
      {
        where: { email, isDeleted: false, id: Not(id) },
      }
    );

    if (existingEmailUser) {
      req.flash('error', 'A user with this email address already exists.');
      return res.status(409).redirect(`/admin/users/edit/${id}`);
    }

    const existingUsernameUser = await MysqlDataSource.getRepository(
      User
    ).findOne({
      where: { username, isDeleted: false, id: Not(id) },
    });

    if (existingUsernameUser) {
      req.flash('error', 'A user with this username already exists.');
      return res.status(409).redirect(`/admin/users/edit/${id}`);
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.email = email;
    user.role = role;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await MysqlDataSource.getRepository(User).save(user);
    await redisClient.del(`user:${user.id}`);

    req.flash('success', 'User updated successfully.');
    return res.status(200).redirect('/admin/users');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while updating the user.');
    return res.status(500).redirect(`/admin/users/edit/${req.params.id}`);
  }
};

const getManageSpots = async (req: Request, res: Response): Promise<void> => {
  try {
    const parkingSpots = await MysqlDataSource.getRepository(ParkingSpot).find({
      where: { isDeleted: false },
      relations: ['zone'],
      order: { id: 'ASC' },
    });

    const zones = await MysqlDataSource.getRepository(Zone).find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });

    return res.render('pages/admin/manage-spots', {
      parkingSpots: JSON.stringify(parkingSpots),
      zones,
    });
  } catch (error: unknown) {
    req.flash('error', 'Error retrieving parking spots.');
    return res.redirect('/admin/dashboard');
  }
};

const deleteSpot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const spot = await MysqlDataSource.getRepository(ParkingSpot).findOne({
      where: { id, isDeleted: false },
      relations: ['parkingRentals'],
    });

    if (!spot) {
      req.flash('error', 'Spot not found');
      return res.status(404).redirect('/admin/manage/spots');
    }

    const hasActiveRentals = spot.parkingRentals.some(rental => {
      return rental.endTime > moment().utc().toDate();
    });

    if (hasActiveRentals) {
      req.flash(
        'error',
        'Cannot delete parking spot with active parking rentals'
      );
      return res.status(400).redirect('/admin/manage/spots');
    }

    await MysqlDataSource.getRepository(ParkingSpot).update(spot.id, {
      isDeleted: true,
    });

    req.flash('success', 'Parking spot deleted successfully');
    return res.status(200).redirect('/admin/manage/spots');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while deleting the spot');
    return res.status(404).redirect('/admin/manage/spots');
  }
};

const postCreateSpot = async (
  req: Request<{}, {}, CreateSpotDto>,
  res: Response
): Promise<void> => {
  try {
    const spot: ParkingSpot = plainToInstance(
      CreateSpotDto,
      req.body
    ) as ParkingSpot;

    await MysqlDataSource.getRepository(ParkingSpot).save(spot);

    req.flash('success', 'Parking spot created successfully');
    return res.status(200).redirect('/admin/manage/spots');
  } catch (error: unknown) {
    req.flash('error', 'An error occurred while creating the spot');
    return res.status(404).redirect('/admin/manage/spots');
  }
};

export default {
  getAdminDashboard,
  getManageZones,
  deleteZone,
  getCreateZone,
  postCreateZone,
  getEditZone,
  postEditZone,
  getUsers,
  getCreateUser,
  postCreateUser,
  deleteUser,
  getEditUser,
  postEditUser,
  getManageSpots,
  deleteSpot,
  postCreateSpot,
};
