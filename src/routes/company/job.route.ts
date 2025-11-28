import {
  createJobController,
  deleteJobController,
  getJobController,
  getJobDropdownController,
  getJobReportController,
  getJobsByProjectController,
  getJobsByStatusController,
  getJobStatuses,
  getJobTypes,
  listJobsController,
  updateJobController,
  validation,
} from '@/controllers/company/job.controller';
import validator from '@/function/validator';
import { getJobsByProjectValidation, getJobsByStatusValidation } from '@/validation/job.validation';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createJob, createJobController as RequestHandler);
router.put('/:id', validation.updateJob, updateJobController as RequestHandler);
router.delete('/:id', validation.deleteJob, deleteJobController as RequestHandler);

// List and dropdown operations
router.post('/list', validation.listJobs, listJobsController as RequestHandler);
router.get('/dropdown', getJobDropdownController as RequestHandler);

// Utility endpoints
router.get('/statuses', getJobStatuses as RequestHandler);
router.get('/types', getJobTypes as RequestHandler);

// Filter operations
router.get(
  '/project/:projectId',
  validator(getJobsByProjectValidation),
  getJobsByProjectController as RequestHandler
);
router.get(
  '/status/:status',
  validator(getJobsByStatusValidation),
  getJobsByStatusController as RequestHandler
);

// Get job report for BLUE team jobs
router.get('/:jobId/report', validation.getJobReport, getJobReportController as RequestHandler);

// Get single job (must be last to avoid conflicts)
router.get('/:id', validation.getJob, getJobController as RequestHandler);

export default router;
