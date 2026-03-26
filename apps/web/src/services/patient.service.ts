import { BaseService } from './base.service';

export interface TokenResponse {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientPhone: string;
  status: string;
  position: number;
  estWait: number;
  queueId: string;
  serviceName?: string;
}

export interface QueueResponse {
  id: string;
  name: string;
  description: string;
  isOpen: boolean;
  currentWait: string;
}

class PatientService extends BaseService {
  async getActiveQueues(): Promise<QueueResponse[]> {
    return this.get<QueueResponse[]>('/api/queues/active');
  }

  async joinQueue(data: { name: string; phone: string; queueId: string }): Promise<TokenResponse> {
    return this.post<TokenResponse>('/api/tokens/join', data);
  }

  async getTokenStatus(tokenId: string): Promise<TokenResponse> {
    return this.get<TokenResponse>(`/api/tokens/${tokenId}/status`);
  }
}

export const patientService = new PatientService();
