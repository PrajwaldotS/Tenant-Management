import { Request, Response } from 'express';
import * as propertyService from '../services/property.service';
import { sendResponse, sendPaginatedResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary } from '../utils/cloudinary';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // Upload single layout image if provided
  if (files?.layoutImage?.[0]) {
    const { url } = await uploadToCloudinary(files.layoutImage[0].buffer, 'properties/layouts');
    req.body.layoutImage = url;
  }

  // Upload multiple property photos if provided
  if (files?.images && files.images.length > 0) {
    const uploadPromises = files.images.map((file) =>
      uploadToCloudinary(file.buffer, 'properties/photos')
    );
    const results = await Promise.all(uploadPromises);
    req.body.images = results.map((r) => r.url);
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
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // Upload new layout image if provided
  if (files?.layoutImage?.[0]) {
    const { url } = await uploadToCloudinary(files.layoutImage[0].buffer, 'properties/layouts');
    req.body.layoutImage = url;
  }

  // Upload new property photos if provided (appended to existing ones)
  if (files?.images && files.images.length > 0) {
    const uploadPromises = files.images.map((file) =>
      uploadToCloudinary(file.buffer, 'properties/photos')
    );
    const results = await Promise.all(uploadPromises);
    const newImageUrls = results.map((r) => r.url);

    // Get existing images from the property and merge
    const existingProperty = await propertyService.getPropertyById(req.params.id, req.user!);
    req.body.images = [...(existingProperty.images || []), ...newImageUrls];
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
