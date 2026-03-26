"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Bell, 
  ChevronRight 
} from "lucide-react";
import { patientService, QueueResponse, TokenResponse } from "@/services/patient.service";

const joinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  queueId: z.string().min(1, "Please select a service"),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinQueue() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [queues, setQueues] = useState<QueueResponse[]>([]);
  const [token, setToken] = useState<TokenResponse | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  useEffect(() => {
    patientService.getActiveQueues().then(setQueues).catch(console.error);
  }, []);

  const onSubmit = async (data: JoinFormData) => {
    try {
      const resp = await patientService.joinQueue(data);
      setToken(resp);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to join queue. Please try again.");
    }
  };

  if (isSubmitted && token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-emerald-50/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-10 rounded-[2.5rem] max-w-md w-full text-center space-y-8 animate-float"
        >
          <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center brand-glow">
            <CheckCircle2 size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Spot Reserved!</h2>
            <p className="text-slate-500 font-medium">You&apos;re successfully in the queue.</p>
          </div>
          
          <div className="bg-emerald-600 p-8 rounded-3xl brand-glow transform hover:scale-[1.02] transition-transform">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-[0.2em]">Your Digital Token</span>
            <div className="text-7xl font-black text-white mt-1">{token.tokenNumber}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 border-y border-emerald-100/50">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                <Users size={18} />
                <span>{token.position}</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Ahead</p>
            </div>
            <div className="space-y-1 border-l border-emerald-100/50">
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                <Clock size={18} />
                <span>~{token.estWait}m</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Est. Wait</p>
            </div>
          </div>

          <button 
            onClick={() => router.push(`/status/${token.id}`)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Track Live Status
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="p-6 md:px-12 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl brand-glow flex items-center justify-center text-white font-black transform group-hover:rotate-6 transition-transform">Q</div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter italic">Q-EASE</span>
        </div>
        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
          ● Live & Active
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-12 md:py-20">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-200">
              <span className="animate-pulse">●</span> Re-imagining the Wait
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Wait where you&apos;re <br />
              <span className="text-emerald-600 italic">comfortable.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-md font-medium leading-relaxed">
              Join the clinical queue digitally. Get live updates and walk in only when it&apos;s your turn.
            </p>
            
            <div className="flex flex-wrap gap-8 pt-4">
              <Feature icon={<Clock size={20} />} text="Instant Tokens" />
              <Feature icon={<Users size={20} />} text="Live Position" />
              <Feature icon={<Bell size={20} />} text="Real-time Alerts" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 md:p-12 rounded-4xl brand-glow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Check-in Now</h3>
                <p className="text-slate-400 font-semibold text-sm">Please provide your details to join the queue.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <input 
                    {...register("name")}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-xs text-rose-500 font-bold pl-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    {...register("phone")}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                    placeholder="+91 9876543210"
                  />
                  {errors.phone && <p className="text-xs text-rose-500 font-bold pl-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Required Service</label>
                <div className="relative">
                  <select 
                    {...register("queueId")}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Select a department...</option>
                    {queues.map(q => (
                      <option key={q.id} value={q.id}>{q.name} ({q.currentWait} wait)</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="rotate-90" size={20} />
                  </div>
                </div>
                {errors.queueId && <p className="text-xs text-rose-500 font-bold pl-1">{errors.queueId.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-slate-900 text-white rounded-4xl font-black text-lg shadow-2xl shadow-slate-400 hover:bg-emerald-600 hover:shadow-emerald-200 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
              >
                {isSubmitting ? "Generating Token..." : "GET DIGITAL TOKEN"}
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
        &copy; 2026 Q-EASE Smart Healthcare Solutions. All rights reserved.
      </footer>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 border border-slate-100">
        {icon}
      </div>
      <span className="font-bold text-slate-700">{text}</span>
    </div>
  );
}
