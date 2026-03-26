import { BaseService } from './base.service';

export interface AdminMetrics {
  uptime: string;
  avgPatientFlow: string;
  systemLatency: string;
  securityScore: string;
  activeQueues: number;
}

export interface DepartmentOversight {
  id: string;
  name: string;
  flow: string;
  wait: string;
  status: 'Open' | 'Critical' | 'Low' | 'Closed';
}

export interface AdminInsight {
  highestTraffic: { name: string; peak: string };
  bottleneck: { name: string; wait: string };
  revenueProjection: string;
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
}

export const adminService = new AdminService();
