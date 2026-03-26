"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  LayoutDashboard
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function StaffLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Invalid credentials");
      }

      localStorage.setItem('qease_auth_token', result.token);
      localStorage.setItem('qease_user', JSON.stringify(result.user));

      // Route to unified dashboard for MVP
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-3 group px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 transition-transform hover:scale-105">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm">Q</div>
            <span className="text-lg font-black text-slate-900 tracking-tighter italic">Q-EASE STAFF</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Access Console</h1>
          <p className="text-slate-500 font-medium">Enterprise Gateway for Healthcare Professionals</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] brand-glow">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Clinical Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  {...register("email")}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-900"
                  placeholder="name@clinic.com"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 font-bold pl-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
                <button type="button" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  {...register("password")}
                  type="password"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-bold pl-1">{errors.password.message}</p>}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
              >
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {isSubmitting ? "Authenticating..." : "Establish Connection"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-100 flex flex-col gap-3 group hover:border-emerald-200 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Self-Service</p>
              <p className="text-sm font-black text-slate-900">Patient Check-in</p>
            </div>
          </div>
          <div className="p-5 bg-white rounded-3xl border border-slate-100 flex flex-col gap-3 group hover:border-blue-200 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics</p>
              <p className="text-sm font-black text-slate-900">Live Status</p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          &copy; 2026 Q-Ease Systems &bull; High-Security Portal
        </p>
      </motion.div>
    </div>
  );
}
