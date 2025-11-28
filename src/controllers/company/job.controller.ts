import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createJob,
  deleteJob,
  getJob,
  getJobDropdown,
  getJobReport,
  getJobsByProject,
  getJobsByStatus,
  listJobs,
  updateJob,
} from '@/models/job.model';
import { getProject } from '@/models/project.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { JobValidation } from '@/validation/job.validation';
import {
  createJobValidation,
  deleteJobValidation,
  getJobReportValidation,
  getJobValidation,
  listJobsValidation,
  updateJobValidation,
} from '@/validation/job.validation';

export const validation: JobValidation = {
  createJob: validator(createJobValidation),
  updateJob: validator(updateJobValidation),
  deleteJob: validator(deleteJobValidation),
  getJob: validator(getJobValidation),
  listJobs: validator(listJobsValidation),
  getJobReport: validator(getJobReportValidation),
};

export const createJobController = catchAsync(async (req, res, next) => {
  const { projectId, redAuthorizationValue, evaluationThreshold, agenticReport } = req.body;
  const { user } = req;
  if (!user || !user.tenantId) {
    return next(AppError(constant.USER_NOT_FOUND(), constant.UNAUTHORIZED));
  }
  if (!projectId) {
    return next(AppError('Project ID is required', 400));
  }
  const project = await getProject({ id: projectId, tenantId: user.tenantId });
  if (isAppError(project)) return next(project);

  const newJob = await createJob({
    projectId,
    status: (project.type === 'BLUE'
      ? 'STARTED'
      : 'PENDING') as import('../../generated/index').JobStatus,
    redAuthorizationValue,
    evaluationThreshold,
    agenticReport,
    tenantId: user.tenantId,
  });

  if (isAppError(newJob)) return next(newJob);

  return sendRes({
    data: { job: newJob },
    status: constant.CREATED,
    res,
    message: constant.DATA_CREATED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const updateJobController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { redAuthorizationValue, evaluationThreshold, agenticReport } = req.body || {};

  if (!id) {
    return next(AppError('Job ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedJob = await updateJob({
    id,
    redAuthorizationValue,
    evaluationThreshold,
    agenticReport,
    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedJob)) return next(updatedJob);

  return sendRes({
    data: { job: updatedJob },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const deleteJobController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Job ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const deletedJob = await deleteJob({ id, tenantId: req.user.tenantId });

  if (isAppError(deletedJob)) return next(deletedJob);

  return sendRes({
    data: { job: deletedJob },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.JOB()),
    options: { showData: false },
  });
});

export const getJobController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Job ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const job = await getJob({ id, tenantId: req.user.tenantId });

  if (isAppError(job)) return next(job);

  return sendRes({
    data: { job },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const listJobsController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const {
    search,
    field,
    sort,
    projectId,
    projectType,
    status,
    startDate,
    endDate,
    dateField,
    sortBy,
  } = req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listJobs({
    page: Number(page),
    limit: Number(limit),
    search,
    field,
    sort,
    projectId,
    projectType,
    status,
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
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const jobs = await getJobDropdown(req.user.tenantId);

  if (isAppError(jobs)) return next(jobs);

  return sendRes({
    data: { jobs },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobsByProjectController = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  if (!projectId) {
    return next(AppError('Project ID is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const jobs = await getJobsByProject({ projectId, tenantId: req.user.tenantId });

  if (isAppError(jobs)) return next(jobs);

  return sendRes({
    data: { jobs },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobsByStatusController = catchAsync(async (req, res, next) => {
  const { status } = req.params;

  if (!status) {
    return next(AppError('Status is required', 400));
  }

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const jobs = await getJobsByStatus({
    status: status as 'PENDING' | 'STARTED' | 'SUCCESS' | 'RETRY' | 'REVOKED' | 'FAILURE',
    tenantId: req.user.tenantId,
  });

  if (isAppError(jobs)) return next(jobs);

  return sendRes({
    data: { jobs },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobStatuses = catchAsync(async (req, res) => {
  return sendRes({
    data: {
      jobStatuses: Object.values((await import('../../generated/index')).JobStatus),
    },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobTypes = catchAsync(async (req, res) => {
  return sendRes({
    data: {
      jobTypes: Object.values((await import('../../generated/index')).Type),
    },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.JOB()),
    options: { showData: true },
  });
});

export const getJobReportController = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { month, year } = req.query;
  const { user } = req;

  if (!user || !user.tenantId) {
    return next(AppError(constant.USER_NOT_FOUND(), constant.UNAUTHORIZED));
  }

  if (!jobId) {
    return next(AppError('Job ID is required', 400));
  }

  const reportParams = {
    jobId,
    tenantId: user.tenantId,
    ...(month && { month: parseInt(month as string, 10) }),
    ...(year && { year: parseInt(year as string, 10) }),
  };

  const report = await getJobReport(reportParams);

  if (isAppError(report)) return next(report);

  return sendRes({
    data: report as unknown as Record<string, unknown>,
    status: constant.SUCCESS,
    res,
    message: 'Job report retrieved successfully',
    options: { showData: true },
  });
});
