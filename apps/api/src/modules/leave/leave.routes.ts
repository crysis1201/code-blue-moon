import { Router } from 'express';
import { createLeaveSchema, approveLeaveSchema, createReplacementSchema } from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as ctrl from './leave.controller.js';

const leaveRouter: ReturnType<typeof Router> = Router();

leaveRouter.post('/request', authenticate, authorize('helper'), validate(createLeaveSchema), ctrl.requestLeave);
leaveRouter.post('/:id/approve', authenticate, authorize('household'), validate(approveLeaveSchema), ctrl.approveLeave);
leaveRouter.get('/requests', authenticate, ctrl.getLeaveRequests);

const replacementsRouter: ReturnType<typeof Router> = Router();

replacementsRouter.post('/request', authenticate, authorize('household'), validate(createReplacementSchema), ctrl.requestReplacement);
replacementsRouter.get('/:id/matches', authenticate, authorize('household'), ctrl.findMatches);
replacementsRouter.post('/:id/assign', authenticate, authorize('admin'), ctrl.assignSubstitute);
replacementsRouter.get('/:id', authenticate, ctrl.getReplacementStatus);

export { leaveRouter, replacementsRouter };
