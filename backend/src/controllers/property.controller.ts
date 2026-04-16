import { Request, Response } from 'express';
import * as propertyService from '../services/property.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary } from '../utils/cloudinary';

export const create = asyncHandler(async (req: Request, res: Response) => {
  // If an image file was uploaded via multer, upload it to Cloudinary
  if (req.file) {
    const { url } = await uploadToCloudinary(req.file.buffer, 'properties');
    req.body.layoutImage = url;
  }

  // Coerce numeric fields that arrive as strings from multipart/form-data
  if (req.body.floor !== undefined && req.body.floor !== '') {
    req.body.floor = Number(req.body.floor);
  } else {
    delete req.body.floor;
  }
  if (req.body.rentIncrement !== undefined && req.body.rentIncrement !== '') {
    req.body.rentIncrement = Number(req.body.rentIncrement);
  } else {
    delete req.body.rentIncrement;
  }

  const property = await propertyService.createProperty(req.body);
  return sendResponse(res, 201, true, property, 'Property created successfully');
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const user = req.user!;
  const result = await propertyService.getProperties(user, page, limit);
  return sendPaginatedResponse(res, 200, result.properties, result.total, result.page, result.limit);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.getPropertyById(req.params.id, req.user!);
  return sendResponse(res, 200, true, property);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  // If a new image file was uploaded, upload to Cloudinary
  if (req.file) {
    const { url } = await uploadToCloudinary(req.file.buffer, 'properties');
    req.body.layoutImage = url;
  }

  // Coerce numeric fields from multipart/form-data
  if (req.body.floor !== undefined && req.body.floor !== '') {
    req.body.floor = Number(req.body.floor);
  } else {
    delete req.body.floor;
  }
  if (req.body.rentIncrement !== undefined && req.body.rentIncrement !== '') {
    req.body.rentIncrement = Number(req.body.rentIncrement);
  } else {
    delete req.body.rentIncrement;
  }

  const property = await propertyService.updateProperty(req.params.id, req.body, req.user!);
  return sendResponse(res, 200, true, property, 'Property updated successfully');
});
