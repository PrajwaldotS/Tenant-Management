import { Request, Response } from 'express';
import * as tenantService from '../services/tenant.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.createTenant(req.body);
  return sendResponse(res, 201, true, tenant, 'Tenant created successfully');
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await tenantService.getTenants(propertyId, page, limit);
  return sendPaginatedResponse(res, 200, result.tenants, result.total, result.page, result.limit);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.getTenantById(req.params.id);
  return sendResponse(res, 200, true, tenant);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.updateTenant(req.params.id, req.body);
  return sendResponse(res, 200, true, tenant, 'Tenant updated successfully');
});
