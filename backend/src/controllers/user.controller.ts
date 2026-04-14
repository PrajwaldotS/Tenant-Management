import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  return sendResponse(res, 201, true, user, 'User created successfully');
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await userService.getAllUsers(page, limit);
  return sendPaginatedResponse(res, 200, result.users, result.total, result.page, result.limit);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  return sendResponse(res, 200, true, user);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const user = await userService.toggleUserStatus(id, isActive);
  return sendResponse(res, 200, true, user, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
});
