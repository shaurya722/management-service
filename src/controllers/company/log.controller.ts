import constant from '@/constant';
import sendRes from '@/function/sendRes';
import { getLog, listLogs, validation } from '@/models/log.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';

export const listLogsController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { type, status, isFail, sortBy, sortOrder = 'desc', startDate, endDate } = req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listLogs({
    type,
    page: Number(page),
    limit: Number(limit),
    status,
    isFail,
    sortBy,
    sortOrder,
    startDate,
    endDate,
    tenantId: req.user.tenantId,
  });

  if (isAppError(data)) return next(data);

  return sendRes({
    data: data as unknown as Record<string, unknown>,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.LOG()),
    options: { showData: true },
  });
});

export const getLogController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type } = req.query;

  if (!id) {
    return next(AppError('Log ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const log = await getLog({ id, tenantId: req.user.tenantId, type: type as 'BLUE' | 'RED' });

  if (isAppError(log)) return next(log);

  if (!log) {
    return next(AppError('Log not found', 404));
  }

  return sendRes({
    data: { log },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.LOG()),
    options: { showData: true },
  });
});

export const getLogsByJobController = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { page = '1', limit = '10' } = req.query;
  const { type, status, isFail, sortBy, sortOrder = 'desc', startDate, endDate } = req.body || {};

  if (!jobId) {
    return next(AppError('Job ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listLogs({
    type,
    page: Number(page),
    limit: Number(limit),
    jobId,
    status,
    isFail,
    sortBy,
    sortOrder,
    startDate,
    endDate,
    tenantId: req.user.tenantId,
  });

  if (isAppError(data)) return next(data);

  return sendRes({
    data: data as unknown as Record<string, unknown>,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.LOG()),
    options: { showData: true },
  });
});

// Export validation for route layer
export { validation };
