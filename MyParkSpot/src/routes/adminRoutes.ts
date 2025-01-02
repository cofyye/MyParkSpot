import express from 'express';
import adminController from '../controllers/adminController';
import { validateDto } from '../middlewares/validateDto';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';
import { CreateUserDto } from '../dtos/admin/create-user.dto';
import { EditUserDto } from '../dtos/admin/edit-user.dto';
import { CreateSpotDto } from '../dtos/admin/create-spot.dto';
import authenticatedGuard from '../middlewares/authenticatedGuard';
import roleGuard from '../middlewares/roleGuard';
import { UserRole } from '../enums/user-role.enum';
import { EditZoneDto } from '../dtos/admin/edit-zone.dto';

const router = express.Router();

// Get methods
router.get(
  '/dashboard',
  [
    authenticatedGuard,
    roleGuard([UserRole.FOUNDER, UserRole.ADMIN, UserRole.SUPPORT]),
    validateDto(AdminDashboardDto, 'query'),
  ],
  adminController.getAdminDashboard
);
router.get(
  '/manage/zones',
  [authenticatedGuard],
  adminController.getManageZones
);
router.get(
  '/manage/spots',
  [authenticatedGuard],
  adminController.getManageSpots
);
router.get('/zones/add', [authenticatedGuard], adminController.getCreateZone);
router.get(
  '/zones/edit/:id',
  [authenticatedGuard],
  adminController.getEditZone
);
router.get('/users', [authenticatedGuard], adminController.getUsers);
router.get(
  '/users/create',
  [authenticatedGuard],
  adminController.getCreateUser
);
router.get(
  '/users/edit/:id',
  [authenticatedGuard],
  adminController.getEditUser
);

// Post methods
router.post(
  '/zones/delete/:id',
  [authenticatedGuard],
  adminController.deleteZone
);
router.post(
  '/zones/add',
  [authenticatedGuard, validateDto(CreateZoneDto, 'body')],
  adminController.postCreateZone
);
router.post(
  '/zones/edit/:id',
  [authenticatedGuard, validateDto(EditZoneDto, 'body')],
  adminController.postEditZone
);
router.post(
  '/users/create',
  [authenticatedGuard, validateDto(CreateUserDto, 'body')],
  adminController.postCreateUser
);
router.post(
  '/users/delete/:id',
  [authenticatedGuard],
  adminController.deleteUser
);
router.post(
  '/users/edit/:id',
  [authenticatedGuard, validateDto(EditUserDto, 'body')],
  adminController.postEditUser
);
router.post(
  '/spots/delete/:id',
  [authenticatedGuard],
  adminController.deleteSpot
);
router.post(
  '/spots/add',
  [authenticatedGuard, validateDto(CreateSpotDto, 'body')],
  adminController.postCreateSpot
);

export default router;
