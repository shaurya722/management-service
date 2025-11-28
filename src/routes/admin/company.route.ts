import {
  approveCompanyController,
  deleteCompanyController,
  listCompanyController,
  rejectCompanyController,
  validation,
} from '@/controllers/admin/company.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

router.post('/approve', validation.approveCompany, approveCompanyController as RequestHandler);
router.post('/reject', validation.rejectCompany, rejectCompanyController as RequestHandler);
router.delete('/:id', validation.deleteCompany, deleteCompanyController as RequestHandler);
router.post('/list', validation.listCompany, listCompanyController as RequestHandler);

export default router;
