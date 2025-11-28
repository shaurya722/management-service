import {
  createDetectorController,
  deleteDetectorController,
  getBuildInDetectorsController,
  getDetectorController,
  getDetectorDropdownController,
  getDetectorTypes,
  listDetectorsController,
  updateDetectorController,
  validation,
} from '@/controllers/company/detector.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createDetector, createDetectorController as RequestHandler);
router.put('/:id', validation.updateDetector, updateDetectorController as RequestHandler);
router.delete('/:id', validation.deleteDetector, deleteDetectorController as RequestHandler);

// List and dropdown operations
router.post('/list', validation.listDetectors, listDetectorsController as RequestHandler);
router.get('/dropdown', getDetectorDropdownController as RequestHandler);
router.get('/built-in', getBuildInDetectorsController as RequestHandler);
router.get('/types', getDetectorTypes as RequestHandler);
router.get('/:id', validation.getDetector, getDetectorController as RequestHandler);

export default router;
