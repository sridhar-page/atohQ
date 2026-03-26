import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

// Utility for async error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/login', asyncHandler(async (req: any, res: any) => {
  const { email, password } = req.body;
  const prisma: PrismaClient = req.app.get('prisma');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ 
    token, 
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId } 
  });
}));

export default router;
