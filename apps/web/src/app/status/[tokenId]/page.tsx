"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Clock, 
  ArrowLeft, 
  Bell, 
  MessageSquare,
  ShieldCheck,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { patientService, TokenResponse } from "@/services/patient.service";
import { useSocket } from "@/hooks/useSocket";
import { use } from "react";

export default function TokenStatus({ params: paramsPromise }: { params: Promise<{ tokenId: string }> }) {
  const params = use(paramsPromise);
  const tokenId = params.tokenId;
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await patientService.getTokenStatus(tokenId);
      setToken(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchStatus();
  }, [tokenId, fetchStatus]);

  // Real-time updates
  useSocket('tokenUpdated', (data) => {
    if (data.tokenId === tokenId || data.queueId === token?.queueId) {
      fetchStatus();
    }
  });

  useSocket('tokenCalled', (data) => {
    if (data.tokenId === tokenId) {
      fetchStatus();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Token Not Found</h2>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="p-6 md:px-12 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors">
          <ArrowLeft size={20} />
          <span>Exit Track</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl brand-glow flex items-center justify-center text-white font-black">Q</div>
        </div>
        <button className="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-emerald-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-10 space-y-10">
        {/* Token Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-emerald-700 rounded-2xl text-xs font-black tracking-widest uppercase border border-emerald-200">
            Live Token Status
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            {token.status === 'WAITING' ? "You're almost " : token.status === 'SERVING' ? "It's your " : "Session "}
            <br />
            <span className="text-emerald-600 italic">
              {token.status === 'WAITING' ? "there." : token.status === 'SERVING' ? "turn!" : "completed."}
            </span>
          </h1>
        </div>

        {/* Live Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12 rounded-[3.5rem] brand-glow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="grid md:grid-cols-2 gap-12 relative z-10 items-center">
            <div className="space-y-8 text-center md:text-left">
              <div className="space-y-2">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{token.serviceName || "Clinical Service"}</span>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Token {token.tokenNumber}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center md:items-start gap-2">
                  <div className="text-emerald-600"><Users size={24} /></div>
                  <span className="text-3xl font-black text-slate-900">{token.position}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">People Ahead</span>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center md:items-start gap-2">
                  <div className="text-emerald-600"><Clock size={24} /></div>
                  <span className="text-3xl font-black text-slate-900">{token.estWait}m</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Wait</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <MessageSquare size={18} />
                  Chat with Reception
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    className="text-slate-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="84"
                    cx="96"
                    cy="96"
                  />
                  <circle
                    className="text-emerald-500 transition-all duration-1000"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 84}
                    strokeDashoffset={2 * Math.PI * 84 * (token.position / 10)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="84"
                    cx="96"
                    cy="96"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 leading-none">{token.position}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{token.status}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 max-w-[200px] text-center italic">
                Refresh rate: Every 10s. Keep this page open for live alerts.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Clinical Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <InfoItem 
            icon={<ShieldCheck size={20} />} 
            title="Safe Zone" 
            desc="Wait in your car or the cafe. We'll buzz you." 
          />
          <InfoItem 
            icon={<Calendar size={20} />} 
            title="Next Step" 
            desc="Head to Counter 3 when your turn is called." 
          />
          <InfoItem 
            icon={<Bell size={20} />} 
            title="Fast Alerts" 
            desc="Receive SMS when you are next in line." 
          />
        </div>
      </main>

      <div className="mt-auto p-6 bg-white border-t border-slate-100 text-center">
         <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Partnered with City Hospital Group</p>
      </div>
    </div>
  );
}

function InfoItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider">{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
