import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createProject,
  deleteProject,
  getProject,
  getProjectDropdown,
  listProjects,
  updateProject,
} from '@/models/project.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { ProjectValidation } from '@/validation/project.validation';
import {
  createProjectValidation,
  deleteProjectValidation,
  getProjectValidation,
  listProjectsValidation,
  updateProjectValidation,
} from '@/validation/project.validation';

export const validation: ProjectValidation = {
  createProject: validator(createProjectValidation),
  updateProject: validator(updateProjectValidation),
  deleteProject: validator(deleteProjectValidation),
  getProject: validator(getProjectValidation),
  listProjects: validator(listProjectsValidation),
};

export const createProjectController = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    type,
    policyId,
    redModelType,
    redModelName,
    redModelUrl,
    redModelToken,
    redAuthorizationType,
    redRequestTemplate,
    agenticZipUrl,
    blueDomain,
  } = req.body;
  const { user } = req;

  if (!user || !user.tenantId) {
    return next(AppError(constant.USER_NOT_FOUND(), constant.UNAUTHORIZED));
  }

  const newProject = await createProject({
    name,
    description,
    type,
    policyId,
    redModelType,
    redModelName,
    redModelUrl,
    redModelToken,
    redAuthorizationType,
    redRequestTemplate,
    agenticZipUrl,
    blueDomain,
    tenantId: user.tenantId,
  });

  if (isAppError(newProject)) return next(newProject);

  return sendRes({
    data: { project: newProject },
    status: constant.CREATED,
    res,
    message: constant.DATA_CREATED(constant.MODULE.PROJECT()),
    options: { showData: true },
  });
});

export const updateProjectController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    description,
    type,
    policyId,
    redModelType,
    redModelName,
    redModelUrl,
    redModelToken,
    redAuthorizationType,
    redRequestTemplate,
    agenticZipUrl,
    blueDomain,
  } = req.body || {};

  if (!id) {
    return next(AppError('Project ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedProject = await updateProject({
    id,
    name,
    description,
    type,
    policyId,
    redModelType,
    redModelName,
    redModelUrl,
    redModelToken,
    redAuthorizationType,
    redRequestTemplate,
    agenticZipUrl,
    blueDomain,
    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedProject)) return next(updatedProject);

  return sendRes({
    data: { project: updatedProject },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.PROJECT()),
    options: { showData: true },
  });
});

export const deleteProjectController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Project ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const result = await deleteProject({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(result)) return next(result);

  return sendRes({
    data: {},
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.PROJECT()),
    options: { showData: false },
  });
});

export const getProjectController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Project ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const project = await getProject({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(project)) return next(project);

  return sendRes({
    data: { project },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROJECT()),
    options: { showData: true },
  });
});

export const listProjectsController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, type, startDate, endDate, dateField, sortBy } = req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const result = await listProjects({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    search,
    field,
    sort,
    type,
    startDate,
    endDate,
    dateField,
    sortBy,
    tenantId: req.user.tenantId,
  });

  if (isAppError(result)) return next(result);

  return sendRes({
    data: result,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROJECT()),
    options: { showData: true },
  });
});

export const getProjectDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const projects = await getProjectDropdown({
    tenantId: req.user.tenantId,
  });

  if (isAppError(projects)) return next(projects);

  return sendRes({
    data: { projects },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROJECT()),
    options: { showData: true },
  });
});
