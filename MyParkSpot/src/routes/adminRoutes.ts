import express from 'express';
import adminController from '../controllers/adminController';
import { validateDto } from '../middlewares/validateDto';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';
import { CreateUserDto } from '../dtos/admin/create-user.dto';
import { EditUserDto } from '../dtos/admin/edit-user.dto';
import { CreateSpotDto } from '../dtos/admin/create-spot.dto';
import { EditZoneDto } from '../dtos/admin/edit-zone.dto';

const router = express.Router();

// Get methods
router.get(
  '/dashboard',
  [validateDto(AdminDashboardDto, 'query')],
  adminController.getAdminDashboard
);
router.get('/spots', adminController.getManageSpots);
router.get('/zones', adminController.getManageZones);
router.get('/zones/add', adminController.getCreateZone);
router.get('/zones/details/:id', adminController.getZoneDetails);
router.get('/zones/edit/:id', adminController.getEditZone);
router.get('/users', adminController.getUsers);
router.get('/users/create', adminController.getCreateUser);
router.get('/users/edit/:id', adminController.getEditUser);

// Post methods
router.post('/zones/delete/:id', adminController.deleteZone);
router.post(
  '/zones/add',
  [validateDto(CreateZoneDto, 'body')],
  adminController.postCreateZone
);
router.post(
  '/zones/edit/:id',
  [validateDto(EditZoneDto, 'body')],
  adminController.postEditZone
);
router.post(
  '/users/create',
  [validateDto(CreateUserDto, 'body')],
  adminController.postCreateUser
);
router.post('/users/delete/:id', adminController.deleteUser);
router.post(
  '/users/edit/:id',
  [validateDto(EditUserDto, 'body')],
  adminController.postEditUser
);
router.post('/spots/delete/:id', adminController.deleteSpot);
router.post(
  '/spots/add',
  [validateDto(CreateSpotDto, 'body')],
  adminController.postCreateSpot
);

export default router;
