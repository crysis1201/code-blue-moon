import type { Request, Response, NextFunction } from 'express';
import * as locationsService from './locations.service.js';

export async function getServiceAreas(req: Request, res: Response, next: NextFunction) {
  try {
    const zone = req.query.zone as string | undefined;
    const areas = await locationsService.getServiceAreas(zone);
    res.json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
}

export async function validatePincode(req: Request, res: Response, next: NextFunction) {
  try {
    const pincode = req.params.pincode as string;
    const result = await locationsService.validatePincode(pincode);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getZones(req: Request, res: Response, next: NextFunction) {
  try {
    const zones = await locationsService.getZones();
    res.json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
}
