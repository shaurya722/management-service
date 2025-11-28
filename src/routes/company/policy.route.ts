import {
  createPolicyController,
  deletePolicyController,
  getBuiltInPoliciesController,
  getPolicyController,
  getPolicyDropdownController,
  listPoliciesController,
  updatePolicyController,
  validation,
} from '@/controllers/company/policy.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createPolicy, createPolicyController as RequestHandler);
router.put('/:id', validation.updatePolicy, updatePolicyController as RequestHandler);
router.delete('/:id', validation.deletePolicy, deletePolicyController as RequestHandler);

// List and utility operations
router.post('/list', validation.listPolicies, listPoliciesController as RequestHandler);
router.get('/dropdown', getPolicyDropdownController as RequestHandler);
router.get('/built-in', getBuiltInPoliciesController as RequestHandler);
router.get('/:id', validation.getPolicy, getPolicyController as RequestHandler);

export default router;
