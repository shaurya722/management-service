import {
  createProbeController,
  deleteProbeController,
  getBuiltInProbesController,
  getProbeController,
  getProbeDropdownController,
  listProbesController,
  updateProbeController,
  validation,
} from '@/controllers/company/probe.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createProbe, createProbeController as RequestHandler);
router.put('/:id', validation.updateProbe, updateProbeController as RequestHandler);
router.delete('/:id', validation.deleteProbe, deleteProbeController as RequestHandler);

// List and dropdown operations
router.post('/list', validation.listProbes, listProbesController as RequestHandler);
router.get('/dropdown', getProbeDropdownController as RequestHandler);
router.get('/built-in', getBuiltInProbesController as RequestHandler);
router.get('/:id', validation.getProbe, getProbeController as RequestHandler);

export default router;
