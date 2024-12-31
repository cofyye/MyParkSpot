import express from 'express';
import adminController from '../controllers/adminController';
import { validateDto } from '../middlewares/validateDto';
import { AdminDashboardDto } from '../dtos/admin/admin-dashboard.dto';

const router = express.Router();

// Get methods
router.get(
  '/dashboard',
  validateDto(AdminDashboardDto),
  adminController.getAdminDashboard
);

// Post methods

export default router;
