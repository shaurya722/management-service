import {
  createCategoryController,
  deleteCategoryController,
  getBuiltInCategoriesController,
  getCategoryController,
  getCategoryDropdownController,
  listCategoriesController,
  updateCategoryController,
  validation,
} from '@/controllers/company/category.controller';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// CRUD operations
router.post('/create', validation.createCategory, createCategoryController as RequestHandler);
router.put('/:id', validation.updateCategory, updateCategoryController as RequestHandler);
router.delete('/:id', validation.deleteCategory, deleteCategoryController as RequestHandler);

// List and utility operations
router.post('/list', validation.listCategories, listCategoriesController as RequestHandler);
router.get('/dropdown', getCategoryDropdownController as RequestHandler);
router.get('/built-in', getBuiltInCategoriesController as RequestHandler);
router.get('/:id', validation.getCategory, getCategoryController as RequestHandler);

export default router;
