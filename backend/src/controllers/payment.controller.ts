import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const record = asyncHandler(async (req: Request, res: Response) => {
  const collectorId = req.user!.id;
  const result = await paymentService.processPayment(req.body, collectorId);
  return sendResponse(res, 201, true, result, 'Payment recorded successfully');
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string | undefined;
  const method = req.query.method as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await paymentService.getPaymentHistory({ tenantId, method }, page, limit);
  return sendPaginatedResponse(res, 200, result.payments, result.total, result.page, result.limit);
});
