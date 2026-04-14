import { Request, Response } from 'express';
import * as rentService from '../services/rent.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { month, dueDate } = req.body;
  const result = await rentService.generateMonthlyRents(month, new Date(dueDate));
  return sendResponse(res, 201, true, result, `Generated ${result.generated} rent records (${result.skipped} already existed)`);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const filters = {
    tenantId: req.query.tenantId as string | undefined,
    status: req.query.status as string | undefined,
    month: req.query.month as string | undefined,
  };
  const result = await rentService.getRents(filters, page, limit);
  return sendPaginatedResponse(res, 200, result.rents, result.total, result.page, result.limit);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const rent = await rentService.getRentById(req.params.id);
  return sendResponse(res, 200, true, rent);
});

export const markOverdue = asyncHandler(async (_req: Request, res: Response) => {
  const result = await rentService.markOverdueRents();
  return sendResponse(res, 200, true, result, `Marked ${result.markedOverdue} rents as overdue`);
});
