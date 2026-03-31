import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Public: Get active clinics/services
router.get('/active', asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  // In a real SaaS, we'd filter by tenant slug or domain
  // For MVP, we'll return all active queues
  const queues = await prisma.queue.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      roomNumber: true,
      isActive: true,
      maxTokensPerDay: true,
      startTime: true,
      endTime: true,
      _count: {
        select: { tokens: { where: { status: 'WAITING' } } }
      }
    }
  });

  const formatted = queues.map((q: any) => ({
    id: q.id,
    name: q.name,
    description: q.description,
    roomNumber: q.roomNumber,
    isOpen: q.isActive,
    maxTokensPerDay: q.maxTokensPerDay,
    startTime: q.startTime,
    endTime: q.endTime,
    currentWait: `${q._count.tokens} token waiting`
  }));

  res.json(formatted);
}));

// Staff: Get detailed queue overview
router.get('/', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const queues = await prisma.queue.findMany({
    where: { tenantId: req.user.tenantId },
    include: { 
      _count: { 
        select: { tokens: { where: { status: 'WAITING' } } } 
      } 
    },
  });
  res.json(queues);
}));

router.post('/', authMiddleware, roleMiddleware(['ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const queue = await prisma.queue.create({
    data: { 
      name: req.body.name,
      description: req.body.description,
      roomNumber: req.body.roomNumber,
      maxTokensPerDay: req.body.maxTokensPerDay || 100,
      startTime: req.body.startTime || "09:00",
      endTime: req.body.endTime || "17:00",
      tenantId: req.user.tenantId,
      isActive: true
    },
  });
  res.status(201).json(queue);
}));

router.patch('/:id/pause', authMiddleware, roleMiddleware(['RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const queue = await prisma.queue.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json(queue);
}));

router.patch('/:id/resume', authMiddleware, roleMiddleware(['RECEPTIONIST', 'ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  const queue = await prisma.queue.update({
    where: { id: req.params.id },
    data: { isActive: true },
  });
  res.json(queue);
}));

router.patch('/:id', authMiddleware, roleMiddleware(['ADMIN']), asyncHandler(async (req: any, res: any) => {
  const prisma: PrismaClient = req.app.get('prisma');
  
  const updateData: any = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.roomNumber !== undefined) updateData.roomNumber = req.body.roomNumber;
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
  if (req.body.maxTokensPerDay !== undefined) updateData.maxTokensPerDay = req.body.maxTokensPerDay;
  if (req.body.startTime !== undefined) updateData.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) updateData.endTime = req.body.endTime;

  const queue = await (prisma.queue as any).update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json(queue);
}));

export default router;
