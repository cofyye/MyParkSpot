import express from 'express';
import adminController from '../controllers/adminController';
import { validateDto } from '../middlewares/validateDto';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';
import { CreateUserDto } from '../dtos/admin/create-user.dto';

const router = express.Router();

// Get methods
router.get(
  '/dashboard',
  validateDto(AdminDashboardDto),
  adminController.getAdminDashboard
);
router.get('/manage/zones', adminController.getManageZones);
router.get('/zones/add', adminController.getCreateZone);
router.get('/users', adminController.getUsers);
router.get('/users/create', adminController.getCreateUser);

// Post methods
router.post('/zones/delete/:id', adminController.deleteZone);
router.post(
  '/zones/add',
  validateDto(CreateZoneDto),
  adminController.postCreateZone
);
router.post(
  '/users/create',
  validateDto(CreateUserDto),
  adminController.postCreateUser
);

export default router;
