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
  Zap,
  Stethoscope,
  Monitor,
  Volume2,
  Edit2,
  Check,
  X,
  Info,
  XCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Ticket,
  Cog,
  Trash2
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
  const [activeTab, setActiveTab] = useState<"patient" | "receptionist" | "admin" | "status" | "specialist" | "display">("receptionist");

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
          <NavButton 
            icon={<Users size={20} />} 
            label="Reception" 
            active={activeTab === "receptionist"} 
            onClick={() => setActiveTab("receptionist")} 
          />
          <NavButton 
            icon={<Stethoscope size={20} />} 
            label="Specialist" 
            active={activeTab === "specialist"} 
            onClick={() => setActiveTab("specialist")} 
          />
          <NavButton 
            icon={<Monitor size={20} />} 
            label="Public Display" 
            active={activeTab === "display"} 
            onClick={() => setActiveTab("display")} 
          />
          <NavButton 
            icon={<Shield size={20} />} 
            label="System Admin" 
            active={activeTab === "admin"} 
            onClick={() => setActiveTab("admin")} 
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
          {activeTab === "specialist" && (
            <motion.div key="specialist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <SpecialistView />
            </motion.div>
          )}
          {activeTab === "display" && (
            <motion.div key="display" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DisplayView />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function ReceptionistView() {
  const [queueData, setQueueData] = useState<ReceptionistQueue | null>(null);
  const [stats, setStats] = useState<ReceptionistStats | null>(null);
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [regData, setRegData] = useState({ name: "", phone: "", queueId: "", isEmergency: false });
  const [allQueues, setAllQueues] = useState<QueueResponse[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [qData, sData, qList] = await Promise.all([
        receptionistService.getQueueData(),
        receptionistService.getStats().catch(() => ({ 
          waitingCount: 0, 
          avgWaitTime: "0m", 
          efficiency: "0%", 
          urgentCount: 0 
        })),
        patientService.getActiveQueues().catch(() => [])
      ]);
      setQueueData(qData);
      setStats(sData);
      setAllQueues(qList);
    } catch (err) {
      console.error("Failed to fetch receptionist data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
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
    }
  };

  const togglePause = async () => {
    if (!queueData) return;
    try {
      const newPausedState = !queueData.isPaused;
      await receptionistService.setQueueStatus(queueData.queueId, newPausedState);
      fetchData();
    } catch (err) {
      console.error("Failed to toggle pause:", err);
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
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">Main Counter <br /><span className="text-slate-400">Status: {queueData.isPaused ? "PAUSED" : "ACTIVE"}</span></h1>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowQuickReg(!showQuickReg)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black transition-all hover:bg-slate-800 shadow-xl shadow-slate-200"
          >
            <Plus size={20} />
            REGISTER WALK-IN
          </button>
          <button 
            onClick={togglePause}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
              queueData.isPaused ? "bg-amber-100/50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}
          >
            {queueData.isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            {queueData.isPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showQuickReg && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><Plus size={16} /></div>
                    <h3 className="text-xl font-black text-white italic">Intake Registration</h3>
                  </div>
                  <button onClick={() => setShowQuickReg(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
               </div>
               
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 try {
                   await receptionistService.createToken(regData);
                   setRegData({ name: "", phone: "", queueId: "", isEmergency: false });
                   setShowQuickReg(false);
                   fetchData();
                 } catch (err) {
                   alert("Registration failed");
                 }
               }} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Patient Full Name</label>
                    <input className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-emerald-500 transition-all" placeholder="John Wick" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Relay</label>
                    <input className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-emerald-500 transition-all" placeholder="+1-xxx-xxx-xxxx" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Department</label>
                    <select className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-emerald-500 transition-all appearance-none" value={regData.queueId} onChange={e => setRegData({...regData, queueId: e.target.value})}>
                      <option value="" className="bg-slate-900">Select...</option>
                      {allQueues.map(q => <option key={q.id} value={q.id} className="bg-slate-900">{q.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 py-3.5 px-5 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all group" onClick={() => setRegData({...regData, isEmergency: !regData.isEmergency})}>
                    <div className={`w-10 h-6 rounded-full p-1 transition-all ${regData.isEmergency ? 'bg-rose-500' : 'bg-slate-700'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-all ${regData.isEmergency ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${regData.isEmergency ? 'text-rose-400' : 'text-slate-400'}`}>{regData.isEmergency ? 'Emergency Unit' : 'Standard Case'}</span>
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">CONFIRM & JOIN</button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <CompactStat label="Waiting" value={stats?.waitingCount || 0} icon={<Users size={20} />} trend="+2 new" />
        <CompactStat label="Avg. Wait" value={stats?.avgWaitTime || "0m"} icon={<Clock size={20} />} trend="stable" />
        <CompactStat label="No Show" value={stats?.efficiency || "0%"} icon={<Activity size={20} />} trend="Today" />
        <CompactStat label="Urgent" value={stats?.urgentCount || 0} icon={<AlertCircle size={20} />} trend="none" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <section className="xl:col-span-5">
          <div className="glass p-10 rounded-[3rem] brand-glow space-y-8 bg-white/50 backdrop-blur-md border border-white shadow-xl">
             <span className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Currently Serving</span>
             <div className="text-center space-y-4 py-6">
                {queueData.serving.length > 0 ? (
                  <>
                    <div className="text-8xl font-black text-slate-900 tracking-tighter">{queueData.serving[0].number}</div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900">{queueData.serving[0].name}</p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{queueData.serving[0].service}</p>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Room {queueData.serving[0].room}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button 
                         onClick={() => handleAction(queueData.serving[0].id, 'COMPLETE_AND_NEXT')}
                         className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                       >
                         <UserCheck size={24} />
                         NEXT
                       </button>
                       <button 
                         onClick={() => handleAction(queueData.serving[0].id, 'NO_SHOW')}
                         className="px-8 py-5 bg-rose-50 text-rose-600 rounded-3xl font-black text-sm hover:bg-rose-100 transition-all border border-rose-100"
                       >
                         NO SHOW
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="py-10 text-slate-300 font-black text-xl uppercase tracking-widest italic">No Active Token</div>
                    {queueData.queue.length > 0 && (
                      <button 
                        onClick={() => handleAction(queueData.queue[0].id, 'CALL')}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl tracking-widest hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                      >
                        <Zap size={24} className="text-amber-400 group-hover:scale-125 transition-transform" />
                        START QUEUE
                      </button>
                    )}
                  </div>
                )}
             </div>
          </div>
        </section>

        <section className="xl:col-span-7 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 px-2">Up Next <span className="text-slate-300 font-normal ml-2">{queueData.queue.length} tokens</span></h3>
          <div className="grid grid-cols-1 gap-4">
            {queueData.queue.map((item, idx) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{idx + 1}</div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900">{item.number}</span>
                      {item.priority > 0 && <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Urgent</span>}
                    </div>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{item.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAction(item.id, 'CALL')}
                    className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    title="Call Next"
                  >
                    <Zap size={20} />
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'NO_SHOW')}
                    className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    title="No Show"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
            {queueData.queue.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold italic">Queue is currently empty</div>}
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roomValue, setRoomValue] = useState("");
  const [quotaValue, setQuotaValue] = useState(100);
  const [startTimeValue, setStartTimeValue] = useState("09:00");
  const [endTimeValue, setEndTimeValue] = useState("17:00");

  const fetchData = useCallback(async () => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateDept = async (id: string) => {
    try {
      await adminService.updateQueue(id, { 
        roomNumber: roomValue,
        maxTokensPerDay: quotaValue,
        startTime: startTimeValue,
        endTime: endTimeValue
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">System Intel</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Global Performance Oversight</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
             <Plus size={18} /> NEW SERVICE
           </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
         <BigStat icon={<Users className="text-emerald-500" />} label="Visited Today" value={metrics?.visitedToday?.toString() || "0"} trend="+12% total" />
         <BigStat icon={<CheckCircle2 className="text-blue-500" />} label="Served Today" value={metrics?.servedToday?.toString() || "0"} trend="High Flow" />
         <BigStat icon={<Activity className="text-amber-500" />} label="In Queue" value={metrics?.waitingToday?.toString() || "0"} trend="Active" />
         <BigStat icon={<Zap className="text-indigo-500" />} label="Service Nodes" value={metrics?.activeQueues?.toString() || "0"} trend="Global" />
         <BigStat icon={<X className="text-rose-500" />} label="Canceled" value={metrics?.cancelledToday?.toString() || "0"} trend="Today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8 space-y-6">
           <div className="glass p-8 rounded-[3rem] brand-glow bg-white border border-slate-100 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 leading-none">Daily Traffic Overview</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Patient Volume Flow (24h)</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Live Flow</span>
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
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }} />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorFlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-[2.5rem] bg-white border border-slate-100 space-y-6">
                 <h4 className="text-lg font-black text-slate-900">Service Efficiency</h4>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Service Time</span>
                          <span className="text-lg font-black text-emerald-600">{insights?.serviceStats.avg}m</span>
                       </div>
                       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (insights?.serviceStats.avg || 0) * 5)}%` }} className="h-full bg-emerald-500 rounded-full" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Max Session</span>
                          <span className="text-lg font-black text-slate-900">{insights?.serviceStats.max}m</span>
                       </div>
                       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (insights?.serviceStats.max || 0) * 2)}%` }} className="h-full bg-slate-900 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-lg font-black text-slate-900 px-2 italic">Departments</h4>
                 <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    {departments.map((dept) => (
                      <div key={dept.id} className="p-6 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all group relative">
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900">{dept.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dept.flow}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 relative">
                          <div className="text-right hidden sm:block">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{dept.startTime} - {dept.endTime}</p>
                             <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Limit: {dept.maxTokensPerDay}</p>
                          </div>
                          <div 
                            onClick={() => { 
                              setEditingId(dept.id); 
                              setRoomValue(dept.roomNumber || "");
                              setQuotaValue(dept.maxTokensPerDay);
                              setStartTimeValue(dept.startTime);
                              setEndTimeValue(dept.endTime);
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl border border-dashed border-slate-200 group-hover:border-emerald-500/50 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all cursor-pointer"
                          >
                             <Settings size={16} />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${dept.status === 'Critical' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>{dept.status}</span>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{dept.roomNumber ? `RM ${dept.roomNumber}` : 'NO ROOM'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[3rem] shadow-2xl border border-white p-10 w-full max-w-md space-y-8"
                      >
                         <div className="flex items-center justify-between">
                            <div>
                               <h3 className="text-2xl font-black text-slate-900 leading-none">Node Config</h3>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                 {departments.find(d => d.id === editingId)?.name}
                               </p>
                            </div>
                            <button onClick={() => setEditingId(null)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all"><X size={20} /></button>
                         </div>

                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Room Assignment</label>
                                  <div className="relative">
                                     <Monitor size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={roomValue} onChange={(e) => setRoomValue(e.target.value)} placeholder="000" />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Token Limit</label>
                                  <div className="relative">
                                     <Ticket size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={quotaValue} onChange={(e) => setQuotaValue(parseInt(e.target.value))} />
                                  </div>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Opening Time</label>
                                  <div className="relative">
                                     <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={startTimeValue} onChange={(e) => setStartTimeValue(e.target.value)} />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Closing Time</label>
                                  <div className="relative">
                                     <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={endTimeValue} onChange={(e) => setEndTimeValue(e.target.value)} />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="bg-amber-50 rounded-2xl p-4 flex gap-3">
                            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">Changes will affect live token distribution and clinic visibility immediately.</p>
                         </div>

                         <button 
                            onClick={() => handleUpdateDept(editingId)} 
                            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                         >
                            <ShieldCheck size={18} /> COMPLETE UPDATE
                         </button>
                      </motion.div>
                    </div>
                  )}
              </div>
           </div>
        </section>

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

function SpecialistView() {
  const [queueData, setQueueData] = useState<ReceptionistQueue | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const qData = await receptionistService.getQueueData('General Medicine');
      setQueueData(qData);
    } catch (err) {
      console.error("Failed to fetch specialist data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('tokenJoined', fetchData);
  useSocket('tokenUpdated', fetchData);
  useSocket('tokenCalled', fetchData);

  const handleAction = async (tokenId: string, action: 'CALL' | 'COMPLETE' | 'COMPLETE_AND_NEXT') => {
    try {
      if (action === 'COMPLETE_AND_NEXT') {
        await receptionistService.completeAndNext(tokenId);
      } else {
        await receptionistService.performAction(tokenId, action as any);
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to perform ${action}:`, err);
    }
  };

  const togglePause = async () => {
    if (!queueData) return;
    try {
      const newPausedState = !queueData.isPaused;
      await receptionistService.setQueueStatus(queueData.queueId, newPausedState);
      fetchData();
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  if (loading || !queueData) return <LoadingSpinner />;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></span>
             <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Specialist Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">General Medicine Hub <br /><span className="text-slate-400">Status: {queueData.isPaused ? "PAUSED" : "AVAILABLE"}</span></h1>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={togglePause}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
              queueData.isPaused ? "bg-amber-100/50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}
          >
            {queueData.isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            {queueData.isPaused ? "SET AVAILABLE" : "PAUSE SERVICE"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <section className="xl:col-span-5">
          <div className="glass p-10 rounded-[3rem] brand-glow space-y-8 bg-white/50 backdrop-blur-md border border-white shadow-xl">
             <span className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Now Consulting</span>
             <div className="text-center space-y-4 py-10">
                {queueData.serving.length > 0 ? (
                  <>
                    <div className="text-8xl font-black text-slate-900 tracking-tighter transition-all">{queueData.serving[0].number}</div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900">{queueData.serving[0].name}</p>
                      <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Room {queueData.serving[0].room}</p>
                    </div>
                    <button 
                       disabled={queueData.isPaused}
                       onClick={() => handleAction(queueData.serving[0].id, 'COMPLETE_AND_NEXT')}
                       className={`w-full mt-6 py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 ${
                        queueData.isPaused ? "opacity-50 cursor-not-allowed filter grayscale" : "hover:bg-emerald-700"
                       }`}
                    >
                      <UserCheck size={24} />
                      COMPLETE & CALL NEXT
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="py-10 text-slate-300 font-black text-xl uppercase tracking-widest italic">Waiting for Token</div>
                    {queueData.queue.length > 0 && (
                      <button 
                        disabled={queueData.isPaused}
                        onClick={() => handleAction(queueData.queue[0].id, 'CALL')}
                        className={`w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl tracking-widest hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 group ${
                          queueData.isPaused ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Zap size={24} className="text-amber-400 group-hover:scale-125 transition-transform" />
                        CALL NEXT PATIENT
                      </button>
                    )}
                  </div>
                )}
             </div>
          </div>
        </section>

        <section className="xl:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-2xl font-black text-slate-900">Patient Queue <span className="text-slate-300 font-normal ml-2">{queueData.queue.length} in line</span></h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BigStat icon={<Activity className="text-emerald-500" />} label="Wait Time" value={queueData.queue.length > 0 ? `${queueData.queue.length * 10}m` : "Ready"} trend="Flow" />
              <BigStat icon={<Clock className="text-blue-500" />} label="Queue Density" value={queueData.queue.length.toString()} trend="Active" />
           </div>
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {queueData.queue.map((item, idx) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{idx + 1}</div>
                    <div>
                      <span className="text-xl font-black text-slate-900">{item.number}</span>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.name}</p>
                    </div>
                  </div>
                  <button 
                    disabled={queueData.isPaused}
                    onClick={() => handleAction(item.id, 'CALL')}
                    className={`bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 hover:text-white transition-all ${queueData.isPaused ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    CALL
                  </button>
                </div>
              ))}
              {queueData.queue.length === 0 && <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold italic">No patients in queue</div>}
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
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    patientService.getActiveQueues().then(setQueues).catch(console.error);
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinFormData) => {
    setFormError(null);
    try {
      const resp = await patientService.joinQueue(data);
      setToken(resp);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || err.message || "Registration failed. Please visit reception.");
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
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Full Name</label>
                    <input 
                      {...register("name")}
                      type="text" 
                      placeholder="e.g. John Doe"
                      className={`w-full bg-slate-50 border p-5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-900 outline-none ${errors.name ? 'border-rose-400' : 'border-slate-100'}`}
                    />
                    {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-2 uppercase tracking-wide">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Phone Number</label>
                    <input 
                      {...register("phone")}
                      type="tel" 
                      placeholder="+91 99XXXXXX00"
                      className={`w-full bg-slate-50 border p-5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-900 outline-none ${errors.phone ? 'border-rose-400' : 'border-slate-100'}`}
                    />
                    {errors.phone && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-2 uppercase tracking-wide">{errors.phone.message}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Specialty Department</label>
                    <div className="relative group">
                      <select 
                        {...register("queueId")}
                        className={`w-full bg-white border p-6 rounded-[2.5rem] font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer appearance-none text-xl shadow-lg shadow-slate-100/50 ${errors.queueId ? 'border-rose-400' : 'border-slate-200'}`}
                      >
                        <option value="">Select Target Service...</option>
                        {queues.map(q => (
                          <option key={q.id} value={q.id} className="text-slate-900 font-bold py-4">
                            {q.name} ({q.currentWait})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-emerald-500 transition-colors">
                        <ChevronDown size={28} />
                      </div>
                    </div>
                    {errors.queueId && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-4 uppercase tracking-wide">{errors.queueId.message}</p>}
                  </div>
          </div>

          <AnimatePresence>
            {formError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex gap-4 items-center shadow-sm"
              >
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 shrink-0"><AlertCircle size={20} /></div>
                <div>
                   <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Registration Blocked</p>
                   <p className="text-sm font-bold text-rose-900 leading-tight">{formError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
  const [insights, setInsights] = useState<AdminInsight | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [qData, iData] = await Promise.all([
        receptionistService.getQueueData(),
        adminService.getInsights().catch(() => null)
      ]);
      setData(qData);
      setInsights(iData);
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
    ...data.serving.map(t => ({ ...t, isServing: true })),
    ...data.queue.map(t => ({ ...t, isServing: false }))
  ] : [];

  const selectedToken = allTokens.find(t => t.id === selectedTokenId);

  const getStatusMessage = (token: any) => {
    if (token.isServing) {
      return `Token ${token.number} is in consultation in Room ${token.room}.`;
    }
    
    const idx = data?.queue.findIndex(t => t.id === token.id) ?? -1;
    const waitTime = (idx + 1) * 10;

    if (idx === 0) {
      return "The next turn is yours.";
    } else if (idx === 1) {
      return "1 token ahead of you";
    } else if (idx > 1) {
      return `${idx} tokens ahead of you`;
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
                  <div className={`h-12 px-4 rounded-2xl flex items-center justify-center font-black text-lg ${
                    token.isServing 
                      ? "bg-white/20 text-white" 
                      : (selectedTokenId === token.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600")
                  }`}>
                    {token.number}
                  </div>
                  <div>
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
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Avg Wait Time</p>
                    <p className="text-xl font-black text-emerald-600">{insights?.serviceStats.avg || "10"} mins</p>
                  </div>
                </div>

                {!selectedToken.isServing && (
                   <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                     <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase">
                       Live Position Tracking Active
                     </div>
                     <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to cancel your token?")) {
                            await patientService.cancelToken(selectedToken.id);
                            fetchData();
                            setSelectedTokenId(null);
                          }
                        }}
                        className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:text-rose-700 transition-colors"
                     >
                       Cancel My Token
                     </button>
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

function DisplayView() {
  const [queueData, setQueueData] = useState<ReceptionistQueue | null>(null);
  const [lastCalled, setLastCalled] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await receptionistService.getQueueData();
      setQueueData(data);
      
      // Check if a new token was called to play sound
      const currentToken = data.serving.length > 0 ? data.serving[0].number : null;
      if (currentToken && currentToken !== lastCalled) {
        setLastCalled(currentToken);
        // Play sound could go here
      }
    } catch (err) {
      console.error("Failed to fetch display data:", err);
    }
  }, [lastCalled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket('tokenCalled', fetchData);
  useSocket('tokenUpdated', fetchData);

  if (!queueData) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col gap-10 bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden border border-slate-800 shadow-2xl">
      <header className="flex justify-between items-center bg-white/5 p-8 rounded-[2rem] border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">A</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none uppercase">Central Display</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Live Patient Queue Status</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black font-mono tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">System Online</p>
        </div>
      </header>

      <main className="flex-1 bg-white/5 rounded-[3.5rem] border border-white/10 p-10 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-emerald-500 uppercase text-[10px] font-black tracking-[0.3em]">
              <th className="px-8 py-6 text-left">Token Number</th>
              <th className="px-8 py-6 text-left">Room Number</th>
              <th className="px-8 py-6 text-left">Speciality</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {queueData.serving.map((token) => (
                <motion.tr 
                  key={token.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-all group"
                >
                  <td className="px-8 py-10">
                    <div className="text-7xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform origin-left inline-block">{token.number}</div>
                  </td>
                  <td className="px-8 py-10 text-4xl font-black italic text-emerald-400">
                    {token.room.toLowerCase().startsWith('room') ? token.room : `Room ${token.room}`}
                  </td>
                  <td className="px-8 py-10 text-2xl font-black text-slate-400 uppercase tracking-widest">
                    {token.service}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {queueData.serving.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-600 font-black uppercase italic text-2xl">Waiting for next patient...</div>
        )}
      </main>

      <footer className="h-16 flex items-center justify-between px-10 bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden">
        <div className="flex items-center gap-6 overflow-hidden">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex-shrink-0">Announcement</span>
          <div className="whitespace-nowrap flex gap-10">
             <p className="text-xs font-bold text-slate-400 animate-marquee">Please have your token number ready &bull; Follow directional signs to rooms &bull; Maintain social distancing &bull; Thank you for choosing AtohQ Service Excellence &bull; Visit our pharmacy for prescriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-10">
           <Volume2 size={16} className="text-slate-500" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audio Enabled</span>
        </div>
      </footer>
    </div>
  );
}
