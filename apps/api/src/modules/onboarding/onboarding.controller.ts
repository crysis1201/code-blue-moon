import type { Request, Response, NextFunction } from 'express';
import * as onboardingService from './onboarding.service.js';
import * as verificationService from './verification.service.js';
import { BadRequestError } from '../../common/errors/index.js';

export async function createHouseholdProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await onboardingService.createHouseholdProfile(req.user!.id, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function createHelperProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await onboardingService.createHelperProfile(req.user!.id, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function setCookPricing(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await onboardingService.setCookPricing(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function submitAadhaarVerification(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new BadRequestError('Aadhaar photo is required');
    }
    const { aadhaarNumber } = req.body;
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestError('Valid 12-digit Aadhaar number is required');
    }

    const result = await verificationService.submitAadhaarVerification(
      req.user!.id,
      aadhaarNumber,
      `/uploads/${req.file.filename}`,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getVerificationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await verificationService.getVerificationStatus(req.user!.id);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}
