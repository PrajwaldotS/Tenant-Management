import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { sendResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await reportService.getDashboardStats();
  return sendResponse(res, 200, true, stats);
});
