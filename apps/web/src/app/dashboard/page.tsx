"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Play, 
  Pause, 
  UserCheck, 
  Clock,
  Activity,
  AlertCircle,
  Shield,
  ArrowRight,
  CheckCircle2,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSocket } from "@/hooks/useSocket";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';


// Services
import { receptionistService, ReceptionistQueue, ReceptionistStats } from "@/services/receptionist.service";
import { adminService, AdminMetrics, DepartmentOversight, AdminInsight } from "@/services/admin.service";
import { patientService, QueueResponse, TokenResponse } from "@/services/patient.service";

// --- Schemas ---
const joinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  queueId: z.string().min(1, "Please select a service"),
});
type JoinFormData = z.infer<typeof joinSchema>;

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState<"patient" | "receptionist" | "admin" | "status">("receptionist");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl brand-glow flex items-center justify-center text-white font-black">Q</div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter italic">AtohQ</span>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Master Controls</p>
          <NavButton 
            icon={<Users size={20} />} 
            label="Receptionist" 
            active={activeTab === "receptionist"} 
            onClick={() => setActiveTab("receptionist")} 
          />
          <NavButton 
            icon={<Shield size={20} />} 
            label="System Admin" 
            active={activeTab === "admin"} 
            onClick={() => setActiveTab("admin")} 
          />
          <NavButton 
            icon={<Zap size={20} />} 
            label="Self-Service" 
            active={activeTab === "patient"} 
            onClick={() => setActiveTab("patient")} 
          />
          <NavButton 
            icon={<Activity size={20} />} 
            label="Current Status" 
            active={activeTab === "status"} 
            onClick={() => setActiveTab("status")} 
          />

        </nav>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="p-5 bg-slate-900 rounded-3xl text-white space-y-1 brand-glow">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Time</p>
            <p className="text-2xl font-black">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 text-center">
            ● MVP Environment Active
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          {activeTab === "receptionist" && (
            <motion.div key="receptionist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ReceptionistView />
            </motion.div>
          )}
          {activeTab === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <AdminView />
            </motion.div>
          )}
          {activeTab === "patient" && (
            <motion.div key="patient" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <PatientView />
            </motion.div>
          )}
          {activeTab === "status" && (
            <motion.div key="status" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StatusView />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function ReceptionistView() {
  const [isPaused, setIsPaused] = useState(false);
  const [queueData, setQueueData] = useState<ReceptionistQueue | null>(null);
  const [stats, setStats] = useState<ReceptionistStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [qData, sData] = await Promise.all([
        receptionistService.getQueueData(),
        receptionistService.getStats().catch(() => ({ 
          waitingCount: 0, 
          avgWaitTime: "0m", 
          efficiency: "100%", 
          urgentCount: 0 
        }))
      ]);
      setQueueData(qData);
      setStats(sData);
    } catch (err) {
      console.error("Failed to fetch receptionist data:", err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  useSocket('tokenJoined', fetchData);
  useSocket('tokenUpdated', fetchData);
  useSocket('tokenCalled', fetchData);

  const handleAction = async (tokenId: string, action: 'CALL' | 'COMPLETE' | 'NO_SHOW' | 'COMPLETE_AND_NEXT') => {
    try {
      if (action === 'COMPLETE_AND_NEXT') {
        await receptionistService.completeAndNext(tokenId);
      } else {
        await receptionistService.performAction(tokenId, action);
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to perform ${action}:`, err);
      alert(`Action ${action} failed.`);
    }
  };


  const togglePause = async () => {
    if (!queueData) return;
    try {
      const newPausedState = !isPaused;
      await receptionistService.setQueueStatus(queueData.queueId, newPausedState);
      setIsPaused(newPausedState);
    } catch (err) {
      console.error("Failed to toggle pause:", err);
      alert("Failed to update queue status.");
    }
  };

  if (!queueData) return <LoadingSpinner />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></span>
             <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Active Reception</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">Main Counter <br /><span className="text-slate-400">Status: {isPaused ? "PAUSED" : "ACTIVE"}</span></h1>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={togglePause}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
              isPaused ? "bg-amber-100/50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}
          >
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <CompactStat label="Waiting" value={stats?.waitingCount || 0} icon={<Users size={20} />} trend="+2 new" />
        <CompactStat label="Avg. Wait" value={stats?.avgWaitTime || "0m"} icon={<Clock size={20} />} trend="stable" />
        <CompactStat label="Efficiency" value={stats?.efficiency || "100%"} icon={<Activity size={20} />} trend="+4%" />
        <CompactStat label="Urgent" value={stats?.urgentCount || 0} icon={<AlertCircle size={20} />} trend="none" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <section className="xl:col-span-5">
          <div className="glass p-10 rounded-[3rem] brand-glow space-y-8 bg-white/50 backdrop-blur-md border border-white shadow-xl">
             <span className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Currently Serving</span>
             <div className="text-center space-y-4 py-6">
                {queueData.serving ? (
                  <>
                    <div className="text-8xl font-black text-slate-900 tracking-tighter">{queueData.serving.number}</div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900">{queueData.serving.name}</p>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{queueData.serving.service}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-slate-300 font-black text-xl uppercase tracking-widest italic">No Active Token</div>
                )}
             </div>
              <button 
                 disabled={!queueData.serving}
                 onClick={() => queueData.serving && handleAction(queueData.serving.id, 'COMPLETE_AND_NEXT')}
                 className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
               >
                 <UserCheck size={24} />
                 COMPLETE & NEXT
               </button>

          </div>
        </section>

        <section className="xl:col-span-7 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 px-2">Up Next <span className="text-slate-300 font-normal ml-2">{queueData.queue.length} tokens</span></h3>
          <div className="space-y-4">
            {queueData.queue.map((item, idx) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{idx + 1}</div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900">{item.number}</span>
                      {item.priority > 0 && <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Urgent</span>}
                    </div>
                    <p className="text-sm text-slate-400 font-bold">{item.name} &bull; {item.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAction(item.id, 'CALL')}
                  className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                >
                  CALL
                </button>
              </motion.div>
            ))}
            {queueData.queue.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold italic">Queue is currently empty</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminView() {
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">System Intel</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Global Performance Oversight</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
             <Plus size={18} /> NEW SERVICE
           </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         <BigStat icon={<Users className="text-emerald-500" />} label="Visited Today" value={metrics?.visitedToday?.toString() || "0"} trend="+12% total" />
         <BigStat icon={<CheckCircle2 className="text-blue-500" />} label="Served Today" value={metrics?.servedToday?.toString() || "0"} trend="High Flow" />
         <BigStat icon={<Activity className="text-amber-500" />} label="In Queue" value={metrics?.waitingToday?.toString() || "0"} trend="Active" />
         <BigStat icon={<ShieldCheck className="text-indigo-500" />} label="Active Queues" value={metrics?.activeQueues?.toString() || "0"} trend="Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Chart Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="glass p-8 rounded-[3rem] brand-glow bg-white border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Daily Traffic Overview</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Patient Volume Flow (24h)</p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Live Flow</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights?.hourlyFlow || []}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
             <div className="glass p-8 rounded-[2.5rem] bg-white border border-slate-100 space-y-6">
                <h4 className="text-lg font-black text-slate-900">Service Efficiency</h4>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Service Time</span>
                         <span className="text-lg font-black text-emerald-600">{insights?.serviceStats.avg}m</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (insights?.serviceStats.avg || 0) * 5)}%` }} className="h-full bg-emerald-500 rounded-full" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Session</span>
                         <span className="text-lg font-black text-slate-900">{insights?.serviceStats.max}m</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (insights?.serviceStats.max || 0) * 2)}%` }} className="h-full bg-slate-900 rounded-full" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Session</span>
                         <span className="text-lg font-black text-slate-900">{insights?.serviceStats.min}m</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (insights?.serviceStats.min || 1) * 10)}%` }} className="h-full bg-slate-400 rounded-full" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-slate-900">Departments</h3>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  {departments.slice(0, 3).map((dept) => (
                    <div key={dept.id} className="p-5 flex items-center justify-between border-b border-slate-50 last:border-0">
                      <div>
                         <p className="text-sm font-black text-slate-900">{dept.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dept.flow}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${dept.status === 'Critical' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{dept.status}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* Sidebar Insights Section */}
        <section className="lg:col-span-4 space-y-6">
           <div className="glass p-8 rounded-[2.5rem] brand-glow bg-slate-900 text-white border border-slate-800 space-y-8 h-full">
              <div>
                <h4 className="text-lg font-black italic">Strategic Insights</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Performance</p>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400"><Users size={20} /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Highest Traffic Node</p>
                         <p className="text-lg font-black leading-none">{insights?.highestTraffic.name || "N/A"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-400"><Clock size={20} /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Peak Bottleneck</p>
                         <p className="text-lg font-black leading-none">{insights?.bottleneck.name || "N/A"}</p>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue Projection</p>
                   <p className="text-4xl font-black tracking-tighter text-emerald-400">{insights?.revenueProjection}</p>
                   <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">Growth</span>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black">+14.2%</span>
                   </div>
                </div>

                <button className="w-full py-4 bg-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">Generate Report</button>
              </div>
           </div>
        </section>
      </div>

    </div>
  );
}

function PatientView() {
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [queues, setQueues] = useState<QueueResponse[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    patientService.getActiveQueues().then(setQueues).catch(console.error);
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinFormData) => {
    try {
      const resp = await patientService.joinQueue(data);
      setToken(resp);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    }
  };

  const reset = () => {
    setIsSubmitted(false);
    setToken(null);
  };

  if (isSubmitted && token) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-600 p-12 rounded-[3.5rem] text-white text-center space-y-8 brand-glow shadow-2xl shadow-emerald-200">
          <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={48} /></div>
          <h2 className="text-4xl font-black tracking-tight leading-none uppercase italic">Spot Confirmed</h2>
          <div className="bg-white p-10 rounded-[2.5rem] text-slate-900 shadow-xl inline-block min-w-[280px]">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">Registration ID</span>
             <p className="text-7xl font-black tracking-tighter text-emerald-600 leading-none">{token.tokenNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 py-6 border-t border-white/20">
             <div className="space-y-1">
               <p className="text-3xl font-black leading-none">{token.position}</p>
               <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Ahead of You</p>
             </div>
             <div className="space-y-1">
               <p className="text-3xl font-black leading-none">{token.estWait}m</p>
               <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Est. Buffer</p>
             </div>
          </div>
          <button onClick={reset} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">OKAY, GOT IT</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-emerald-700 rounded-2xl text-[10px] font-black tracking-widest uppercase border border-emerald-200">Instant Check-in Portal</div>
        <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">Register in <br /><span className="text-emerald-600">seconds.</span></h1>
      </header>

      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl brand-glow">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Identity</label>
              <input {...register("name")} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900" placeholder="John Wick" />
              {errors.name && <p className="text-xs text-rose-500 font-bold pl-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Relay</label>
              <input {...register("phone")} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900" placeholder="+1-xxx-xxx-xxxx" />
              {errors.phone && <p className="text-xs text-rose-500 font-bold pl-1">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Service Node</label>
              <select {...register("queueId")} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 appearance-none">
                <option value="">Select Service...</option>
                {queues.map(q => <option key={q.id} value={q.id}>{q.name} ({q.currentWait} wait)</option>)}
              </select>
              {errors.queueId && <p className="text-xs text-rose-500 font-bold pl-1">{errors.queueId.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-slate-900 text-white rounded-4xl font-black text-lg tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 group">
            {isSubmitting ? "SYNCING..." : "GENERATE TOKEN"}
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Simple Components ---

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${active ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100 brand-glow scale-105" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}`}>
      {icon}
      {label}
    </button>
  );
}

function LoadingSpinner() {
  return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
}

function CompactStat({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">{icon}</div>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
      </div>
      <div className="space-y-0.5">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</h4>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function BigStat({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-all group">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors uppercase italic font-black text-emerald-600">{icon}</div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</h4>
        <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatusView() {
  const [data, setData] = useState<ReceptionistQueue | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const qData = await receptionistService.getQueueData();
      setData(qData);
    } catch (err) {
      console.error("Failed to fetch status data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('tokenJoined', fetchData);
  useSocket('tokenUpdated', fetchData);
  useSocket('tokenCalled', fetchData);

  const allTokens = data ? [
    ...(data.serving ? [{ ...data.serving, id: data.serving.number, isServing: true }] : []),
    ...data.queue.map(t => ({ ...t, isServing: false }))
  ] : [];

  const selectedToken = allTokens.find(t => t.id === selectedTokenId);

  const getStatusMessage = (token: typeof allTokens[0]) => {
    if (token.isServing) {
      return `Token ${token.number} is in consultation with doctor.`;
    }
    
    const idx = data?.queue.findIndex(t => t.id === token.id) ?? -1;
    const waitTime = (idx + 1) * 10;

    if (idx === 0) {
      return "The next turn is yours.";
    } else if (idx === 1) {
      return "There is one more token ahead of you.";
    } else if (idx > 1) {
      return `There are ${idx} tokens ahead of you.`;
    }

    return "Status unknown";
  };

  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></span>
          <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Live Status Hub</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">Real-time Queue <br /><span className="text-slate-400">Status & Intel</span></h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 px-2">Active Tokens</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {allTokens.map((token) => (
              <motion.button
                key={token.id}
                onClick={() => setSelectedTokenId(token.id)}
                className={`w-full text-left p-6 rounded-3xl border transition-all shadow-sm flex items-center justify-between group ${
                  selectedTokenId === token.id 
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-100" 
                    : "bg-white border-slate-100 hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    token.isServing 
                      ? "bg-white/20 text-white" 
                      : (selectedTokenId === token.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600")
                  }`}>
                    {token.number.split('-')[1]}
                  </div>
                  <div>
                    <p className={`font-black ${selectedTokenId === token.id ? "text-white" : "text-slate-900"}`}>{token.number}</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${selectedTokenId === token.id ? "text-emerald-100" : "text-slate-400"}`}>
                      {token.isServing ? "SERVING" : "WAITING"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className={selectedTokenId === token.id ? "text-white" : "text-slate-300"} />
              </motion.button>
            ))}
            {allTokens.length === 0 && (
              <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold italic">
                No active tokens in system
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedToken ? (
              <motion.div
                key={selectedToken.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass p-12 rounded-[3.5rem] brand-glow bg-white border border-slate-100 h-full flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${selectedToken.isServing ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {selectedToken.isServing ? <Activity size={48} /> : <UserCheck size={48} />}
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status Intelligence</span>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter transition-all">{getStatusMessage(selectedToken)}</h2>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-md pt-10 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Patient Name</p>
                    <p className="text-xl font-black text-slate-900">{selectedToken.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Service Desk</p>
                    <p className="text-xl font-black text-slate-900">{selectedToken.service}</p>
                  </div>
                </div>

                {!selectedToken.isServing && (
                   <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase">
                     Live Position Tracking Active
                   </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <Search size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Select a Token</h3>
                  <p className="text-sm font-bold text-slate-400">Click on any token in the left pane to view detailed status intel.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

function InsightItem({ icon, title, value, sub }: { icon: React.ReactNode, title: string, value: string, sub: string }) {

  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{title}</p>
        <p className="text-sm font-black text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-[10px] text-slate-400 font-bold">{sub}</p>
      </div>
    </div>
  );
}
