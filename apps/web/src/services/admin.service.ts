import { BaseService } from './base.service';

export interface AdminMetrics {
  uptime: string;
  visitedToday: number;
  servedToday: number;
  waitingToday: number;
  systemLatency: string;
  securityScore: string;
  activeQueues: number;
  avgPatientFlow: string;
  cancelledToday: number;
}


export interface DepartmentOversight {
  id: string;
  name: string;
  roomNumber: string | null;
  flow: string;
  wait: string;
  status: 'Open' | 'Critical' | 'Low' | 'Closed';
  maxTokensPerDay: number;
  startTime: string;
  endTime: string;
}

export interface AdminInsight {
  highestTraffic: { name: string; peak: string };
  bottleneck: { name: string; wait: string };
  revenueProjection: string;
  serviceStats: {
    avg: number;
    max: number;
    min: number;
  };
  hourlyFlow: Array<{ time: string; count: number }>;
}


class AdminService extends BaseService {
  async getMetrics(): Promise<AdminMetrics> {
    return this.get<AdminMetrics>('/api/admin/metrics');
  }

  async getDepartments(): Promise<DepartmentOversight[]> {
    return this.get<DepartmentOversight[]>('/api/admin/departments');
  }

  async getInsights(): Promise<AdminInsight> {
    return this.get<AdminInsight>('/api/admin/insights');
  }

  async updateQueue(id: string, data: Partial<DepartmentOversight>): Promise<void> {
    return this.patch<void>(`/api/queues/${id}`, data);
  }
}

export const adminService = new AdminService();
