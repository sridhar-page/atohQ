"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Play, 
  Pause, 
  UserCheck, 
  UserPlus, 
  Bell, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Clock,
  Activity,
  AlertCircle
} from "lucide-react";
import { receptionistService, ReceptionistQueue, ReceptionistStats } from "@/services/receptionist.service";
import { useSocket } from "@/hooks/useSocket";

export default function ReceptionistDashboard() {
  const [isPaused, setIsPaused] = useState(false);
  const [queueData, setQueueData] = useState<ReceptionistQueue | null>(null);
  const [stats, setStats] = useState<ReceptionistStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Real-time updates
  useSocket('tokenJoined', fetchData);
  useSocket('tokenUpdated', fetchData);
  useSocket('tokenCalled', fetchData);

  const handleAction = async (tokenId: string, action: 'CALL' | 'COMPLETE' | 'NO_SHOW') => {
    try {
      await receptionistService.performAction(tokenId, action);
      // Data will refresh via Socket events, but we can also trigger manually
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

  if (!queueData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl brand-glow flex items-center justify-center text-white font-black">Q</div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter italic">AtohQ STAFF</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<Activity size={20} />} label="Live Queue" active />
          <NavItem icon={<Users size={20} />} label="Receptionist" />
          <NavItem icon={<TrendingUp size={20} />} label="Performance" />
          <NavItem icon={<Bell size={20} />} label="System Alerts" />
        </nav>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest pl-2">
            <span>Shift End</span>
            <span className="text-emerald-600">4h 24m</span>
          </div>
          <div className="p-5 bg-slate-900 rounded-4xl text-white space-y-1 brand-glow">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Current Time</p>
            <p className="text-2xl font-black">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 space-y-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></span>
               <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Active Session</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">Main Reception <br /><span className="text-slate-400">Counter {isPaused ? "PAUSED" : "01"}</span></h1>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={togglePause}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
                isPaused ? "bg-amber-100/50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
            >
              {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
              {isPaused ? "RESUME QUEUE" : "PAUSE QUEUE"}
            </button>
            <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 border border-slate-900">
              <UserPlus size={20} />
              WALK-IN TOKEN
            </button>
          </div>
        </header>

        {/* Stats Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CompactStat label="Waiting" value={stats?.waitingCount || 0} icon={<Users size={20} />} trend="+2 new" />
          <CompactStat label="Avg. Waiting" value={stats?.avgWaitTime || "0m"} icon={<Clock size={20} />} trend="stable" />
          <CompactStat label="Efficiency" value={stats?.efficiency || "100%"} icon={<Activity size={20} />} trend="+4%" />
          <CompactStat label="Urgent" value={stats?.urgentCount || 0} icon={<AlertCircle size={20} />} trend="none" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Active Control Section */}
          <section className="xl:col-span-12 lg:xl:col-span-5">
            <div className="glass p-10 rounded-[3rem] brand-glow sticky top-10 space-y-8">
               <div className="flex items-center justify-between">
                 <span className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Currently Serving</span>
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-colors border border-slate-100"><MoreVertical size={20} /></button>
               </div>

               <div className="text-center space-y-4">
                  {queueData.serving && queueData.serving.length > 0 ? (
                    <>
                      <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-8xl font-black text-slate-900 tracking-tighter"
                      >
                        {queueData.serving[0].number}
                      </motion.div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-slate-900">{queueData.serving[0].name}</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{queueData.serving[0].service} / General Consultation</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-slate-300 font-black text-2xl uppercase tracking-tighter">No Active Patient</div>
                  )}
               </div>

               <div className="flex flex-col gap-4 pt-4">
                  <button 
                    disabled={!queueData.serving || queueData.serving.length === 0}
                    onClick={() => queueData.serving && queueData.serving.length > 0 && handleAction(queueData.serving[0].id, 'COMPLETE')}
                    className="w-full py-5 bg-emerald-600 text-white rounded-4xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    <UserCheck size={24} />
                    COMPLETE & NEXT
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      disabled={!queueData.serving || queueData.serving.length === 0}
                      onClick={() => queueData.serving && queueData.serving.length > 0 && handleAction(queueData.serving[0].id, 'NO_SHOW')}
                      className="py-4 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 disabled:opacity-50 transition-all"
                    >
                      NO-SHOW
                    </button>
                    <button 
                      disabled={!queueData.serving}
                      className="py-4 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 disabled:opacity-50 transition-all"
                    >
                      DELAY 5M
                    </button>
                  </div>
               </div>
            </div>
          </section>

          {/* Queue List Section */}
          <section className="xl:col-span-12 lg:xl:col-span-7 space-y-6">
            <div className="flex items-baseline justify-between px-4">
              <h3 className="text-2xl font-black text-slate-900">Up Next <span className="text-slate-300 font-normal ml-2">{queueData.queue.length} tokens</span></h3>
              <button 
                onClick={fetchData}
                className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
              >
                Refresh List
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {queueData.queue.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-4xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black text-slate-900 leading-none">{item.number}</span>
                          {item.priority > 0 && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Urgent</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-bold">{item.name} &bull; <span className="text-slate-400 font-medium">Joined {item.time}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"><Bell size={20} /></button>
                       <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"><MoreVertical size={20} /></button>
                       <button 
                        onClick={() => handleAction(item.id, 'CALL')}
                        className="ml-2 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-[0.2em] group-hover:bg-emerald-600 group-hover:text-white transition-all brand-glow"
                       >
                        CALL
                        <ChevronRight size={18} />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {queueData.queue.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold">
                  Queue is empty. Sit back and relax!
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
      active ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100 brand-glow" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
    }`}>
      {icon}
      {label}
    </button>
  );
}

function CompactStat({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
           {icon}
        </div>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
      </div>
      <div className="space-y-1 pl-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</h4>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
