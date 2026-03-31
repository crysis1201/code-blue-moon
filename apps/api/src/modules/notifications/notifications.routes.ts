import { Router } from 'express';
import { authenticate } from '../../common/middleware/index.js';
import * as ctrl from './notifications.controller.js';

const router: ReturnType<typeof Router> = Router();

router.get('/', authenticate, ctrl.getNotifications);
router.post('/:id/read', authenticate, ctrl.markAsRead);
router.post('/read-all', authenticate, ctrl.markAllAsRead);
router.put('/fcm-token', authenticate, ctrl.updateFcmToken);

export default router;
