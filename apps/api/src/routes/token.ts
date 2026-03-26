import { Router } from 'express';
import { PrismaClient, TokenStatus } from '@prisma/client';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Public: Join a queue
router.post('/join', asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const { queueId, name, phone } = req.body;

  if (!queueId || !name || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue || !queue.isActive) {
    return res.status(404).json({ message: 'Queue is not active or not found' });
  }

  // Auto-fetch tenantId if not provided (MVP convenience)
  const tenantId = req.body.tenantId || queue.tenantId;

  const count = await prisma.token.count({ 
    where: { 
      queueId, 
      tenantId,
      createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } // Reset daily
    } 
  });
  
  const prefix = queue.name.substring(0, 1).toUpperCase();
  const tokenNumber = `${prefix}-${100 + count + 1}`;

  const token = await prisma.token.create({
    data: { patientName: name, patientPhone: phone, queueId, tokenNumber, tenantId },
  });

  // Calculate position
  const position = await prisma.token.count({
    where: {
      queueId,
      status: TokenStatus.WAITING,
      createdAt: { lt: token.createdAt }
    }
  });

  io.to(`queue:${queueId}`).emit('queueUpdated', { type: 'TOKEN_JOINED', token });
  
  res.status(201).json({
    ...token,
    position: position + 1,
    estWait: (position + 1) * 10 // Mock: 10 mins per person
  });
}));

// Public: Get live status
router.get('/:id/status', asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const token = await prisma.token.findUnique({ 
    where: { id: req.params.id },
    include: { queue: true }
  });

  if (!token) return res.status(404).json({ message: 'Token not found' });

  const position = await prisma.token.count({
    where: {
      queueId: token.queueId,
      status: TokenStatus.WAITING,
      createdAt: { lt: token.createdAt }
    }
  });

  res.json({
    id: token.id,
    number: token.tokenNumber,
    position: token.status === TokenStatus.WAITING ? position + 1 : 0,
    estWait: token.status === TokenStatus.WAITING ? (position + 1) * 10 : 0,
    status: token.status,
    serviceName: token.queue.name
  });
}));

// Staff: Perform action on token
router.post('/:id/action', authMiddleware, roleMiddleware(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const { action } = req.body;

  let status: TokenStatus;
  switch (action) {
    case 'CALL': status = TokenStatus.SERVING; break;
    case 'COMPLETE': status = TokenStatus.COMPLETED; break;
    case 'NO_SHOW': status = TokenStatus.NO_SHOW; break;
    default: return res.status(400).json({ message: 'Invalid action' });
  }

  const updatedToken = await prisma.token.update({
    where: { id: req.params.id },
    data: { 
      status,
      calledAt: action === 'CALL' ? new Date() : undefined,
      completedAt: action === 'COMPLETE' ? new Date() : undefined
    },
  });

  io.to(`queue:${updatedToken.queueId}`).emit(action === 'CALL' ? 'tokenCalled' : 'queueUpdated', updatedToken);
  res.json(updatedToken);
}));

// Legacy/Compatibility
router.post('/next/:queueId', authMiddleware, roleMiddleware(['DOCTOR', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const { queueId } = req.params;

  const nextToken = await prisma.token.findFirst({
    where: { queueId, tenantId: req.user.tenantId, status: TokenStatus.WAITING },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  if (!nextToken) {
    return res.status(404).json({ message: 'No tokens waiting in this queue' });
  }

  const updatedToken = await prisma.token.update({
    where: { id: nextToken.id },
    data: { status: TokenStatus.SERVING, calledAt: new Date() },
  });

  io.to(`queue:${queueId}`).emit('tokenCalled', updatedToken);
  res.json(updatedToken);
}));

// Staff: Get all tokens for tenant
router.get('/', authMiddleware, roleMiddleware(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const tokens = await prisma.token.findMany({
    where: { 
      tenantId: req.user.tenantId,
      createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
    },
    orderBy: { createdAt: 'desc' },
    include: { queue: true }
  });
  res.json(tokens);
}));

// Staff: Get stats for receptionist
router.get('/stats', authMiddleware, roleMiddleware(['RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const tenantId = req.user.tenantId;
  const today = new Date(new Date().setHours(0,0,0,0));

  const [waitingCount, completedCount] = await Promise.all([
    prisma.token.count({ where: { tenantId, status: TokenStatus.WAITING, createdAt: { gte: today } } }),
    prisma.token.count({ where: { tenantId, status: TokenStatus.COMPLETED, createdAt: { gte: today } } })
  ]);

  res.json({
    waitingCount,
    avgWaitTime: "12 mins", // Mock or calculate
    efficiency: "94%",
    urgentCount: 0
  });
}));

export default router;
