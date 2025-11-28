import constant from '@/constant';
import { Response } from 'express';

type SendRes = (params: {
  data: Record<string, unknown>;
  status: number;
  res: Response;
  message: string;
  options: {
    pagination?: boolean;
    showData?: boolean;
    showEmpty?: boolean;
  };
}) => void;
const sendRes: SendRes = ({ data, status, res, message, options }) => {
  const { showData, showEmpty } = options;
  if (!data && !showEmpty) {
    return res.status(constant.NOT_FOUND).json({
      message: 'No data found',
    });
  }
  const returnData = {
    message,
    ...(showData ? { data } : {}),
  };
  return res.status(status).json(returnData);
};

export default sendRes;
