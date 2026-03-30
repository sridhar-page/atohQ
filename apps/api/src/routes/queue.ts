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
      isActive: true,
      _count: {
        select: { tokens: { where: { status: 'WAITING' } } }
      }
    }
  });

  const formatted = queues.map(q => ({
    id: q.id,
    name: q.name,
    description: q.description,
    isOpen: q.isActive,
    currentWait: `${q._count.tokens} ${q._count.tokens === 1 ? 'token' : 'tokens'} waiting`
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

export default router;
