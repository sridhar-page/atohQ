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
  const { queueId, name, phone, isEmergency } = req.body;

  if (!queueId || !name || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue || !queue.isActive) {
    return res.status(404).json({ message: 'Queue is not active or not found' });
  }

  const tenantId = req.body.tenantId || queue.tenantId;

  const count = await prisma.token.count({ 
    where: { 
      queueId, 
      createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
    } 
  });

  if (count >= queue.maxTokensPerDay) {
    return res.status(403).json({ message: 'Daily token limit reached for this department.' });
  }

  const now = new Date();
  const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  if (currentStr < queue.startTime || currentStr > queue.endTime) {
     return res.status(403).json({ message: `Registrations are only open between ${queue.startTime} and ${queue.endTime}` });
  }
  
  const prefix = isEmergency ? 'E' : queue.name.substring(0, 1).toUpperCase();
  const tokenNumber = `${prefix}-${100 + count + 1}`;

  const token = await prisma.token.create({
    data: { 
      patientName: name, 
      patientPhone: phone, 
      queueId, 
      tokenNumber, 
      tenantId,
      priority: isEmergency ? 100 : 0
    },
  });

  const position = await prisma.token.count({
    where: {
      queueId,
      status: TokenStatus.WAITING,
      priority: { lte: isEmergency ? 100 : 0 },
      createdAt: { lt: token.createdAt }
    }
  });

  io.to(`queue:${queueId}`).emit('queueUpdated', { type: 'TOKEN_JOINED', token });
  
  res.status(201).json({
    ...token,
    position: position + 1,
    estWait: (position + 1) * 10
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

// Staff: Complete current token and call next
router.post('/:id/complete-and-next', authMiddleware, roleMiddleware(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const tokenId = req.params.id;

  // 1. Find the current token to get its queueId
  const currentToken = await prisma.token.findUnique({ where: { id: tokenId } });
  if (!currentToken) return res.status(404).json({ message: 'Token not found' });

  // 2. Complete the current token
  const completedToken = await prisma.token.update({
    where: { id: tokenId },
    data: { 
      status: TokenStatus.COMPLETED,
      completedAt: new Date()
    },
  });

  // 3. Find and call the next token in the same queue
  const nextToken = await prisma.token.findFirst({
    where: { 
      queueId: currentToken.queueId, 
      tenantId: currentToken.tenantId, 
      status: TokenStatus.WAITING 
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  let calledToken: any = null;
  if (nextToken) {
    calledToken = await prisma.token.update({
      where: { id: nextToken.id },
      data: { 
        status: TokenStatus.SERVING,
        calledAt: new Date()
      },
    });
    io.to(`queue:${currentToken.queueId}`).emit('tokenCalled', calledToken);
  } else {
    io.to(`queue:${currentToken.queueId}`).emit('queueUpdated', { type: 'TOKEN_COMPLETED', token: completedToken });
  }

  res.json({ completed: completedToken, next: calledToken });
}));

// Staff: Perform action on token
router.post('/:id/action', authMiddleware, roleMiddleware(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const { action } = req.body;
  const tokenId = req.params.id;

  let status: TokenStatus;
  switch (action) {
    case 'CALL': status = TokenStatus.SERVING; break;
    case 'COMPLETE': status = TokenStatus.COMPLETED; break;
    case 'NO_SHOW': status = TokenStatus.NO_SHOW; break;
    default: return res.status(400).json({ message: 'Invalid action' });
  }

  // Find the target token first
  const targetToken = await prisma.token.findUnique({ where: { id: tokenId } });
  if (!targetToken) return res.status(404).json({ message: 'Token not found' });

  // Special Handling for CALL: If another token is already SERVING, complete it first
  if (action === 'CALL') {
    const existingServing = await prisma.token.findFirst({
      where: { 
        tenantId: targetToken.tenantId, 
        queueId: targetToken.queueId,
        status: TokenStatus.SERVING 
      }
    });

    if (existingServing && existingServing.id !== tokenId) {
      await prisma.token.update({
        where: { id: existingServing.id },
        data: { status: TokenStatus.COMPLETED, completedAt: new Date() }
      });
      // Optionally emit separate event, but queueUpdated for the current call will trigger a refresh anyway
    }
  }

  const updatedToken = await prisma.token.update({
    where: { id: tokenId },
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
    orderBy: { createdAt: 'asc' },
    include: { queue: true }
  });
  res.json(tokens);
}));

// Staff: Get stats for receptionist
router.get('/stats', authMiddleware, roleMiddleware(['RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const tenantId = req.user.tenantId;
  const today = new Date(new Date().setHours(0,0,0,0));

  const [waitingCount, completedCount, noShowCount, urgentCount] = await Promise.all([
    prisma.token.count({ where: { tenantId, status: TokenStatus.WAITING, createdAt: { gte: today } } }),
    prisma.token.count({ where: { tenantId, status: TokenStatus.COMPLETED, createdAt: { gte: today } } }),
    prisma.token.count({ where: { tenantId, status: TokenStatus.NO_SHOW, createdAt: { gte: today } } }),
    prisma.token.count({ where: { tenantId, priority: { gt: 0 }, status: TokenStatus.COMPLETED, createdAt: { gte: today } } })
  ]);

  const totalClosed = completedCount + noShowCount;
  const efficiency = totalClosed > 0 
    ? `${((noShowCount / totalClosed) * 100).toFixed(1)}%` 
    : "0%";

  res.json({
    waitingCount,
    avgWaitTime: waitingCount > 0 ? `${waitingCount * 8} mins` : "0 mins",
    efficiency,
    urgentCount
  });
}));

// Patient: Cancel token
router.post('/:id/cancel', asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const io = req.app.get('io');
  const tokenId = req.params.id;

  const token = await prisma.token.update({
    where: { id: tokenId },
    data: { status: TokenStatus.CANCELLED },
    include: { queue: true }
  });

  io.to(`queue:${token.queueId}`).emit('tokenUpdated', token);
  res.json({ message: 'Token cancelled successfully' });
}));

export default router;
