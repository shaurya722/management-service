import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createProbe,
  deleteProbe,
  getBuiltInProbes,
  getProbe,
  getProbeDropdown,
  listProbes,
  updateProbe,
} from '@/models/probe.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { ProbeValidation } from '@/validation/probe.validation';
import {
  createProbeValidation,
  deleteProbeValidation,
  getProbeValidation,
  listProbesValidation,
  updateProbeValidation,
} from '@/validation/probe.validation';

// Export validation for route layer
export const validation: ProbeValidation = {
  createProbe: validator(createProbeValidation),
  updateProbe: validator(updateProbeValidation),
  deleteProbe: validator(deleteProbeValidation),
  getProbe: validator(getProbeValidation),
  listProbes: validator(listProbesValidation),
};

export const createProbeController = catchAsync(async (req, res, next) => {
  const { probeId, name, description } = req.body;
  const { user } = req;
  if (!user || !user.tenantId) {
    return next(AppError(constant.USER_NOT_FOUND(), constant.UNAUTHORIZED));
  }

  const newProbe = await createProbe({
    probeId,
    name,
    description,
    tenantId: user.tenantId,
  });

  if (isAppError(newProbe)) return next(newProbe);

  return sendRes({
    data: { probe: newProbe },
    status: constant.CREATED,
    res,
    message: constant.DATA_CREATED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});

export const updateProbeController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { probeId, name, description } = req.body || {};

  if (!id) {
    return next(AppError('Probe ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedProbe = await updateProbe({
    id,
    probeId,
    name,
    description,
    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedProbe)) return next(updatedProbe);

  return sendRes({
    data: { probe: updatedProbe },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});

export const deleteProbeController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Probe ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const deletedProbe = await deleteProbe({ id, tenantId: req.user.tenantId });

  if (isAppError(deletedProbe)) return next(deletedProbe);

  return sendRes({
    data: { probe: deletedProbe },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.PROBE()),
    options: { showData: false },
  });
});

export const getProbeController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Probe ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const probe = await getProbe({ id, tenantId: req.user.tenantId });

  if (isAppError(probe)) return next(probe);

  return sendRes({
    data: { probe },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});

export const listProbesController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, startDate, endDate, dateField, sortBy } = req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listProbes({
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
    message: constant.DATA_RETRIEVED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});

export const getProbeDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const probes = await getProbeDropdown(req.user.tenantId);

  if (isAppError(probes)) return next(probes);

  return sendRes({
    data: { probes },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});

export const getBuiltInProbesController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const probes = await getBuiltInProbes(req.user.tenantId);

  if (isAppError(probes)) return next(probes);

  return sendRes({
    data: { probes },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.PROBE()),
    options: { showData: true },
  });
});
