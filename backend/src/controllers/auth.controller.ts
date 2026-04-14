import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return sendResponse(res, 200, true, result, 'Login successful');
});
