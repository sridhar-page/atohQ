import { BaseService } from './base.service';

export interface ReceptionistQueue {
  queueId: string;
  serving: {
    id: string;
    number: string;
    name: string;
    service: string;
  } | null;

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
}

class ReceptionistService extends BaseService {
  async getQueueData(): Promise<ReceptionistQueue> {
    // For MVP, we'll fetch tokens and format them
    const tokens = await this.get<RawToken[]>('/api/tokens');
    const serving = tokens.find(t => t.status === 'SERVING');
    const waiting = tokens.filter(t => t.status === 'WAITING');
    const queueId = tokens.length > 0 ? tokens[0].queueId : 'default-queue';

    return {
      queueId,
      serving: serving ? {
        id: serving.id,
        number: serving.tokenNumber,
        name: serving.patientName,
        service: 'Clinical' // Mock or fetch from queue link
      } : null,

      queue: waiting.map(t => ({
        id: t.id,
        number: t.tokenNumber,
        name: t.patientName,
        status: t.status,
        priority: t.priority,
        time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        service: 'Clinical'
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

  async setQueueStatus(queueId: string, isPaused: boolean): Promise<unknown> {
    const action = isPaused ? 'pause' : 'resume';
    return this.patch(`/api/queues/${queueId}/${action}`);
  }
}

export const receptionistService = new ReceptionistService();
