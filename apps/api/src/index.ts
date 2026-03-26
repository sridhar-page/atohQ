import express, { Request, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import authRoutes from './routes/auth';
import queueRoutes from './routes/queue';
import tokenRoutes from './routes/token';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const libsqlConfig = {
  url: process.env.DATABASE_URL || 'file:./dev.db',
};
const adapter = new PrismaLibSql(libsqlConfig);
const prisma: PrismaClient = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('joinQueue', (queueId: string) => {
    socket.join(`queue:${queueId}`);
    console.log(`Socket ${socket.id} joined room: queue:${queueId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// App Settings
app.set('io', io);
app.set('prisma', prisma);

app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin', adminRoutes);

interface CustomError extends Error {
  status?: number;
}

// Global Error Handler
app.use(
  (
    err: CustomError,
    req: Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {},
    });
  },
);

server.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
