"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Shield, 
  Plus, 
  Search, 
  Filter,
  Download,
  Layers,
  Activity,
  ArrowUpRight,
  Clock,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { adminService, AdminMetrics, DepartmentOversight, AdminInsight } from "@/services/admin.service";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentOversight[]>([]);
  const [insights, setInsights] = useState<AdminInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, d, i] = await Promise.all([
          adminService.getMetrics(),
          adminService.getDepartments(),
          adminService.getInsights()
        ]);
        setMetrics(m);
        setDepartments(d);
        setInsights(i);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-20 md:w-72 bg-slate-900 text-slate-400 p-6 flex flex-col gap-10 border-r border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black brand-glow">Q</div>
          <span className="hidden md:block text-2xl font-black text-white tracking-tighter italic">AtohQ ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          <AdminNavItem icon={<BarChart3 size={22} />} label="Analytics" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <AdminNavItem icon={<Layers size={22} />} label="Services" active={activeTab === "services"} onClick={() => setActiveTab("services")} />
          <AdminNavItem icon={<Users size={22} />} label="Clinicians" active={activeTab === "staff"} onClick={() => setActiveTab("staff")} />
          <AdminNavItem icon={<Settings size={22} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="pt-6 border-t border-slate-800 hidden md:block">
           <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cloud Usage</p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 w-3/4 h-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">75% of 1GB Plan</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 space-y-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">System Infrastructure</h1>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Management & Performance Control</p>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all">
              <Download size={16} />
              Export .CSV
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 brand-glow">
              <Plus size={18} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Global Performance Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <BigStat icon={<Activity className="text-emerald-500" />} label="Service Uptime" value={metrics?.uptime || "99%"} trend="+0.02%" />
           <BigStat icon={<Users className="text-blue-500" />} label="Avg. Patient Flow" value={metrics?.avgPatientFlow || "0/d"} trend="+12%" />
           <BigStat icon={<Clock className="text-amber-500" />} label="System Latency" value={metrics?.systemLatency || "0ms"} trend="-2ms" />
           <BigStat icon={<Shield className="text-indigo-500" />} label="Security Score" value={metrics?.securityScore || "A+"} trend="High" />
        </div>

        {/* Analytics & Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Service Management Table */}
          <section className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black text-slate-900">Active Departments</h3>
                <div className="flex items-center gap-2">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input className="bg-white border border-slate-100 pl-10 pr-4 py-2 rounded-lg text-xs font-bold outline-none focus:border-emerald-500 transition-all text-slate-700" placeholder="Search departments..." />
                   </div>
                   <button className="p-2 border border-slate-100 bg-white rounded-lg text-slate-400"><Filter size={16} /></button>
                </div>
             </div>

             <div className="clinical-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Department</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Flow</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wait Time</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {departments.map((dept) => (
                      <DeptRow 
                        key={dept.id}
                        name={dept.name} 
                        flow={dept.flow} 
                        wait={dept.wait} 
                        status={dept.status} 
                      />
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">No active departments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </section>

          {/* Quick Insights Sidebar */}
          <section className="lg:col-span-1 space-y-8">
             <div className="glass p-8 rounded-[2.5rem] brand-glow space-y-6 bg-white">
                <h4 className="text-lg font-black text-slate-900 border-b border-emerald-100 pb-4">Live Insights</h4>
                
                <div className="space-y-4">
                  <InsightItem 
                    icon={<Users size={16} />} 
                    title="Highest Traffic" 
                    value={insights?.highestTraffic.name || "N/A"} 
                    sub={`Peak at ${insights?.highestTraffic.peak || "N/A"}`} 
                  />
                  <InsightItem 
                    icon={<Clock size={16} />} 
                    title="Bottleneck" 
                    value={insights?.bottleneck.name || "N/A"} 
                    sub={`Wait up to ${insights?.bottleneck.wait || "N/A"}`} 
                  />
                  <InsightItem 
                    icon={<ArrowUpRight size={16} />} 
                    title="Revenue Est." 
                    value={insights?.revenueProjection || "$0"} 
                    sub="Daily projection" 
                  />
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 mt-4">
                   View Full Audit Log
                </button>
             </div>

             <div className="clinical-card p-6 flex items-center gap-4 group cursor-pointer bg-white">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                   <Shield size={20} />
                </div>
                <div className="flex-1">
                   <p className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">Security Center</p>
                   <p className="text-[10px] text-slate-400 font-bold mt-1">Manage backup & encryption</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
      active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white"
    }`}>
      <span className="shrink-0">{icon}</span>
      <span className="hidden md:block">{label}</span>
    </button>
  );
}

function BigStat({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="clinical-card p-6 flex flex-col gap-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{icon}</div>
        <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'} uppercase tracking-widest`}>{trend}</span>
      </div>
      <div className="space-y-1 pl-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</h4>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DeptRow({ name, flow, wait, status }: { name: string, flow: string, wait: string, status: string }) {
  const statusColor = status === "Critical" ? "text-rose-500 bg-rose-50" : status === "Low" ? "text-indigo-500 bg-indigo-50" : "text-emerald-500 bg-emerald-50";
  return (
    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
      <td className="p-5 pl-8 text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{name}</td>
      <td className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">{flow}</td>
      <td className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">{wait}</td>
      <td className="p-5">
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="p-5 pr-8 text-right">
        <button className="text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={18} /></button>
      </td>
    </tr>
  );
}

function InsightItem({ icon, title, value, sub }: { icon: React.ReactNode, title: string, value: string, sub: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-white/50 text-slate-400 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
        <p className="text-[10px] text-slate-400 font-bold">{sub}</p>
      </div>
    </div>
  );
}
