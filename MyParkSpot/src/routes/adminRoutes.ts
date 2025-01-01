import express from 'express';
import adminController from '../controllers/adminController';
import { validateDto } from '../middlewares/validateDto';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';
import { CreateZoneDto } from '../dtos/admin/create-zone.dto';

const router = express.Router();

// Get methods
router.get(
  '/dashboard',
  validateDto(AdminDashboardDto),
  adminController.getAdminDashboard
);
router.get('/manage/zones', adminController.getManageZones);
router.get('/zones/add', adminController.getCreateZone);

// Post methods
router.post('/zones/delete/:id', adminController.deleteZone);
router.post(
  '/zones/add',
  validateDto(CreateZoneDto),
  adminController.postCreateZone
);

export default router;
