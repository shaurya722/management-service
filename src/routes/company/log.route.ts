import {
  getLogController,
  getLogsByJobController,
  listLogsController,
  validation,
} from '@/controllers/company/log.controller';
import validator from '@/function/validator';
import { getLogsByJobValidation } from '@/validation/log.validation';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// List logs with filtering
router.post('/list', validation.listLogs, listLogsController as RequestHandler);

// Get logs by job ID
router.post(
  '/job/:jobId',
  validator(getLogsByJobValidation),
  getLogsByJobController as RequestHandler
);

// Get single log (must be last to avoid conflicts)
router.get('/:id', validation.getLog, getLogController as RequestHandler);

export default router;
