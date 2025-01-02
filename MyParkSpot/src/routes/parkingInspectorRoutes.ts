import express from 'express';
import parkingInspectorController from '../controllers/parkingInspectorController';
import { validateDto } from '../middlewares/validateDto';
import { IssueFineDto } from '../dtos/parkingInspector/issue-fine.dto';

const router = express.Router();

// Get methods
router.get('/fines', parkingInspectorController.getFines);

// Post methods
router.post(
  '/fines/issue',
  validateDto(IssueFineDto),
  parkingInspectorController.issueFine
);
router.post('/fines/cancel/:id', parkingInspectorController.cancelIssuedFine);

export default router;
