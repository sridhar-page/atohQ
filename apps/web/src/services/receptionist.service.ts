import { BaseService } from './base.service';

export interface ReceptionistQueue {
  queueId: string;
  isPaused: boolean;
  serving: Array<{
    id: string;
    number: string;
    name: string;
    service: string;
    room: string;
  }>;

  queue: Array<{
    id: string;
    number: string;
    name: string;
    status: string;
    priority: number;
    time: string;
    service: string;
  }>;
}

export interface ReceptionistStats {
  waitingCount: number;
  avgWaitTime: string;
  efficiency: string;
  urgentCount: number;
}

export interface RawToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  status: string;
  priority: number;
  createdAt: string;
  queueId: string;
  queue: {
    name: string;
    roomNumber: string | null;
    isActive: boolean;
  };
}

class ReceptionistService extends BaseService {
  async getQueueData(departmentName?: string): Promise<ReceptionistQueue> {
    // For MVP, we'll fetch tokens and format them
    let tokens = await this.get<RawToken[]>('/api/tokens');
    
    if (departmentName) {
      tokens = tokens.filter(t => t.queue.name === departmentName);
    }

    const serving = tokens.filter(t => t.status === 'SERVING');
    const waiting = tokens.filter(t => t.status === 'WAITING');
    const queueId = tokens.length > 0 ? tokens[0].queueId : 'default-queue';
    const isPaused = tokens.length > 0 ? !tokens[0].queue.isActive : false;

    return {
      queueId,
      isPaused,
      serving: serving.map(t => ({
        id: t.id,
        number: t.tokenNumber,
        name: t.patientName,
        service: t.queue.name,
        room: t.queue.roomNumber || 'TBD'
      })).slice(0, 1), // Only show 1 serving slot for MVP

      queue: waiting.map(t => ({
        id: t.id,
        number: t.tokenNumber,
        name: t.patientName,
        status: t.status,
        priority: t.priority,
        time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        service: t.queue.name
      }))
    };
  }

  async performAction(tokenId: string, action: 'CALL' | 'COMPLETE' | 'NO_SHOW'): Promise<unknown> {
    return this.post(`/api/tokens/${tokenId}/action`, { action });
  }

  async completeAndNext(tokenId: string): Promise<unknown> {
    return this.post(`/api/tokens/${tokenId}/complete-and-next`);
  }


  async getStats(): Promise<ReceptionistStats> {
    return this.get<ReceptionistStats>('/api/tokens/stats');
  }

  async createToken(data: { name: string, phone: string, queueId: string, isEmergency?: boolean }): Promise<unknown> {
    return this.post('/api/tokens/join', data);
  }

  async setQueueStatus(queueId: string, isPaused: boolean): Promise<unknown> {
    const action = isPaused ? 'pause' : 'resume';
    return this.patch(`/api/queues/${queueId}/${action}`);
  }
}

export const receptionistService = new ReceptionistService();
