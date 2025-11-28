import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import { approveCompany, deleteCompany, listCompany, rejectCompany } from '@/models/company.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { CompanyValidation } from '@/validation/company.validation';
import {
  approveCompanyValidation,
  deleteCompanyValidation,
  listCompanyValidation,
  rejectCompanyValidation,
} from '@/validation/company.validation';

export const validation: CompanyValidation = {
  approveCompany: validator(approveCompanyValidation),
  rejectCompany: validator(rejectCompanyValidation),
  deleteCompany: validator(deleteCompanyValidation),
  listCompany: validator(listCompanyValidation),
};

export const approveCompanyController = catchAsync(async (req, res, next) => {
  const { id } = req.body || {};
  const approvedCompany = await approveCompany({ id });
  if (isAppError(approvedCompany)) return next(approvedCompany);

  return sendRes({
    data: { approvedCompany },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_CUSTOM('COMPANY', 'APPROVE_SUCCESS'),
    options: { showData: false },
  });
});

export const rejectCompanyController = catchAsync(async (req, res, next) => {
  const { id, reason } = req.body || {};

  const rejectedCompany = await rejectCompany({ id, reason });
  if (isAppError(rejectedCompany)) return next(rejectedCompany);

  return sendRes({
    data: { rejectedCompany },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_CUSTOM('COMPANY', 'REJECT_SUCCESS'),
    options: { showData: false },
  });
});

export const listCompanyController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, status, startDate, endDate, dateField, sortBy } = req.body || {};
  const data = await listCompany({
    page: Number(page),
    limit: Number(limit),
    search,
    field,
    sort,
    status,
    startDate,
    endDate,
    dateField,
    sortBy,
  });
  if (isAppError(data)) return next(data);
  return sendRes({
    data,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.COMPANY()),
    options: { showData: true },
  });
});

export const deleteCompanyController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Company ID is required', 400));
  }

  const result = await deleteCompany({ id });
  if (isAppError(result)) return next(result);

  return sendRes({
    data: result,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_CUSTOM('COMPANY', 'DELETE_SUCCESS'),
    options: { showData: false },
  });
});
