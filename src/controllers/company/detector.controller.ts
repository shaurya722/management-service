import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createDetector,
  deleteDetector,
  getBuiltInDetectors,
  getDetector,
  getDetectorDropdown,
  listDetectors,
  updateDetector,
} from '@/models/detector.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { DetectorValidation } from '@/validation/detector.validation';
import {
  createDetectorValidation,
  deleteDetectorValidation,
  getDetectorValidation,
  listDetectorsValidation,
  updateDetectorValidation,
} from '@/validation/detector.validation';

export const validation: DetectorValidation = {
  createDetector: validator(createDetectorValidation),
  updateDetector: validator(updateDetectorValidation),
  deleteDetector: validator(deleteDetectorValidation),
  getDetector: validator(getDetectorValidation),
  listDetectors: validator(listDetectorsValidation),
};

export const createDetectorController = catchAsync(async (req, res, next) => {
  const { detectorName, description, detectorType, confidence, regex } = req.body;
  const { user } = req;
  if (!user || !user.tenantId) {
    return next(AppError(constant.USER_NOT_FOUND(), constant.UNAUTHORIZED));
  }

  const newDetector = await createDetector({
    detectorName,
    description,
    detectorType,
    confidence,
    regex,
    tenantId: user.tenantId,
  });

  if (isAppError(newDetector)) return next(newDetector);

  return sendRes({
    data: { detector: newDetector },
    status: constant.CREATED,
    res,
    message: constant.DATA_CREATED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const updateDetectorController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { detectorName, description, detectorType, confidence, regex } = req.body || {};

  if (!id) {
    return next(AppError('Detector ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedDetector = await updateDetector({
    id,
    detectorName,
    description,
    detectorType,
    confidence,
    regex,
    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedDetector)) return next(updatedDetector);

  return sendRes({
    data: { detector: updatedDetector },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const deleteDetectorController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Detector ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const deletedDetector = await deleteDetector({ id, tenantId: req.user.tenantId });

  if (isAppError(deletedDetector)) return next(deletedDetector);

  return sendRes({
    data: { detector: deletedDetector },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.DETECTOR()),
    options: { showData: false },
  });
});

export const getDetectorController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Detector ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const detector = await getDetector({ id, tenantId: req.user.tenantId });

  if (isAppError(detector)) return next(detector);

  return sendRes({
    data: { detector },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const listDetectorsController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, creationType, detectorType, startDate, endDate, dateField, sortBy } =
    req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listDetectors({
    page: Number(page),
    limit: Number(limit),
    search,
    field,
    sort,
    creationType,
    detectorType,
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
    message: constant.DATA_RETRIEVED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const getDetectorDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const detectors = await getDetectorDropdown(req.user.tenantId);

  if (isAppError(detectors)) return next(detectors);

  return sendRes({
    data: { detectors },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const getBuildInDetectorsController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const detectors = await getBuiltInDetectors(req.user.tenantId);

  if (isAppError(detectors)) return next(detectors);

  return sendRes({
    data: { detectors },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});

export const getDetectorTypes = catchAsync(async (req, res) => {
  return sendRes({
    data: {
      detectorTypes: Object.values((await import('../../generated/index')).DetectorType),
    },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.DETECTOR()),
    options: { showData: true },
  });
});
