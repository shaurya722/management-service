import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  getProjectDropdownController,
  listProjectsController,
  updateProjectController,
  validation,
} from '@/controllers/company/project.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createProject, createProjectController as RequestHandler);
router.put('/:id', validation.updateProject, updateProjectController as RequestHandler);
router.delete('/:id', validation.deleteProject, deleteProjectController as RequestHandler);

// List and dropdown operations
router.post('/list', validation.listProjects, listProjectsController as RequestHandler);
router.get('/dropdown', getProjectDropdownController as RequestHandler);
router.get('/:id', validation.getProject, getProjectController as RequestHandler);

export default router;

