import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createCategory,
  deleteCategory,
  getBuiltInCategories,
  getCategory,
  getCategoryDropdown,
  listCategories,
  updateCategory,
} from '@/models/category.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { CategoryValidation } from '@/validation/category.validation';
import {
  createCategoryValidation,
  deleteCategoryValidation,
  getCategoryValidation,
  listCategoriesValidation,
  updateCategoryValidation,
} from '@/validation/category.validation';

export const validation: CategoryValidation = {
  createCategory: validator(createCategoryValidation),
  updateCategory: validator(updateCategoryValidation),
  deleteCategory: validator(deleteCategoryValidation),
  getCategory: validator(getCategoryValidation),
  listCategories: validator(listCategoriesValidation),
};

export const createCategoryController = catchAsync(async (req, res, next) => {
  const { name, description, probes } = req.body || {};

  if (!name) {
    return next(AppError('Category name is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const newCategory = await createCategory({
    name,
    description,
    probes,
    tenantId: req.user.tenantId,
  });

  if (isAppError(newCategory)) return next(newCategory);

  return sendRes({
    data: { category: newCategory },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_CREATED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const updateCategoryController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, probes } = req.body || {};

  if (!id) {
    return next(AppError('Category ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedCategory = await updateCategory({
    id,
    name,
    description,
    probes,
    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedCategory)) return next(updatedCategory);

  return sendRes({
    data: { category: updatedCategory },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const deleteCategoryController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Category ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const result = await deleteCategory({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(result)) return next(result);

  return sendRes({
    data: result,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const getCategoryController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Category ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const category = await getCategory({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(category)) return next(category);

  return sendRes({
    data: { category },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const listCategoriesController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, startDate, endDate, dateField, sortBy } = req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listCategories({
    page: Number(page),
    limit: Number(limit),
    search,
    field,
    sort,
    startDate,
    endDate,
    dateField,
    sortBy,
    tenantId: req.user.tenantId,
  });

  if (isAppError(data)) return next(data);

  return sendRes({
    data,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const getCategoryDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const categories = await getCategoryDropdown(req.user.tenantId);

  if (isAppError(categories)) return next(categories);

  return sendRes({
    data: { categories },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});

export const getBuiltInCategoriesController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const categories = await getBuiltInCategories(req.user.tenantId);

  if (isAppError(categories)) return next(categories);

  return sendRes({
    data: { categories },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.CATEGORY()),
    options: { showData: true },
  });
});
